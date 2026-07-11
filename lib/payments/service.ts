import type { PaymentProviderType } from "../store/types";
import { createPaymentRecord, getOrder, getPayment, updateOrder, updatePayment } from "../store/database";

export interface PaymentCreateResult {
  paymentId: string;
  provider: PaymentProviderType;
  amount: number;
  status: "pending" | "paid";
  checkoutUrl?: string;
  mode: "live" | "sandbox";
  message?: string;
}

function paymeConfigured() {
  return !!(process.env.PAYME_MERCHANT_ID && process.env.PAYME_KEY);
}

function clickConfigured() {
  return !!(process.env.CLICK_MERCHANT_ID && process.env.CLICK_SERVICE_ID && process.env.CLICK_SECRET_KEY);
}

/** Payme Subscribe API — https://developer.help.paycom.uz/ */
async function createPaymeCheckout(
  amount: number,
  orderId: string,
  paymentId: string
): Promise<{ checkoutUrl?: string; externalId?: string }> {
  const merchantId = process.env.PAYME_MERCHANT_ID!;
  const key = process.env.PAYME_KEY!;
  const baseUrl = process.env.PAYME_API_URL || "https://checkout.paycom.uz/api";

  const amountTiyin = amount * 100;
  const body = {
    jsonrpc: "2.0",
    id: Date.now(),
    method: "receipts.create",
    params: {
      amount: amountTiyin,
      account: { order_id: orderId },
      description: `404-GO buyurtma ${orderId}`,
    },
  };

  const auth = Buffer.from(`Paycom:${key}`).toString("base64");
  const res = await fetch(baseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Basic ${auth}`,
      "X-Auth": `${merchantId}:${key}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Payme API ${res.status}`);
  const data = (await res.json()) as { result?: { receipt?: { _id?: string } }; error?: { message?: string } };
  const receiptId = data.result?.receipt?._id;
  if (!receiptId) throw new Error(data.error?.message || "Payme receipt create failed");

  const checkoutUrl = `https://checkout.paycom.uz/${receiptId}`;
  return { checkoutUrl, externalId: receiptId };
}

/** Click prepare — https://docs.click.uz/ */
async function createClickCheckout(
  amount: number,
  orderId: string,
  paymentId: string
): Promise<{ checkoutUrl?: string; externalId?: string }> {
  const merchantId = process.env.CLICK_MERCHANT_ID!;
  const serviceId = process.env.CLICK_SERVICE_ID!;
  const secretKey = process.env.CLICK_SECRET_KEY!;
  const returnUrl = process.env.APP_URL || "https://nexgo-ai-super-mobility-platform.vercel.app";

  const merchantTransId = paymentId;
  const signString = `${merchantTransId}${serviceId}${secretKey}${amount}${merchantTransId}`;
  const crypto = await import("crypto");
  const sign = crypto.createHash("md5").update(signString).digest("hex");

  const params = new URLSearchParams({
    service_id: serviceId,
    merchant_id: merchantId,
    amount: String(amount),
    transaction_param: orderId,
    merchant_trans_id: merchantTransId,
    return_url: returnUrl,
    sign_string: sign,
  });

  return {
    checkoutUrl: `https://my.click.uz/services/pay?${params.toString()}`,
    externalId: merchantTransId,
  };
}

export async function initiatePayment(
  orderId: string,
  provider: PaymentProviderType,
  amount: number
): Promise<PaymentCreateResult> {
  const order = getOrder(orderId);
  if (!order) throw new Error("Order not found");

  const paymentId = `pay-${Date.now()}`;
  createPaymentRecord({
    id: paymentId,
    orderId,
    provider,
    amount,
    status: "pending",
    createdAt: new Date().toISOString(),
  });

  if (provider === "wallet") {
    updatePayment(paymentId, { status: "paid", paidAt: new Date().toISOString() });
    updateOrder(orderId, { paymentId, paymentStatus: "paid" });
    return { paymentId, provider, amount, status: "paid", mode: "sandbox", message: "Wallet debited" };
  }

  if (provider === "payme" && paymeConfigured()) {
    try {
      const { checkoutUrl, externalId } = await createPaymeCheckout(amount, orderId, paymentId);
      updatePayment(paymentId, { checkoutUrl, externalId });
      updateOrder(orderId, { paymentId, paymentStatus: "pending" });
      return { paymentId, provider, amount, status: "pending", checkoutUrl, mode: "live" };
    } catch (e) {
      console.error("Payme live error, sandbox fallback:", e);
    }
  }

  if (provider === "click" && clickConfigured()) {
    try {
      const { checkoutUrl, externalId } = await createClickCheckout(amount, orderId, paymentId);
      updatePayment(paymentId, { checkoutUrl, externalId });
      updateOrder(orderId, { paymentId, paymentStatus: "pending" });
      return { paymentId, provider, amount, status: "pending", checkoutUrl, mode: "live" };
    } catch (e) {
      console.error("Click live error, sandbox fallback:", e);
    }
  }

  // Sandbox — merchant kalitlari yo'q bo'lsa demo checkout
  const sandboxUrl = `${process.env.APP_URL || ""}/?payment=sandbox&pid=${paymentId}&provider=${provider}&amount=${amount}`;
  updatePayment(paymentId, {
    checkoutUrl: sandboxUrl,
    externalId: `sandbox-${paymentId}`,
  });
  updateOrder(orderId, { paymentId, paymentStatus: "pending" });

  return {
    paymentId,
    provider,
    amount,
    status: "pending",
    checkoutUrl: sandboxUrl,
    mode: "sandbox",
    message:
      "PAYME_MERCHANT_ID / CLICK_MERCHANT_ID .env da sozlang — hozir sandbox rejim",
  };
}

export async function confirmSandboxPayment(paymentId: string): Promise<PaymentCreateResult | null> {
  const payment = getPayment(paymentId);
  if (!payment || payment.status === "paid") return null;

  updatePayment(paymentId, { status: "paid", paidAt: new Date().toISOString() });
  updateOrder(payment.orderId, { paymentStatus: "paid" });

  return {
    paymentId,
    provider: payment.provider,
    amount: payment.amount,
    status: "paid",
    mode: "sandbox",
  };
}

export function getPaymentConfig() {
  return {
    payme: paymeConfigured(),
    click: clickConfigured(),
    uzum: !!process.env.UZUM_MERCHANT_ID,
  };
}

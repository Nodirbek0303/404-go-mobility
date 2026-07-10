import { useCallback, useRef, useState } from "react";
import { Language } from "../types";

interface UseVoiceOrderOptions {
  lang: Language;
  onResult: (text: string) => void;
  onError?: (msg: string) => void;
}

type SpeechRecognitionCtor = new () => {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((ev: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

function getSpeechRecognition(): SpeechRecognitionCtor | null {
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

const langMap: Record<Language, string> = {
  uz: "uz-UZ",
  ru: "ru-RU",
  en: "en-US",
};

export function useVoiceOrder({ lang, onResult, onError }: UseVoiceOrderOptions) {
  const [isListening, setIsListening] = useState(false);
  const [interimText, setInterimText] = useState("");
  const recognitionRef = useRef<InstanceType<SpeechRecognitionCtor> | null>(null);

  const startListening = useCallback(() => {
    const SpeechRecognition = getSpeechRecognition();
    if (!SpeechRecognition) {
      onError?.(
        lang === "uz"
          ? "Brauzeringiz ovozni qo'llab-quvvatlamaydi. Chrome ishlating."
          : lang === "ru"
            ? "Браузер не поддерживает голос."
            : "Browser does not support voice recognition."
      );
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = langMap[lang];
    recognition.continuous = false;
    recognition.interimResults = true;
    recognitionRef.current = recognition;

    recognition.onresult = (event) => {
      let final = "";
      let interim = "";
      const results = event.results as unknown as Array<{ isFinal?: boolean; 0: { transcript: string } }>;
      for (let i = 0; i < results.length; i++) {
        const t = results[i][0].transcript;
        if (results[i].isFinal) final += t;
        else interim += t;
      }
      if (interim) setInterimText(interim);
      if (final.trim()) {
        setInterimText(final.trim());
        onResult(final.trim());
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
      onError?.(lang === "uz" ? "Ovozni eshitib bo'lmadi" : "Could not recognize speech");
    };

    recognition.onend = () => setIsListening(false);

    setIsListening(true);
    setInterimText("");
    recognition.start();
  }, [lang, onResult, onError]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  return { isListening, interimText, startListening, stopListening, supported: !!getSpeechRecognition() };
}

"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Hero from "@/components/Hero";
import QuizStep from "@/components/QuizStep";
import type { QuizData } from "@/components/QuizStep";
import LoadingScreen from "@/components/LoadingScreen";
import ResultScreen from "@/components/ResultScreen";
import ConfirmScreen from "@/components/ConfirmScreen";
import { track } from "@/lib/track";

function compressToBase64(file: File, maxSize = 512, quality = 0.7): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let w = img.width, h = img.height;
      if (w > maxSize || h > maxSize) {
        const scale = maxSize / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      resolve(dataUrl.split(",")[1]);
    };
    img.onerror = () => reject(new Error("Falha ao carregar imagem"));
    img.src = URL.createObjectURL(file);
  });
}

const initialData: QuizData = {
  nome: "",
  dataNascimento: "",
  email: "",
  clube: "",
  jogadorFavorito: "",
  peso: "",
  altura: "",
  foto: null,
};

type AppStep = "hero" | "quiz-1" | "loading-photo" | "quiz-2" | "quiz-3" | "confirm" | "loading-generate" | "result";

interface HomeContentProps {
  checkoutUrl?: string;
  price?: string;
  firstButtonText?: string;
  purchaseButtonText?: string;
}

export default function HomeContent({ checkoutUrl, price, firstButtonText, purchaseButtonText }: HomeContentProps) {
  const [appStep, setAppStep] = useState<AppStep>(() => {
    if (typeof window !== "undefined") {
      const saved = sessionStorage.getItem("figurinha_sticker_url");
      if (saved) return "result";
    }
    return "hero";
  });
  const [quizStep, setQuizStep] = useState(1);
  const [data, setData] = useState<QuizData>(initialData);
  const [stickerUrl, setStickerUrl] = useState(() => {
    if (typeof window !== "undefined") return sessionStorage.getItem("figurinha_sticker_url") || "";
    return "";
  });
  const [stickerId, setStickerId] = useState(() => {
    if (typeof window !== "undefined") return sessionStorage.getItem("figurinha_sticker_id") || "";
    return "";
  });
  const [genStartTime, setGenStartTime] = useState(0);
  const [fotoPreviewUrl, setFotoPreviewUrl] = useState<string | null>(null);
  const dataRef = useRef(data);
  dataRef.current = data;
  const generatingRef = useRef(false);

  // Salvar UTMs da URL na chegada pra usar no checkout depois
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const utmKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content", "fbclid", "gclid", "ttclid", "sck"];
    for (const key of utmKeys) {
      const val = params.get(key);
      if (val) {
        try { localStorage.setItem(key, val); } catch { /* ignore */ }
      }
    }
  }, []);

  // Track de passos para o funil
  useEffect(() => {
    const stepMap: Partial<Record<AppStep, string>> = {
      "hero": "hero_view",
      "quiz-1": "quiz_1",
      "quiz-2": "quiz_2",
      "quiz-3": "quiz_3",
      "confirm": "confirm",
      "loading-generate": "loading",
      "result": stickerUrl ? "result_view" : "result_error",
    };
    const s = stepMap[appStep];
    if (!s) return;
    const { email, nome } = dataRef.current;
    track(s, { email: email || undefined, nome: nome || undefined });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appStep, stickerUrl]);

  // Proteger contra saída durante geração
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (appStep === "loading-generate") {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [appStep]);

  // Manter tela ligada durante geração (Wake Lock API)
  useEffect(() => {
    if (appStep !== "loading-generate") return;
    let wakeLock: WakeLockSentinel | null = null;
    const requestWakeLock = async () => {
      try {
        wakeLock = await navigator.wakeLock.request("screen");
      } catch {
        // Wake Lock não suportado ou negado
      }
    };
    requestWakeLock();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") requestWakeLock();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      wakeLock?.release();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [appStep]);

  const updateData = (fields: Partial<QuizData>) => {
    setData((prev) => ({ ...prev, ...fields }));
    if (fields.foto) {
      const url = URL.createObjectURL(fields.foto);
      setFotoPreviewUrl(url);
    }
  };

  const [errorTimestamp, setErrorTimestamp] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const generateFigurinha = useCallback(async (retryAfterError?: string, attempt = 0) => {
    if (generatingRef.current && attempt === 0) return;
    if (attempt === 0) generatingRef.current = true;
    const MAX_RETRIES = 4;
    if (attempt > MAX_RETRIES) { generatingRef.current = false; return; }

    const current = dataRef.current;
    try {
      if (!current.foto) throw new Error("Sem foto");

      const fotoBase64 = await compressToBase64(current.foto, 512, 0.7);

      const res = await fetch("/api/figurinha", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: current.nome,
          dataNascimento: current.dataNascimento,
          email: current.email,
          clube: current.clube,
          jogadorFavorito: current.jogadorFavorito,
          peso: current.peso || undefined,
          altura: current.altura || undefined,
          fotoBase64,
          errorTimestamp: retryAfterError || undefined,
          retryAttempt: attempt,
        }),
      });

      const result = await res.json();

      if (res.ok && result.imageBase64) {
        generatingRef.current = false;
        const dataUrl = `data:${result.mimeType};base64,${result.imageBase64}`;
        setStickerUrl(dataUrl);
        setStickerId(result.stickerId || "");
        setErrorTimestamp(null);
        sessionStorage.setItem("figurinha_sticker_url", dataUrl);
        sessionStorage.setItem("figurinha_sticker_id", result.stickerId || "");
        try { localStorage.setItem("figurinha_sticker_id", result.stickerId || ""); } catch { /* ignore */ }
        setAppStep("result");
        return;
      }

      console.warn(`Tentativa ${attempt + 1} falhou: ${result.error}`);
    } catch (error) {
      console.warn(`Tentativa ${attempt + 1} falhou (rede):`, error);
    }

    const now = new Date().toISOString();
    setErrorTimestamp(now);
    setRetryCount(attempt + 1);
    await new Promise(r => setTimeout(r, 2000));
    generateFigurinha(now, attempt + 1);
  }, []);

  const handleQuizNext = useCallback(() => {
    if (quizStep === 1) {
      setAppStep("loading-photo");
      setTimeout(() => {
        setQuizStep(2);
        setAppStep("quiz-2");
      }, 3000);
    } else if (quizStep === 2) {
      setQuizStep(3);
      setAppStep("quiz-3");
    } else if (quizStep === 3) {
      setAppStep("confirm");
    }
  }, [quizStep]);

  const handleQuizBack = useCallback(() => {
    if (quizStep === 2) {
      setQuizStep(1);
      setAppStep("quiz-1");
    } else if (quizStep === 3) {
      setQuizStep(2);
      setAppStep("quiz-2");
    }
  }, [quizStep]);

  return (
    <main className="flex flex-col items-center min-h-screen bg-white">
      {appStep === "hero" && (
        <Hero
          onStart={() => {
            sessionStorage.removeItem("figurinha_sticker_url");
            sessionStorage.removeItem("figurinha_sticker_id");
            setQuizStep(1);
            setData(initialData);
            setFotoPreviewUrl(null);
            generatingRef.current = false;
            setAppStep("quiz-1");
          }}
          ctaText={firstButtonText}
        />
      )}

      {(appStep === "quiz-1" || appStep === "quiz-2" || appStep === "quiz-3") && (
        <QuizStep
          step={quizStep}
          data={data}
          updateData={updateData}
          onNext={handleQuizNext}
          onBack={handleQuizBack}
          totalSteps={3}
        />
      )}

      {appStep === "loading-photo" && (
        <LoadingScreen
          title="CARGANDO LA FOTO"
          gifUrl="https://media.giphy.com/media/Runu6lodl8z7Bycoqx/giphy.gif"
        />
      )}

      {appStep === "confirm" && (
        <ConfirmScreen
          data={data}
          fotoPreviewUrl={fotoPreviewUrl}
          onConfirm={() => {
            if (generatingRef.current) return;
            setGenStartTime(Date.now());
            setAppStep("loading-generate");
            generateFigurinha();
          }}
          onBack={() => {
            setQuizStep(3);
            setAppStep("quiz-3");
          }}
        />
      )}

      {appStep === "loading-generate" && (
        <LoadingScreen
          title="CREANDO TU FIGURITA"
          gifUrl="https://media.giphy.com/media/z9Twy2wtzu9Ow/giphy.gif"
          longWait
          startTime={genStartTime}
        />
      )}

      {appStep === "result" && (
        <ResultScreen
          stickerUrl={stickerUrl}
          stickerId={stickerId}
          checkoutUrl={checkoutUrl}
          price={price}
          ctaText={purchaseButtonText}
          onRetry={() => {
            generatingRef.current = false;
            sessionStorage.removeItem("figurinha_sticker_url");
            sessionStorage.removeItem("figurinha_sticker_id");
            setGenStartTime(Date.now());
            setAppStep("loading-generate");
            generateFigurinha(errorTimestamp || undefined, retryCount);
          }}
        />
      )}
    </main>
  );
}

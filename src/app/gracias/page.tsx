"use client";

import Image from "next/image";
import { useState, useEffect } from "react";

async function fetchWithRetry(url: string, attempts = 3): Promise<Response> {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return res;
    } catch { /* continua tentando */ }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 800 * (i + 1)));
  }
  throw new Error("Falhou após tentativas");
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Gracias() {
  const [stickerUrl, setStickerUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Recovery por email
  const [searchEmail, setSearchEmail] = useState("");
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchResult, setSearchResult] = useState<string | null>(null);
  const [searchError, setSearchError] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const idFromUrl = params.get("src");
    const idFromStorage = (() => { try { return localStorage.getItem("figurinha_sticker_id"); } catch { return null; } })();
    const id = idFromUrl || idFromStorage;

    if (!id) { setLoading(false); return; }

    fetchWithRetry(`/api/sticker?id=${encodeURIComponent(id)}`)
      .then((r) => r.json())
      .then((data) => { if (data.url) setStickerUrl(data.url); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = `/api/download?url=${encodeURIComponent(url)}&name=mi-figurita-copa2026`;
    a.click();
  };

  const handleSearchByEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setSearchError("");
    setSearchResult(null);

    const email = searchEmail.trim().toLowerCase();
    if (!EMAIL_REGEX.test(email)) {
      setSearchError("Ingresa un correo electrónico válido (ejemplo: tucorreo@email.com)");
      return;
    }

    setSearchLoading(true);
    try {
      const res = await fetch(`/api/sticker?email=${encodeURIComponent(email)}`);
      if (!res.ok) {
        setSearchError("No encontramos una lámina asociada a ese correo. Verifica que escribiste bien el email.");
        return;
      }
      const data = await res.json();
      if (data.url) {
        setSearchResult(data.url);
      } else {
        setSearchError("No encontramos una lámina asociada a ese correo.");
      }
    } catch {
      setSearchError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setSearchLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center min-h-screen bg-white px-5 py-8 overflow-hidden">

      {/* Figurinhas estáticas no topo */}
      <div className="relative w-56 h-56 sm:w-64 sm:h-64 mb-4 flex-shrink-0">
        <div className="absolute left-0 top-4 w-24 h-36 z-10" style={{ transform: "rotate(-8deg)" }}>
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-xl">
            <Image src="/figurinha-mia.png" alt="Figurinha" fill className="object-cover" sizes="96px" quality={100} />
            <div className="absolute inset-0 shine-effect" />
          </div>
        </div>
        <div className="absolute left-[58%] -translate-x-1/2 top-2 w-32 h-48 z-30">
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-2xl">
            <Image src="/figurinha-lucas.png" alt="Figurinha" fill className="object-cover" sizes="128px" quality={100} />
            <div className="absolute inset-0 shine-effect" style={{ animationDelay: "1s" }} />
          </div>
        </div>
        <div className="absolute right-0 top-4 w-24 h-36 z-10" style={{ transform: "rotate(8deg)" }}>
          <div className="relative w-full h-full rounded-xl overflow-hidden shadow-xl">
            <Image src="/figurinha-mia.png" alt="Figurinha" fill className="object-cover" sizes="96px" quality={100} />
            <div className="absolute inset-0 shine-effect" style={{ animationDelay: "2s" }} />
          </div>
        </div>
      </div>

      {/* Título */}
      <div className="w-full max-w-3xl flex flex-col items-center animate-slide-up">
        <h1
          className="text-5xl md:text-7xl font-bold text-copa-blue text-center tracking-[0.1em] mb-1"
          style={{ fontFamily: "var(--font-titulo)" }}
        >
          ¡GRACIAS!
        </h1>
        <span className="text-5xl mb-6">⚽</span>

        <div className={`w-full flex flex-col ${stickerUrl || loading ? "md:flex-row md:gap-10 md:items-start" : ""}`}>

          {/* Figurita personalizada do cliente */}
          {(loading || stickerUrl) && (
            <div className="flex flex-col items-center gap-3 mb-6 md:mb-0 md:order-2 md:flex-shrink-0">
              {loading ? (
                <div className="w-48 h-72 rounded-2xl bg-gray-100 animate-pulse border-4 border-gray-200" />
              ) : stickerUrl ? (
                <>
                  <div className="w-48 rounded-2xl overflow-hidden shadow-2xl border-4 border-copa-blue">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={stickerUrl} alt="Tu lámina" className="w-full h-auto" />
                  </div>
                  <button
                    onClick={() => handleDownload(stickerUrl)}
                    className="w-full max-w-xs bg-copa-blue text-white font-bold text-base py-4 rounded-2xl
                      shadow-lg hover:bg-copa-blue-hover active:scale-95 transition-all duration-200 cursor-pointer tracking-[0.1em] flex items-center justify-center gap-2"
                    style={{ fontFamily: "var(--font-titulo)" }}
                  >
                    ⬇ DESCARGAR MI LÁMINA
                  </button>
                  <p className="text-sm text-copa-blue font-bold text-center" style={{ fontFamily: "var(--font-papernotes)" }}>
                    Haz clic para descargar tu lámina
                  </p>
                </>
              ) : null}
            </div>
          )}

          {/* Texto */}
          <div className="flex flex-col items-center flex-1 md:order-1">
            <p
              className="text-xl text-center leading-relaxed mb-2"
              style={{ fontFamily: "var(--font-papernotes)" }}
            >
              ¡Tu pago fue confirmado!
            </p>

            <p
              className="text-lg text-center leading-relaxed mb-2"
              style={{ fontFamily: "var(--font-papernotes)" }}
            >
              Tu <strong className="text-copa-blue">lámina personalizada</strong> te será
              enviada por <strong className="text-copa-blue">correo electrónico</strong> en
              menos de <strong className="text-copa-blue">30 minutos</strong>.
            </p>

            <p
              className="text-base text-gray-600 text-center mb-6"
              style={{ fontFamily: "var(--font-papernotes)" }}
            >
              El archivo PDF estará listo para imprimir, con 9 láminas en formato estándar (6,5 x 9 cm).
            </p>

            <a
              href="/"
              className="w-full bg-copa-blue text-copa-white font-bold text-xl py-5 rounded-2xl
                shadow-lg hover:bg-copa-blue-hover active:scale-95 transition-all duration-200 cursor-pointer tracking-[0.1em] text-center block"
              style={{ fontFamily: "var(--font-titulo)" }}
            >
              CREAR UNA NUEVA LÁMINA
            </a>
          </div>

        </div>

        {/* Sección de recuperación por email */}
        <div className="w-full mt-10 border-t border-gray-200 pt-8">
          <h2
            className="text-lg font-bold text-copa-blue text-center mb-1"
            style={{ fontFamily: "var(--font-titulo)" }}
          >
            ¿No ves tu lámina arriba?
          </h2>
          <p
            className="text-sm text-gray-500 text-center mb-4"
            style={{ fontFamily: "var(--font-papernotes)" }}
          >
            Ingresa el correo que usaste al crear tu figurita para recuperarla.
          </p>

          <form onSubmit={handleSearchByEmail} className="flex flex-col gap-3 max-w-md mx-auto">
            <input
              type="email"
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl focus:border-copa-blue focus:outline-none transition-colors placeholder:text-gray-400"
              style={{ fontFamily: "var(--font-papernotes)" }}
            />
            {searchError && (
              <p className="text-red-500 text-sm text-center">{searchError}</p>
            )}
            <button
              type="submit"
              disabled={searchLoading}
              className="w-full bg-copa-blue text-white font-bold text-base py-3 rounded-xl
                shadow hover:bg-copa-blue-hover active:scale-95 transition-all duration-200 cursor-pointer disabled:opacity-50"
              style={{ fontFamily: "var(--font-titulo)" }}
            >
              {searchLoading ? "Buscando..." : "BUSCAR MI LÁMINA"}
            </button>
          </form>

          {/* Resultado da busca */}
          {searchResult && (
            <div className="flex flex-col items-center gap-3 mt-6">
              <div className="w-40 rounded-2xl overflow-hidden shadow-xl border-4 border-copa-blue">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={searchResult} alt="Tu lámina" className="w-full h-auto" />
              </div>
              <button
                onClick={() => handleDownload(searchResult)}
                className="bg-copa-blue text-white font-bold text-base px-6 py-3 rounded-xl
                  shadow hover:bg-copa-blue-hover active:scale-95 transition-all duration-200 cursor-pointer"
                style={{ fontFamily: "var(--font-titulo)" }}
              >
                ⬇ DESCARGAR MI LÁMINA
              </button>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

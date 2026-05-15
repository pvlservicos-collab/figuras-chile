"use client";

import Image from "next/image";

interface HeroProps {
  onStart: () => void;
}

export default function Hero({ onStart }: HeroProps) {
  return (
    <section className="flex flex-col items-center min-h-[100dvh] w-full px-5 py-6 text-center overflow-hidden" style={{ background: "#FFFFFF" }}>
      <h1
        className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold leading-[1.1] mb-3 max-w-2xl"
        style={{ fontFamily: "var(--font-titulo)" }}
      >
        Transforma a tu hijo en{" "}
        <span style={{ color: "#002395" }}>figurita Panini personalizada</span> del Mundial
      </h1>

      <div className="relative w-72 h-72 sm:w-80 sm:h-80 md:w-96 md:h-[400px] mb-3 mt-0">
        <div
          className="absolute left-0 top-14 md:top-16 w-36 h-52 md:w-48 md:h-72 rounded-xl overflow-hidden shadow-xl z-10"
          style={{
            transform: "rotate(-8deg)",
            animation: "wiggle 7s ease-in-out infinite",
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/figurinha-mia.png"
              alt="Figurinha Mia"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 144px, 192px"
              quality={95}
              priority
            />
            <div className="absolute inset-0 shine-effect" />
          </div>
        </div>

        <div
          className="absolute left-[58%] -translate-x-1/2 top-8 w-44 h-64 md:w-60 md:h-[340px] rounded-xl overflow-hidden shadow-2xl z-30"
          style={{
            animation: "wiggle 7s ease-in-out infinite 0.5s",
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/figurinha-lucas.png"
              alt="Figurinha Lucas"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 176px, 240px"
              quality={95}
              priority
            />
            <div className="absolute inset-0 shine-effect" style={{ animationDelay: "1s" }} />
          </div>
        </div>

        <div
          className="absolute right-0 top-14 md:top-16 w-36 h-52 md:w-48 md:h-72 rounded-xl overflow-hidden shadow-xl z-10"
          style={{
            transform: "rotate(8deg)",
            animation: "wiggle-down 7s ease-in-out infinite 1s",
            willChange: "transform",
            backfaceVisibility: "hidden",
          }}
        >
          <div className="relative w-full h-full">
            <Image
              src="/figurinha-mia.png"
              alt="Figurinha Mia"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 144px, 192px"
              quality={95}
              priority
            />
            <div className="absolute inset-0 shine-effect" style={{ animationDelay: "2s" }} />
          </div>
        </div>
      </div>

      <p
        className="text-lg md:text-xl max-w-md mb-3 leading-relaxed"
        style={{ fontFamily: "var(--font-papernotes)" }}
      >
        Responde unas pocas preguntas y crea una figurita única con el nombre,
        la foto y el estilo de tu pequeño campeón.
      </p>

      <button
        onClick={onStart}
        className="w-full max-w-md bg-copa-blue text-copa-white font-bold text-2xl md:text-3xl py-5 rounded-2xl
          shadow-lg hover:bg-copa-blue-hover active:scale-95 transition-all duration-200
          animate-pulse-glow cursor-pointer tracking-[0.15em]"
        style={{ fontFamily: "var(--font-titulo)" }}
      >
        EMPEZAR
      </button>

      <div className="mt-3 flex flex-col items-center gap-2">
        <div className="flex items-center gap-1">
          {[
            { code: "cl", label: "Chile", big: true },
            { code: "ar", label: "Argentina", big: false },
            { code: "br", label: "Brasil", big: false },
            { code: "es", label: "España", big: false },
            { code: "de", label: "Alemania", big: false },
          ].map(({ code, label, big }) => (
            <img
              key={code}
              src={`https://flagcdn.com/w${big ? "80" : "40"}/${code}.png`}
              alt={label}
              width={big ? 44 : 32}
              height={big ? 30 : 21}
              className={`rounded shadow-md border border-gray-200 ${big ? "ring-2 ring-copa-blue" : "opacity-80"}`}
              style={{ transition: "transform 0.2s" }}
            />
          ))}
        </div>
        <p className="text-sm font-bold" style={{ fontFamily: "var(--font-papernotes)" }}>
          +2.500 figuritas ya creadas!
        </p>
      </div>
    </section>
  );
}

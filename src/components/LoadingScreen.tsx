"use client";

import { useState, useEffect, useRef } from "react";

interface LoadingScreenProps {
  title: string;
  gifUrl: string;
  longWait?: boolean;
  startTime?: number;
}

const curiosidades = [
  "🇨🇱 ¡La Roja ganó la Copa América dos veces seguidas, en 2015 y 2016! ¡Nadie lo había logrado antes en la era moderna!",
  "⚽ Alexis Sánchez es el máximo goleador de la historia de Chile con más de 50 goles. ¡Un monstruo del fútbol!",
  "🏆 En el Mundial de Brasil 2014, Chile eliminó a España, ¡la campeona del mundo! Uno de los partidos más épicos de la historia.",
  "🥊 Gary Medel, el 'Pitbull', es pura garra y corazón. ¡El tipo que nunca se rinde ni aunque lo echen!",
  "🌟 Marcelo Salas, el 'Matador', fue uno de los delanteros más temidos de América en los años 90. ¡Ídolo eterno!",
  "💪 Arturo Vidal fue campeón de liga en Italia, España, Alemania y Brasil. ¡El guerrero más completo del fútbol chileno!",
  "🥅 Claudio Bravo fue capitán de La Roja en las dos Copas América ganadas. ¡Manos de oro bajo el arco!",
  "🎉 Chile fue el anfitrión de la Copa América 2015 y levantó el trofeo en casa. ¡El Estadio Nacional explotó de alegría!",
  "🚀 Ivan Zamorano, 'Bam Bam', jugó en el Real Madrid y el Inter de Milán. ¡Un chileno conquistando Europa!",
  "📺 El partido Chile vs. España en Brasil 2014 fue visto por más de 30 millones de personas solo en Chile. ¡País paralizado!",
  "🌎 Chile clasificó a 4 Mundiales consecutivos: 1998, 2010, 2014 y 2018. ¡La época dorada de La Roja!",
  "🏟️ El Estadio Nacional de Santiago tiene capacidad para más de 47.000 hinchas. ¡Un caldero cuando juega La Roja!",
  "⭐ Esteban Paredes es el máximo goleador histórico del fútbol chileno a nivel de clubes. ¡Leyenda de Colo-Colo!",
  "🎯 Chile eliminó a Brasil en los penales en la Copa América 2015. ¡David Pizarro y compañía no temblaron!",
  "🌟 La generación dorada de Chile (2010–2016) es considerada la mejor de la historia del fútbol sudamericano.",
  "🔴 La camiseta roja de La Roja es una de las más icónicas de Sudamérica. ¡Cuando sale esa camiseta, todos tiemblan!",
  "🏆 El Mundial 2026 se jugará en EE.UU., México y Canadá. ¡Chile tiene todo para volver a brillar en la gran fiesta!",
  "💥 En la Copa América 2016, Chile venció a Argentina en la final por penales. ¡Dos veces seguidas y dos veces campeón!",
];

export default function LoadingScreen({ title, gifUrl, longWait, startTime }: LoadingScreenProps) {
  const [percent, setPercent] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [curiosidadeIndex, setCuriosidadeIndex] = useState(0);
  const start = useRef(startTime || Date.now());

  useEffect(() => {
    start.current = startTime || Date.now();
    setPercent(0);
    setElapsed(0);
    setCuriosidadeIndex(Math.floor(Math.random() * curiosidades.length));
  }, [startTime]);

  // Rotacionar curiosidades a cada 6 segundos
  useEffect(() => {
    if (!longWait) return;
    const interval = setInterval(() => {
      setCuriosidadeIndex((prev) => (prev + 1) % curiosidades.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [longWait]);

  useEffect(() => {
    if (!longWait) {
      const duration = 3000;
      const interval = setInterval(() => {
        const now = Date.now();
        const progress = Math.min(100, Math.round(((now - start.current) / duration) * 100));
        setPercent(progress);
        if (progress >= 100) clearInterval(interval);
      }, 50);
      return () => clearInterval(interval);
    }

    // Barra que nunca para: sobe rápido até 80%, depois lentamente até 99%
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsedMs = now - start.current;
      setElapsed(Math.floor(elapsedMs / 1000));

      let newPercent: number;
      if (elapsedMs < 60000) {
        // 0-60s: sobe de 0 a 80%
        newPercent = Math.round((elapsedMs / 60000) * 80);
      } else if (elapsedMs < 180000) {
        // 60-180s: sobe lentamente de 80 a 98%
        const extra = ((elapsedMs - 60000) / 120000) * 18;
        newPercent = Math.round(80 + extra);
      } else {
        // 180s+: fica em 99%, nunca para
        newPercent = 99;
      }

      setPercent((prev) => Math.max(prev, newPercent));
    }, 200);

    return () => clearInterval(interval);
  }, [longWait]);

  return (
    <section className="flex flex-col items-center justify-center min-h-[100dvh] w-full px-4">
      <div className="w-full max-w-md bg-copa-white rounded-3xl shadow-2xl p-8 flex flex-col items-center gap-6 animate-slide-up">
        <h2
          className="text-3xl md:text-4xl font-bold text-copa-blue tracking-[0.1em] text-center"
          style={{ fontFamily: "var(--font-titulo)" }}
        >
          {title}
        </h2>

        {longWait && (
          <p className="text-sm font-bold text-copa-blue text-center -mt-4" style={{ fontFamily: "var(--font-papernotes)" }}>
            No abandones esta pantalla, puede demorar hasta 2 minutos.
          </p>
        )}

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={gifUrl}
          alt="Carregando..."
          className="w-48 h-48 rounded-2xl object-cover"
        />

        <p
          className="text-base text-center min-h-[3rem] transition-opacity duration-500"
          style={{ fontFamily: "var(--font-papernotes)" }}
        >
          {longWait ? (
            <span className="text-copa-blue font-bold">⚽ {curiosidades[curiosidadeIndex]}</span>
          ) : (
            "¡Esa es pinta de campeón, po! 🏆"
          )}
        </p>

        <div className="w-full">
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs font-bold text-copa-blue" style={{ fontFamily: "var(--font-papernotes)" }}>
              {longWait && elapsed > 0 ? `${elapsed}s` : "Cargando..."}
            </span>
            <span className="text-sm font-bold text-copa-blue" style={{ fontFamily: "var(--font-papernotes)" }}>
              {percent}%
            </span>
          </div>
          <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-copa-blue rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

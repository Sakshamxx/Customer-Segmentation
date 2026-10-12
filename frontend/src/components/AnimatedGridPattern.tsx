"use client";

import { motion } from "framer-motion";
import { useId, useMemo } from "react";
import { cn } from "@/lib/utils";

/** Grid with randomly pulsing squares. Local take on an animated-grid-pattern. */
export function AnimatedGridPattern({ numSquares = 30, maxOpacity = 0.15, duration = 3, repeatDelay = 1, className = "" }: {
  numSquares?: number; maxOpacity?: number; duration?: number; repeatDelay?: number; className?: string;
}) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, "");
  const squares = useMemo(
    () =>
      Array.from({ length: numSquares }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        dur: duration * (0.6 + Math.random() * 0.8),
        delay: Math.random() * duration,
      })),
    [numSquares, duration]
  );
  return (
    <svg aria-hidden className={cn("pointer-events-none absolute inset-0 h-full w-full", className)}>
      <defs>
        <pattern id={`grid-${id}`} width="56" height="56" patternUnits="userSpaceOnUse">
          <path d="M 56 0 L 0 0 0 56" fill="none" stroke="rgba(74,222,128,0.10)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#grid-${id})`} />
      {squares.map((s) => (
        <motion.rect
          key={s.id}
          x={`${s.x}%`}
          y={`${s.y}%`}
          width="44"
          height="44"
          rx="8"
          fill="rgba(74,222,128,0.5)"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, maxOpacity, 0] }}
          transition={{ duration: s.dur, delay: s.delay, repeat: Infinity, repeatDelay, ease: "easeInOut" }}
        />
      ))}
    </svg>
  );
}

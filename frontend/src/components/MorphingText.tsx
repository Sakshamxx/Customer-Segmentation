"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/** Blur-crossfade word cycling. Local take on a morphing-text headline. */
export function MorphingText({ texts, interval = 2600, className = "" }: {
  texts: string[]; interval?: number; className?: string;
}) {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((v) => (v + 1) % texts.length), interval);
    return () => clearInterval(t);
  }, [texts.length, interval]);
  return (
    <span className={cn("relative inline-block", className)}>
      <AnimatePresence mode="wait">
        <motion.span
          key={texts[i]}
          initial={{ opacity: 0, y: 14, filter: "blur(10px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={{ opacity: 0, y: -14, filter: "blur(10px)" }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="inline-block"
        >
          {texts[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

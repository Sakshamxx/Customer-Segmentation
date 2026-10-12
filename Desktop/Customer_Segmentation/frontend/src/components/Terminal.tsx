"use client";

import { motion } from "framer-motion";
import { useEffect, useState, type ReactNode } from "react";

export function Terminal({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0a0f0d]/95 shadow-[0_30px_80px_rgba(0,0,0,0.55)]">
      <div className="flex items-center gap-2 border-b border-white/10 bg-white/[0.03] px-4 py-3">
        <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
        <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
        <span className="h-3 w-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 font-mono text-xs text-[#9db8a8]">{title}</span>
      </div>
      <div className="space-y-2 p-5 font-mono text-[13px] leading-relaxed">{children}</div>
    </div>
  );
}

export function TypingAnimation({ children, delay = 0, className = "", speed = 28 }: {
  children: string; delay?: number; className?: string; speed?: number;
}) {
  const [n, setN] = useState(0);
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    const start = setTimeout(() => {
      interval = setInterval(() => {
        setN((v) => {
          if (v >= children.length) {
            clearInterval(interval);
            return v;
          }
          return v + 1;
        });
      }, speed);
    }, delay);
    return () => { clearTimeout(start); if (interval) clearInterval(interval); };
  }, [children, delay, speed]);
  return (
    <div className={className}>
      {children.slice(0, n)}
      {n < children.length && <span className="animate-pulse text-[#4ade80]">▍</span>}
    </div>
  );
}

export function AnimatedSpan({ children, delay = 0, className = "" }: {
  children: ReactNode; delay?: number; className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: delay / 1000, duration: 0.4, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

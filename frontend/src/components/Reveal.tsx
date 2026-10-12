"use client";

import { motion } from "framer-motion";

export function Reveal({ children, delay = 0, className }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function Eyebrow({ index, label }: { index: string; label: string }) {
  return (
    <p className="flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
      <span className="font-mono text-emerald-200/60">{index}</span>
      <span className="h-px w-8 bg-gradient-to-r from-emerald-300 to-transparent" />
      {label}
    </p>
  );
}

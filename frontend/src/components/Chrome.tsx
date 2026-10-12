"use client";

import { motion } from "framer-motion";

export function Navbar({ live }: { live: boolean }) {
  return (
    <motion.nav
      initial={{ y: -64 }} animate={{ y: 0 }} transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="sticky top-0 z-50 border-b border-white/10 bg-[#060c0a]/85 backdrop-blur-xl"
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-3.5">
        <a href="#top" className="flex items-center gap-2.5">
          <span className="h-7 w-7 rounded-lg bg-gradient-to-br from-emerald-300 to-[#0a6b3c] shadow-[0_0_16px_rgba(74,222,128,0.4)]" />
          <span className="text-[15px] font-bold tracking-tight text-[#f2efe4]">Verdant Segments</span>
        </a>
        <div className="hidden items-center gap-7 text-[13px] font-semibold text-[#9db8a8] md:flex">
          {["Predict", "Segments", "History", "Assistant"].map((l) => (
            <a key={l} href={`#${l.toLowerCase()}`} className="relative transition hover:text-emerald-300 after:absolute after:-bottom-1 after:left-0 after:h-0.5 after:w-0 after:rounded-full after:bg-emerald-300 after:transition-all hover:after:w-full">
              {l}
            </a>
          ))}
        </div>
        <span className="flex items-center gap-2 rounded-full bg-white/[0.05] px-3 py-1.5 text-[11px] font-bold text-[#e9dec8]">
          <span className="relative flex h-2 w-2">
            <span className={`absolute h-full w-full animate-ping rounded-full ${live ? "bg-emerald-400" : "bg-red-500"} opacity-60`} />
            <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-400" : "bg-red-500"}`} />
          </span>
          {live ? "Connected" : "Offline"}
        </span>
      </div>
    </motion.nav>
  );
}

export function SiteNote() {
  return (
    <p className="font-mono text-[11px] text-[#9db8a8]/70">
      K-Means (k=3) on log-scaled RFM · shown in INR at £1 = ₹105
    </p>
  );
}

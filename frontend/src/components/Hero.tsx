"use client";

import { animate, motion, useInView } from "framer-motion";
import { ArrowRight, RotateCcw, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Crosshair } from "lucide-react";
import { SpinningText } from "./SpinningText";
import { AnimatedGridPattern } from "./AnimatedGridPattern";
import { MorphingText } from "./MorphingText";
import { AnimatedSpan, Terminal, TypingAnimation } from "./Terminal";

function CountUp({ to, decimals = 0, suffix = "" }: { to: number; decimals?: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 1.6, ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setVal(v),
    });
    return () => controls.stop();
  }, [inView, to]);
  return <span ref={ref}>{val.toLocaleString("en-IN", { maximumFractionDigits: decimals, minimumFractionDigits: decimals })}{suffix}</span>;
}

const STATS: Array<[number, string, string, number]> = [
  [4334, "customers modelled", "", 0],
  [3, "segments", "", 0],
  [0.421, "silhouette score", "", 3],
  [83, "revenue from VIPs", "%", 0],
];

const TICKER = [
  "VIP Loyal", "83% of revenue", "k = 3", "silhouette 0.421",
  "Everyday Regular", "4,334 customers", "Lapsed Browser", "RFM · K-Means",
];

function TerminalDemo() {
  const [run, setRun] = useState(0);
  return (
    <div key={run}>
      <Terminal title="api — segmentation">
        <TypingAnimation delay={300} className="text-[#e9dec8]">
          {"> POST /predict · R18 F10 ₹5,75,000"}
        </TypingAnimation>
        <AnimatedSpan delay={1800} className="text-emerald-400">✔ K-Means assigned: VIP Loyal</AnimatedSpan>
        <AnimatedSpan delay={2200} className="text-emerald-400">✔ Distance 0.593 · silhouette 0.421</AnimatedSpan>
        <AnimatedSpan delay={2600} className="text-[#e3c566]">★ KPIs ▸ n=4334 · k=3 · DB 0.808 · ARI 0.992</AnimatedSpan>
        <AnimatedSpan delay={3000} className="text-emerald-400">✔ Stored in Postgres · row #1284</AnimatedSpan>
        <AnimatedSpan delay={3400} className="text-sky-400">
          <span>ℹ VIPs are 31% of customers, 83% of revenue</span>
        </AnimatedSpan>
        <TypingAnimation delay={4000} speed={22} className="text-[#9db8a8]">
          {"Success! Segment rendered below."}
        </TypingAnimation>
      </Terminal>
      <button
        onClick={() => setRun((r) => r + 1)}
        className="mt-3 flex items-center gap-1.5 font-mono text-xs text-[#9db8a8] transition hover:text-emerald-300"
      >
        <RotateCcw size={12} /> replay run
      </button>
    </div>
  );
}

export function Hero({ live }: { live: boolean }) {
  return (
    <header className="relative flex min-h-[calc(100svh-57px)] flex-col overflow-hidden bg-[#060c0a]">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#0a6b3c]/15 via-transparent to-transparent" />
      <motion.div
        className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-[#0a6b3c]/25 blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="pointer-events-none absolute -right-24 top-24 h-80 w-80 rounded-full bg-[#c9a227]/10 blur-3xl"
        animate={{ x: [0, -30, 0], y: [0, 40, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <div className="pointer-events-none absolute inset-0 [mask-image:radial-gradient(700px_circle_at_50%_35%,white,transparent)]">
        <AnimatedGridPattern numSquares={28} maxOpacity={0.18} duration={3} repeatDelay={1} />
      </div>

      <div className="relative mx-auto grid w-full max-w-6xl flex-1 items-center gap-10 px-8 py-10 lg:grid-cols-2">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-white/[0.04] px-4 py-1.5 text-xs font-semibold text-[#e9dec8] backdrop-blur"
          >
            <Sparkles size={14} className="text-emerald-300" />
            K-Means on RFM
            <span className="flex items-center gap-1.5 border-l border-white/15 pl-2">
              <span className="relative flex h-2 w-2">
                <span className={`absolute h-full w-full animate-ping rounded-full ${live ? "bg-emerald-400" : "bg-red-500"} opacity-60`} />
                <span className={`h-2 w-2 rounded-full ${live ? "bg-emerald-400" : "bg-red-500"}`} />
              </span>
              {live ? "API connected" : "API offline"}
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight text-[#f2efe4] md:text-6xl"
          >
            Every customer,
            <br />
            <MorphingText
              texts={["VIP Loyal.", "Everyday Regular.", "Lapsed Browser."]}
              interval={2600}
              className="bg-gradient-to-r from-emerald-300 via-[#4ade80] to-[#c9a227] bg-clip-text text-transparent"
            />
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.22 }}
            className="mt-4 max-w-md text-sm leading-relaxed text-[#9db8a8]"
          >
            RFM in, segment out — stored to Postgres, explained in Rupees.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.34 }}
            className="mt-6 flex flex-wrap items-center gap-3"
          >
            <motion.a
              href="#predict" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-[#0a6b3c] px-6 py-3 text-sm font-bold text-[#060c0a] shadow-[0_12px_32px_rgba(20,180,100,0.35)]"
            >
              Segment a customer
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </motion.a>
            <motion.a
              href="#segments" whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
              className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/[0.04] px-6 py-3 text-sm font-bold text-[#f2efe4] backdrop-blur transition hover:border-emerald-300/50"
            >
              View segments
            </motion.a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <TerminalDemo />
        </motion.div>
      </div>

      <div className="relative mx-auto max-w-6xl px-8 pb-8">
        <motion.dl
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-2 gap-6 border-t border-white/10 pt-6 md:grid-cols-4"
        >
          {STATS.map(([v, label, suffix, decimals]) => (
            <div key={label}>
              <dt className="bg-gradient-to-br from-white to-emerald-300 bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
                <CountUp to={v} suffix={suffix} decimals={decimals} />
              </dt>
              <dd className="mt-1 text-[11px] font-medium uppercase tracking-wider text-[#9db8a8]">{label}</dd>
            </div>
          ))}
        </motion.dl>
      </div>

      <div className="relative border-y border-white/10 bg-black/40 py-3">
        <div className="flex overflow-hidden">
          <div className="animate-marquee flex shrink-0 items-center gap-10 pr-10">
            {[...TICKER, ...TICKER].map((t, i) => (
              <span key={i} className="flex items-center gap-10 whitespace-nowrap text-xs font-semibold uppercase tracking-[0.18em] text-[#9db8a8]">
                {t} <span className="h-1 w-1 rounded-full bg-[#c9a227]" />
              </span>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
}

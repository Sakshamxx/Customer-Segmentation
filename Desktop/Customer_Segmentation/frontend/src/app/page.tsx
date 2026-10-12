"use client";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";
import { useCallback, useEffect, useState } from "react";
import { Navbar } from "../components/Chrome";
import { CinematicFooter } from "../components/CinematicFooter";
import { Hero } from "../components/Hero";
import { Predict, type FormState } from "../components/Predict";
import { Reveal } from "../components/Reveal";
import { Assistant, History, Segments } from "../components/Sections";
import { API, GBP_TO_INR, toGBP } from "../lib/api";
import type { HistoryRow, Prediction, Segment } from "../lib/api";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

export default function Home() {
  const [form, setForm] = useState<FormState>({ recency_days: 45, frequency_orders: 3, spend_inr: 75000 });
  const [segments, setSegments] = useState<Segment[]>([]);
  const [result, setResult] = useState<Prediction | null>(null);
  const [history, setHistory] = useState<HistoryRow[]>([]);
  const [live, setLive] = useState(false);
  const [busy, setBusy] = useState(false);
  const [spinning, setSpinning] = useState(false);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    let raf = 0;
    const loop = (t: number) => { lenis.raf(t); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement).closest('a[href^="#"]');
      if (!a) return;
      const el = document.querySelector(a.getAttribute("href")!);
      if (el) { e.preventDefault(); lenis.scrollTo(el as HTMLElement, { offset: -70 }); }
    };
    document.addEventListener("click", onClick);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("click", onClick); lenis.destroy(); };
  }, []);

  const refreshHistory = useCallback(async () => {
    setSpinning(true);
    try {
      const r = await fetch(`${API}/history?limit=25`);
      setHistory((await r.json()).predictions ?? []);
    } catch { /* offline */ } finally {
      setTimeout(() => setSpinning(false), 400);
    }
  }, []);

  useEffect(() => {
    fetch(`${API}/health`).then((r) => setLive(r.ok)).catch(() => setLive(false));
    fetch(`${API}/clusters`).then((r) => r.json()).then((d) => setSegments(d.segments)).catch(() => {});
    refreshHistory();
  }, [refreshHistory]);

  async function segment() {
    setBusy(true);
    try {
      const r = await fetch(`${API}/predict`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          recency_days: form.recency_days,
          frequency_orders: form.frequency_orders,
          monetary_gbp: toGBP(form.spend_inr),
        }),
      });
      setResult(await r.json());
      refreshHistory();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div id="top" className="min-h-screen bg-[#060c0a] text-[#f2efe4] antialiased">
      <Navbar live={live} />
      {/* Solid layer above the fixed cinematic footer so it reveals on scroll */}
      <div className="relative z-10 rounded-b-3xl bg-[#060c0a] shadow-[0_30px_60px_rgba(0,0,0,0.6)]">
        <Hero live={live} />
        <main className="mx-auto max-w-6xl space-y-24 px-8 py-16">
          <section id="predict" className="scroll-mt-24">
            <Reveal>
              <p className="mb-6 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.22em] text-emerald-300">
                <span className="font-mono text-emerald-200/60">01</span>
                <span className="h-px w-8 bg-gradient-to-r from-emerald-300 to-transparent" />
                Live prediction
              </p>
            </Reveal>
            <Predict form={form} setForm={setForm} result={result} busy={busy} live={live} onSegment={segment} />
          </section>
          <section id="assistant" className="scroll-mt-24">
            <Assistant />
          </section>
          <section id="segments" className="scroll-mt-24">
            <Segments
            segments={segments}
            activeId={result?.segment.id ?? null}
            onUseProfile={(s) => setForm({
              recency_days: Math.round(s.recency),
              frequency_orders: Math.max(1, Math.round(s.frequency)),
              spend_inr: Math.round(s.monetary * GBP_TO_INR),
            })}
          />
          </section>
          <section id="history" className="scroll-mt-24">
            <History rows={history} onRefresh={refreshHistory} spinning={spinning} />
          </section>
          <section id="assistant" className="scroll-mt-24">
            <Assistant />
          </section>
        </main>
      </div>
      <CinematicFooter />
    </div>
  );
}

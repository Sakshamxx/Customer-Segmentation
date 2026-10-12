"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Clock, Loader2, Receipt, Wallet } from "lucide-react";
import {
  Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { inr, toGBP } from "../lib/api";
import type { Prediction } from "../lib/api";

export type FormState = { recency_days: number; frequency_orders: number; spend_inr: number };

const PRESETS: Array<{ label: string; detail: string } & FormState> = [
  { label: "VIP Loyal", detail: "18d · 10 orders", recency_days: 18, frequency_orders: 10, spend_inr: 575000 },
  { label: "Everyday Regular", detail: "50d · 2 orders", recency_days: 50, frequency_orders: 2, spend_inr: 58000 },
  { label: "Lapsed Browser", detail: "260d · 1 order", recency_days: 260, frequency_orders: 1, spend_inr: 31500 },
];

function Field({ icon, label, display, children }: {
  icon: React.ReactNode; label: string; display: string; children: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="mb-2 flex items-baseline justify-between">
        <span className="flex items-center gap-2 text-sm font-semibold text-[#e9dec8]">
          <span className="text-emerald-300">{icon}</span>{label}
        </span>
        <motion.span key={display} initial={{ scale: 0.92, opacity: 0.6 }} animate={{ scale: 1, opacity: 1 }}
          className="rounded-lg bg-white/[0.06] px-2.5 py-1 font-mono text-sm font-bold text-emerald-200">
          {display}
        </motion.span>
      </div>
      {children}
    </label>
  );
}

export function Slider({ value, min, max, step, onChange }: {
  value: number; min: number; max: number; step: number; onChange: (v: number) => void;
}) {
  const fill = ((value - min) / (max - min)) * 100;
  return (
    <input
      type="range" min={min} max={max} step={step} value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      style={{ "--fill": `${fill}%` } as React.CSSProperties}
      className="w-full cursor-pointer"
    />
  );
}

export function Predict({ form, setForm, result, busy, live, onSegment }: {
  form: FormState;
  setForm: (f: FormState) => void;
  result: Prediction | null;
  busy: boolean;
  live: boolean;
  onSegment: () => void;
}) {
  const set = (k: keyof FormState) => (v: number) => setForm({ ...form, [k]: v });
  const compare = result
    ? [
        { k: "Recency", you: form.recency_days, typical: Math.round(result.profile.recency) },
        { k: "Orders", you: form.frequency_orders, typical: result.profile.frequency },
        { k: "Spend (k)", you: Math.round(form.spend_inr / 1000), typical: Math.round(((result.profile.monetary * 105) / 1000)) },
      ]
    : [];

  return (
    <div className="grid scroll-mt-24 gap-6 lg:grid-cols-2">
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] p-8 backdrop-blur md:p-10">
        <h2 className="text-xl font-bold text-[#f2efe4]">New customer</h2>
        <div className="mt-4 space-y-5">
          <Field icon={<Clock size={15} />} label="Days since last order" display={`${form.recency_days} days`}>
            <Slider value={form.recency_days} min={1} max={374} step={1} onChange={set("recency_days")} />
          </Field>
          <Field icon={<Receipt size={15} />} label="Distinct invoices" display={`${form.frequency_orders} orders`}>
            <Slider value={form.frequency_orders} min={1} max={60} step={1} onChange={set("frequency_orders")} />
          </Field>
          <Field icon={<Wallet size={15} />} label="Lifetime spend" display={inr(form.spend_inr)}>
            <Slider value={form.spend_inr} min={500} max={1500000} step={500} onChange={set("spend_inr")} />
          </Field>
        </div>
        <div className="mt-6 flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <motion.button
              key={p.label} whileHover={{ y: -2 }} whileTap={{ scale: 0.96 }}
              onClick={() => setForm({ recency_days: p.recency_days, frequency_orders: p.frequency_orders, spend_inr: p.spend_inr })}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2 text-left transition hover:border-emerald-300/50 hover:bg-white/[0.06]"
            >
              <span className="block text-xs font-bold text-[#f2efe4]">{p.label}</span>
              <span className="block font-mono text-[10px] text-[#9db8a8]">{p.detail} · {inr(p.spend_inr)}</span>
            </motion.button>
          ))}
        </div>
        <motion.button
          onClick={onSegment} disabled={busy || !live}
          whileHover={busy || !live ? {} : { y: -2 }} whileTap={busy || !live ? {} : { scale: 0.98 }}
          className="group mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-300 to-[#0a6b3c] py-4 text-sm font-bold text-[#060c0a] shadow-[0_14px_36px_rgba(20,180,100,0.35)] transition disabled:opacity-40"
        >
          {busy ? <Loader2 size={17} className="animate-spin" /> : <>Segment customer <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></>}
        </motion.button>
        <p className="mt-3 text-center font-mono text-[11px] text-[#9db8a8]">≈ £{Math.round(toGBP(form.spend_inr)).toLocaleString("en-IN")} at £1 = ₹105</p>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-emerald-300/20 bg-gradient-to-br from-[#0a2e1e] via-[#073d24] to-[#060c0a] p-8 text-[#f2efe4] shadow-[0_20px_60px_rgba(0,0,0,0.5)] md:p-10">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-16 h-64 w-64 rounded-full bg-[#c9a227]/10 blur-3xl" />
        <AnimatePresence mode="wait">
          {!result ? (
            <motion.div key="empty" exit={{ opacity: 0, y: -12 }} className="relative flex h-full min-h-72 flex-col justify-center">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-emerald-200/60">Awaiting input</p>
              <p className="mt-3 max-w-sm text-2xl font-bold leading-snug text-[#f2efe4]">
                The segment, the fit, and the comparison appear here.
              </p>
            </motion.div>
          ) : (
            <motion.div key={result.segment.id + JSON.stringify(form)} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.45 }} className="relative">
              <p className="flex items-center gap-2 font-mono text-xs uppercase tracking-[0.2em] text-emerald-200/70">
                Segment {result.segment.id} of 3
                {result.stored && <span className="flex items-center gap-1 text-emerald-300"><CheckCircle2 size={12} /> saved to Postgres</span>}
              </p>
              <h3 className="mt-2 bg-gradient-to-r from-white via-emerald-100 to-[#c9a227] bg-clip-text text-4xl font-bold text-transparent">{result.segment.name}</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-[#c9d8cd]">{result.segment.blurb}</p>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {result.distances.map((d, i) => (
                  <div key={i} className={`rounded-xl p-3 ${i === result.segment.id ? "bg-white/10 ring-1 ring-emerald-300/50" : "bg-white/[0.04]"}`}>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-[#9db8a8]">Seg {i}</p>
                    <p className="font-mono text-lg font-bold">{d}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 h-52 rounded-2xl bg-[#060c0a]/80 p-3 ring-1 ring-white/10">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={compare} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff14" />
                    <XAxis dataKey="k" tick={{ fontSize: 11, fill: "#9db8a8" }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: "#9db8a8" }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", background: "#0b1411", color: "#f2efe4" }} />
                    <Bar dataKey="you" fill="#4ade80" radius={[6, 6, 0, 0]} />
                    <Bar dataKey="typical" fill="#c9a227" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

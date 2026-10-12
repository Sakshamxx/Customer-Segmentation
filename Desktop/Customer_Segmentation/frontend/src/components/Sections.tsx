"use client";

import { motion } from "framer-motion";
import { AlarmClockOff, Bot, Check, Crown, Database, Inbox, MessageCircle, RefreshCw, ShoppingBag } from "lucide-react";
import { Eyebrow, Reveal } from "./Reveal";
import { SpinningText } from "./SpinningText";
import { GlareHover } from "./GlareHover";
import { GBP_TO_INR, inr } from "../lib/api";
import type { HistoryRow, Segment } from "../lib/api";

const ICONS = [ShoppingBag, Crown, AlarmClockOff];
const BADGES = ["Largest group", "Top revenue", "Win-back"];
const BADGE_STYLES = [
  "border-white/15 bg-white/[0.06] text-[#e9dec8]",
  "border-[#c9a227]/50 bg-[#c9a227]/15 text-[#e3c566]",
  "border-emerald-300/40 bg-emerald-300/10 text-emerald-200",
];

export function Segments({ segments, activeId, onUseProfile }: {
  segments: Segment[]; activeId: number | null; onUseProfile: (s: Segment) => void;
}) {
  return (
    <div>
      <Reveal><Eyebrow index="03" label="The three segments" /></Reveal>
      <div className="mt-6 grid items-stretch gap-5 md:grid-cols-3">
        {segments.map((s, i) => {
          const Icon = ICONS[s.id] ?? ShoppingBag;
          const active = activeId === s.id;
          const features = [
            `${s.recency} days typical recency`,
            `${s.frequency} orders typical frequency`,
            `${inr(s.monetary * GBP_TO_INR)} typical spend`,
            `${s.customers.toLocaleString("en-IN")} customers`,
          ];
          return (
            <Reveal key={s.id} delay={i * 0.08} className="h-full">
              <GlareHover
                glare={s.id === 1 ? "rgba(201,162,39,0.22)" : "rgba(74,222,128,0.20)"}
                className={`relative h-full overflow-hidden rounded-3xl border bg-white/[0.04] backdrop-blur transition-shadow hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)] ${active ? "border-emerald-300/60 shadow-[0_20px_50px_rgba(20,180,100,0.25)]" : "border-white/10"}`}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-emerald-300 via-[#0a6b3c] to-[#c9a227]" />
                <div className="flex h-full flex-col p-7">
                  <div className="flex items-center justify-between">
                    <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-[#0a6b3c] text-[#060c0a] shadow-[0_0_20px_rgba(74,222,128,0.35)]">
                      <Icon size={19} />
                    </span>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${BADGE_STYLES[s.id] ?? BADGE_STYLES[0]}`}>
                      {BADGES[s.id] ?? "Segment"}
                    </span>
                  </div>

                  <h3 className="mt-4 text-lg font-bold text-[#f2efe4]">{s.name}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[#9db8a8]">{s.blurb}</p>

                  <div className="flex items-baseline gap-1 pt-3">
                    <span className="bg-gradient-to-br from-white to-emerald-200 bg-clip-text text-4xl font-bold tracking-tight text-transparent">
                      {(s.rev_share * 100).toFixed(0)}%
                    </span>
                    <span className="text-sm text-[#9db8a8]">of revenue</span>
                  </div>

                  <div className="mt-4 flex flex-col gap-2.5">
                    {features.map((f) => (
                      <div key={f} className="flex items-center gap-2 text-sm text-[#e9dec8]">
                        <Check size={15} className="shrink-0 text-emerald-300" />
                        {f}
                      </div>
                    ))}
                    <div className="flex items-center gap-2 text-sm text-[#9db8a8]">
                      <span className="ml-[3px] h-2 w-2 shrink-0 rounded-full bg-[#9db8a8]/40" />
                      {(s.share * 100).toFixed(0)}% of all customers
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ width: 0 }} whileInView={{ width: `${s.rev_share * 100}%` }}
                        viewport={{ once: true }} transition={{ duration: 1, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-[#c9a227]"
                      />
                    </div>
                  </div>

                  <div className="mt-auto pt-6">
                    <motion.a
                      href="#predict"
                      onClick={() => onUseProfile(s)}
                      whileHover={{ y: -2 }} whileTap={{ scale: 0.98 }}
                      className={`block rounded-xl py-3 text-center text-sm font-bold transition ${active
                        ? "bg-gradient-to-r from-emerald-300 to-[#0a6b3c] text-[#060c0a]"
                        : "border border-white/15 bg-white/[0.05] text-[#f2efe4] hover:border-emerald-300/50"}`}
                    >
                      Use this profile
                    </motion.a>
                  </div>
                </div>
              </GlareHover>
            </Reveal>
          );
        })}
      </div>
    </div>
  );
}

export function History({ rows, onRefresh, spinning }: {
  rows: HistoryRow[]; onRefresh: () => void; spinning: boolean;
}) {
  return (
    <div>
      <Reveal>
        <div className="flex items-end justify-between">
          <Eyebrow index="04" label="Recent predictions · Postgres" />
          <div className="flex items-center gap-3">
            <div className="relative hidden text-emerald-200/80 sm:block">
              <SpinningText duration={18} size={72}>
                {"saved • stored • postgres • "}
              </SpinningText>
              <Database size={15} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-300" />
            </div>
            <button onClick={onRefresh}
              className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/[0.04] px-3 py-1.5 text-xs font-semibold text-[#e9dec8] transition hover:border-emerald-300/60 hover:text-emerald-200">
              <RefreshCw size={13} className={spinning ? "animate-spin" : ""} /> Refresh
            </button>
          </div>
        </div>
      </Reveal>
      <Reveal delay={0.08}>
        <div className="history-scroll mt-6 max-h-[352px] overflow-y-auto rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur">
          <table className="w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-[#0c120f]">
              <tr className="border-b border-white/10 text-[11px] uppercase tracking-wider text-[#9db8a8]">
                <th className="px-6 py-4 font-semibold">Time</th>
                <th className="px-6 py-4 font-semibold">Recency</th>
                <th className="px-6 py-4 font-semibold">Orders</th>
                <th className="px-6 py-4 font-semibold">Spend</th>
                <th className="px-6 py-4 font-semibold">Segment</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#9db8a8]">
                    <Inbox size={22} className="mx-auto mb-2 text-emerald-200/50" />
                    No predictions yet. Segment a customer above.
                  </td>
                </tr>
              )}
              {rows.map((h) => (
                <tr key={h.id} className="border-b border-white/[0.06] transition-colors last:border-0 hover:bg-white/[0.04]">
                  <td className="px-6 py-3 font-mono text-xs text-[#9db8a8]">{h.created_at ? new Date(h.created_at).toLocaleString("en-IN") : "—"}</td>
                  <td className="px-6 py-3 font-mono text-[#f2efe4]">{h.recency_days}d</td>
                  <td className="px-6 py-3 font-mono text-[#f2efe4]">{h.frequency_orders}</td>
                  <td className="px-6 py-3 font-mono text-[#f2efe4]">{inr(h.monetary_gbp * GBP_TO_INR)}</td>
                  <td className="px-6 py-3"><span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-xs font-bold text-emerald-200">{h.segment_name}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}

const IDEAS = [
  "What defines the VIP Loyal segment?",
  "Why was K-Means chosen over DBSCAN?",
  "Which segment drives most revenue?",
];

export function Assistant() {
  return (
    <Reveal>
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03] p-8 backdrop-blur md:p-10">
        <div className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-emerald-400/10 blur-3xl" />
        <Eyebrow index="02" label="Next milestone" />
        <div className="mt-3 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-300 to-[#0a6b3c] text-[#060c0a] shadow-[0_0_20px_rgba(74,222,128,0.35)]">
            <Bot size={20} />
          </span>
          <h2 className="text-xl font-bold text-[#f2efe4]">Project assistant</h2>
          <span className="rounded-full bg-[#c9a227]/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-[#e3c566]">Coming soon</span>
        </div>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#9db8a8]">
          A retrieval assistant over this project's own methodology notes and cluster
          profiles. Plain-language answers with citations, declines out-of-scope
          questions, never reveals keys or raw customer rows.
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          {IDEAS.map((q) => (
            <span key={q} className="flex items-center gap-1.5 rounded-full bg-white/[0.05] px-4 py-1.5 text-xs text-[#9db8a8]">
              <MessageCircle size={12} />{q}
            </span>
          ))}
        </div>
        <div className="mt-5 flex gap-3">
          <input disabled placeholder="Assistant arrives in the RAG milestone"
            className="w-full rounded-xl border border-white/10 bg-black/30 px-4 py-3 text-sm text-[#9db8a8] outline-none" />
          <button disabled className="rounded-xl bg-white/10 px-6 text-sm font-bold text-[#9db8a8]">Ask</button>
        </div>
      </div>
    </Reveal>
  );
}

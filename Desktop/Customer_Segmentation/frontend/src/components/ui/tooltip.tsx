"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function TooltipProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

export function Tooltip({ children }: { children: React.ReactNode }) {
  return <div className="group/tooltip relative flex items-center">{children}</div>;
}

export function TooltipTrigger({ asChild, children }: { asChild?: boolean; children: React.ReactNode }) {
  return <>{children}</>;
}

export function TooltipContent({ children }: { children: React.ReactNode }) {
  return (
    <span className="pointer-events-none absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/10 bg-black/85 px-2.5 py-1 text-[11px] font-semibold text-[#f2efe4] opacity-0 transition-all duration-200 group-hover/tooltip:-top-10 group-hover/tooltip:opacity-100">
      {children}
    </span>
  );
}

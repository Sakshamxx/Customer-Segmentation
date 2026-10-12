"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function Separator({ orientation = "horizontal", className }: {
  orientation?: "horizontal" | "vertical"; className?: string;
}) {
  return (
    <div
      role="separator"
      className={cn(
        "shrink-0 bg-white/15",
        orientation === "vertical" ? "h-full min-h-10 w-px" : "h-px w-full",
        className
      )}
    />
  );
}

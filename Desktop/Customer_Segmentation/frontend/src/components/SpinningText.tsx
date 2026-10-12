"use client";

import { cn } from "@/lib/utils";

/** Circular text on a rotating ring. Local take on a spinning-text badge. */
export function SpinningText({ children, className = "", duration = 14, size = 120 }: {
  children: string; className?: string; duration?: number; size?: number;
}) {
  const id = `spin-${size}-${children.length}`;
  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 animate-spin-slow"
        style={{ animationDuration: `${duration}s` }}
      >
        <defs>
          <path id={id} d="M 50,50 m -37,0 a 37,37 0 1,1 74,0 a 37,37 0 1,1 -74,0" />
        </defs>
        <text className="fill-current text-[8.5px] font-semibold uppercase tracking-[0.22em]">
          <textPath href={`#${id}`}>{children}</textPath>
        </text>
      </svg>
    </div>
  );
}

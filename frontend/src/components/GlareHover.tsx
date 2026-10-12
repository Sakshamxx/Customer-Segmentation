"use client";

import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useRef, useState } from "react";

/** Cursor-tracking glare + gentle tilt. Local equivalent of a glare-hover wrapper. */
export function GlareHover({ children, className = "", glare = "rgba(74,222,128,0.18)" }: {
  children: React.ReactNode; className?: string; glare?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ x: 50, y: 50, active: false });
  const rx = useMotionValue(0.5);
  const ry = useMotionValue(0.5);
  const rotateX = useSpring(useTransform(ry, [0, 1], [4, -4]), { stiffness: 200, damping: 20 });
  const rotateY = useSpring(useTransform(rx, [0, 1], [-4, 4]), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      ref={ref}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const x = (e.clientX - r.left) / r.width;
        const y = (e.clientY - r.top) / r.height;
        rx.set(x);
        ry.set(y);
        setPos({ x: x * 100, y: y * 100, active: true });
      }}
      onMouseLeave={() => {
        rx.set(0.5);
        ry.set(0.5);
        setPos((p) => ({ ...p, active: false }));
      }}
      className={className}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: pos.active ? 1 : 0,
          background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, ${glare}, transparent 65%)`,
        }}
      />
    </motion.div>
  );
}

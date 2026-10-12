"use client";

import * as React from "react";
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { ArrowUp, Heart } from "lucide-react";
import { GithubIcon } from "./icons";
import { cn } from "@/lib/utils";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800;900&display=swap');

.cinematic-footer-wrapper {
  font-family: 'Plus Jakarta Sans', sans-serif;
  -webkit-font-smoothing: antialiased;
}

@keyframes footer-breathe {
  0% { transform: translate(-50%, -50%) scale(1); opacity: 0.6; }
  100% { transform: translate(-50%, -50%) scale(1.1); opacity: 1; }
}

@keyframes footer-scroll-marquee {
  from { transform: translateX(0); }
  to { transform: translateX(-50%); }
}

@keyframes footer-heartbeat {
  0%, 100% { transform: scale(1); filter: drop-shadow(0 0 5px rgba(74,222,128,0.5)); }
  15%, 45% { transform: scale(1.2); filter: drop-shadow(0 0 10px rgba(74,222,128,0.8)); }
  30% { transform: scale(1); }
}

.animate-footer-breathe { animation: footer-breathe 8s ease-in-out infinite alternate; }
.animate-footer-scroll-marquee { animation: footer-scroll-marquee 36s linear infinite; }
.animate-footer-heartbeat { animation: footer-heartbeat 2s cubic-bezier(0.25, 1, 0.5, 1) infinite; }

.footer-bg-grid {
  background-size: 60px 60px;
  background-image:
    linear-gradient(to right, rgba(74,222,128,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(74,222,128,0.05) 1px, transparent 1px);
  mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
  -webkit-mask-image: linear-gradient(to bottom, transparent, black 30%, black 70%, transparent);
}

.footer-aurora {
  background: radial-gradient(
    circle at 50% 50%,
    rgba(10,107,60,0.35) 0%,
    rgba(201,162,39,0.12) 40%,
    transparent 70%
  );
}

.footer-glass-pill {
  background: linear-gradient(145deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%);
  box-shadow:
      0 10px 30px -10px rgba(0,0,0,0.6),
      inset 0 1px 1px rgba(255,255,255,0.12),
      inset 0 -1px 2px rgba(0,0,0,0.4);
  border: 1px solid rgba(255,255,255,0.1);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

.footer-glass-pill:hover {
  background: linear-gradient(145deg, rgba(74,222,128,0.16) 0%, rgba(255,255,255,0.04) 100%);
  border-color: rgba(74,222,128,0.45);
  box-shadow:
      0 20px 40px -10px rgba(0,0,0,0.7),
      inset 0 1px 1px rgba(255,255,255,0.2);
  color: #f2efe4;
}

@keyframes footer-retro-move {
  from { background-position-y: 0px; }
  to { background-position-y: 60px; }
}

.footer-retro-grid {
  position: absolute;
  left: -50%;
  right: -50%;
  bottom: -10%;
  height: 55%;
  background-image:
    linear-gradient(to right, rgba(74,222,128,0.22) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(74,222,128,0.22) 1px, transparent 1px);
  background-size: 60px 60px;
  transform: perspective(500px) rotateX(62deg);
  transform-origin: center top;
  animation: footer-retro-move 2.5s linear infinite;
  mask-image: linear-gradient(to top, black 30%, transparent 85%);
  -webkit-mask-image: linear-gradient(to top, black 30%, transparent 85%);
}

.footer-giant-bg-text {  font-size: 24vw;
  line-height: 0.75;
  font-weight: 900;
  letter-spacing: -0.05em;
  color: transparent;
  -webkit-text-stroke: 1px rgba(242,239,228,0.08);
  background: linear-gradient(180deg, rgba(74,222,128,0.16) 0%, transparent 60%);
  -webkit-background-clip: text;
  background-clip: text;
}

.footer-text-glow {
  background: linear-gradient(180deg, #f2efe4 0%, rgba(74,222,128,0.75) 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  filter: drop-shadow(0px 0px 24px rgba(74,222,128,0.25));
}
`;

export type MagneticButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  React.AnchorHTMLAttributes<HTMLAnchorElement> & {
    as?: React.ElementType;
  };

const MagneticButton = React.forwardRef<HTMLElement, MagneticButtonProps>(
  ({ className, children, as: Component = "button", ...props }, forwardedRef) => {
    const localRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (typeof window === "undefined") return;
      const element = localRef.current;
      if (!element) return;

      const ctx = gsap.context(() => {
        const handleMouseMove = (e: MouseEvent) => {
          const rect = element.getBoundingClientRect();
          const x = e.clientX - rect.left - rect.width / 2;
          const y = e.clientY - rect.top - rect.height / 2;
          gsap.to(element, {
            x: x * 0.35, y: y * 0.35,
            rotationX: -y * 0.12, rotationY: x * 0.12,
            scale: 1.05, ease: "power2.out", duration: 0.4,
          });
        };
        const handleMouseLeave = () => {
          gsap.to(element, {
            x: 0, y: 0, rotationX: 0, rotationY: 0, scale: 1,
            ease: "elastic.out(1, 0.3)", duration: 1.2,
          });
        };
        element.addEventListener("mousemove", handleMouseMove);
        element.addEventListener("mouseleave", handleMouseLeave);
        return () => {
          element.removeEventListener("mousemove", handleMouseMove);
          element.removeEventListener("mouseleave", handleMouseLeave);
        };
      }, element);

      return () => ctx.revert();
    }, []);

    return (
      <Component
        ref={(node: HTMLElement) => {
          (localRef as unknown as React.MutableRefObject<HTMLElement | null>).current = node;
          if (typeof forwardedRef === "function") forwardedRef(node);
          else if (forwardedRef) (forwardedRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        className={cn("cursor-pointer", className)}
        {...props}
      >
        {children}
      </Component>
    );
  }
);
MagneticButton.displayName = "MagneticButton";

/** Perspective grid floor scrolling toward the viewer. Emerald-tinted take on a retro grid. */
function RetroGrid() {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 h-[55%] overflow-hidden">
      <div className="footer-retro-grid" />
    </div>
  );
}

const MarqueeItem = () => (  <div className="flex items-center space-x-12 px-6">
    <span>VIP Loyal</span> <span className="text-emerald-300/60">✦</span>
    <span>83% of Revenue</span> <span className="text-[#c9a227]/60">✦</span>
    <span>Everyday Regular</span> <span className="text-emerald-300/60">✦</span>
    <span>Lapsed Browser</span> <span className="text-[#c9a227]/60">✦</span>
    <span>K-Means · k = 3</span> <span className="text-emerald-300/60">✦</span>
  </div>
);

export function CinematicFooter() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const giantTextRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const linksRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!wrapperRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        giantTextRef.current,
        { y: "10vh", scale: 0.8, opacity: 0 },
        {
          y: "0vh", scale: 1, opacity: 1, ease: "power1.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 80%", end: "bottom bottom", scrub: 1,
          },
        }
      );
      gsap.fromTo(
        [headingRef.current, linksRef.current],
        { y: 50, opacity: 0 },
        {
          y: 0, opacity: 1, stagger: 0.15, ease: "power3.out",
          scrollTrigger: {
            trigger: wrapperRef.current,
            start: "top 40%", end: "bottom bottom", scrub: 1,
          },
        }
      );
    }, wrapperRef);

    return () => ctx.revert();
  }, []);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div
        ref={wrapperRef}
        className="relative h-screen w-full"
        style={{ clipPath: "polygon(0% 0, 100% 0%, 100% 100%, 0 100%)" }}
      >
        <footer className="cinematic-footer-wrapper fixed bottom-0 left-0 flex h-screen w-full flex-col justify-between overflow-hidden bg-[#060c0a] text-[#f2efe4]">
          <div className="footer-aurora animate-footer-breathe pointer-events-none absolute left-1/2 top-1/2 z-0 h-[60vh] w-[80vw] -translate-x-1/2 -translate-y-1/2 rounded-[50%] blur-[80px]" />
          <div className="footer-bg-grid pointer-events-none absolute inset-0 z-0" />
          <RetroGrid />

          <div
            ref={giantTextRef}
            className="footer-giant-bg-text pointer-events-none absolute -bottom-[5vh] left-1/2 z-0 -translate-x-1/2 select-none whitespace-nowrap"
          >
            VERDANT
          </div>

          <div className="absolute left-0 top-12 z-10 w-full -rotate-2 scale-110 overflow-hidden border-y border-white/10 bg-black/50 py-4 shadow-2xl backdrop-blur-md">
            <div className="animate-footer-scroll-marquee flex w-max text-xs font-bold uppercase tracking-[0.3em] text-[#9db8a8] md:text-sm">
              <MarqueeItem />
              <MarqueeItem />
            </div>
          </div>

          <div className="relative z-10 mx-auto mt-20 flex w-full max-w-5xl flex-1 flex-col items-center justify-center px-6">
            <h2 ref={headingRef} className="footer-text-glow mb-4 text-center text-5xl font-black tracking-tighter md:text-8xl">
              Know your customers?
            </h2>
            <p className="mb-12 max-w-xl text-center text-sm leading-relaxed text-[#9db8a8]">
              Three segments, one model, every prediction stored. Jump back in or explore the code.
            </p>

            <div ref={linksRef} className="flex w-full flex-col items-center gap-6">
              <div className="flex w-full flex-wrap justify-center gap-4">
                <MagneticButton as="a" href="#predict" className="footer-glass-pill group flex items-center gap-3 rounded-full px-10 py-5 text-sm font-bold text-[#f2efe4] md:text-base">
                  Segment a customer
                </MagneticButton>
                <MagneticButton as="a" href="#segments" className="footer-glass-pill group flex items-center gap-3 rounded-full px-10 py-5 text-sm font-bold text-[#f2efe4] md:text-base">
                  View segments
                </MagneticButton>
              </div>

              <div className="mt-2 flex w-full flex-wrap justify-center gap-3 md:gap-6">
                <MagneticButton as="a" href="https://github.com/Sakshamxx" target="_blank" rel="noreferrer" className="footer-glass-pill flex items-center gap-2 rounded-full px-6 py-3 text-xs font-medium text-[#9db8a8] hover:text-[#f2efe4] md:text-sm">
                  <GithubIcon size={15} /> GitHub Profile
                </MagneticButton>
                <MagneticButton as="a" href="https://github.com/Sakshamxx/Customer-Segmentation" target="_blank" rel="noreferrer" className="footer-glass-pill flex items-center gap-2 rounded-full px-6 py-3 text-xs font-medium text-[#9db8a8] hover:text-[#f2efe4] md:text-sm">
                  <GithubIcon size={15} /> Project Repo
                </MagneticButton>
                <MagneticButton as="a" href="#assistant" className="footer-glass-pill rounded-full px-6 py-3 text-xs font-medium text-[#9db8a8] hover:text-[#f2efe4] md:text-sm">
                  RAG Assistant
                </MagneticButton>
              </div>
            </div>
          </div>

          <div className="relative z-20 flex w-full flex-col items-center justify-between gap-6 px-6 pb-8 md:flex-row md:px-12">
            <div className="order-2 text-[10px] font-semibold uppercase tracking-widest text-[#9db8a8] md:order-1 md:text-xs">
              © 2026 Verdant Segments · K-Means on RFM
            </div>

            <a
              href="https://github.com/Sakshamxx"
              target="_blank"
              rel="noreferrer"
              className="footer-glass-pill order-1 flex cursor-pointer items-center gap-2 rounded-full px-6 py-3 md:order-2"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#9db8a8] md:text-xs">Developed by</span>
              <Heart size={14} className="animate-footer-heartbeat text-emerald-300" fill="currentColor" />
              <span className="ml-1 text-xs font-black tracking-normal text-[#f2efe4] md:text-sm">Saksham</span>
            </a>

            <MagneticButton
              as="a"
              href="#top"
              aria-label="Back to top"
              className="footer-glass-pill order-3 flex h-12 w-12 items-center justify-center rounded-full text-[#9db8a8] hover:text-[#f2efe4]"
            >
              <ArrowUp size={20} className="transition-transform duration-300 group-hover:-translate-y-1.5" />
            </MagneticButton>
          </div>
        </footer>
      </div>
    </>
  );
}

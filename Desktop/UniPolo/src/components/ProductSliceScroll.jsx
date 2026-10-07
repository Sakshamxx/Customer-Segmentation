import { useRef } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const PARALLAX = 0.2;

const ProductSliceScroll = ({ products }) => {
  const root = useRef(null);
  const track = useRef(null);

  useGSAP(
    () => {
      const r = root.current;
      const tr = track.current;

      if (!r || !tr) return;

      const fit = () => {
        r.style.setProperty(
          "--stage-h",
          `${window.innerHeight}px`
        );
      };

      fit();

      const panels = gsap.utils.toArray(
        "[data-panel]",
        r
      );

      const covers = gsap.utils.toArray(
        "[data-cover]",
        r
      );

      const previews = gsap.utils.toArray(
        "[data-preview]",
        r
      );

      const lag = (1 - PARALLAX) * 100;

      const timeline = gsap.timeline({
        defaults: {
          ease: "none",
          duration: 1,
        },

        scrollTrigger: {
          trigger: tr,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
        },
      });

      panels.forEach((panel, i) => {
        if (i === 0) return;

        const at = i - 1;

        /*
         * Incoming product wipes upward.
         */
        timeline.fromTo(
          panel,
          {
            clipPath:
              "inset(100% 0% 0% 0%)",
          },
          {
            clipPath:
              "inset(0% 0% 0% 0%)",
          },
          at
        );

        /*
         * Incoming cover moves slightly slower
         * than the wipe.
         */
        timeline.fromTo(
          covers[i],
          {
            yPercent: lag,
          },
          {
            yPercent: 0,
          },
          at
        );

        /*
         * Previous product moves away.
         */
        timeline.to(
          covers[i - 1],
          {
            yPercent: -lag,
          },
          at
        );

        /*
         * Product preview starts zoomed and settles.
         */
        timeline.fromTo(
          previews[i],
          {
            scale: 1.2,
          },
          {
            scale: 1,
          },
          at
        );
      });

      return () => {
        timeline.scrollTrigger?.kill();
        timeline.kill();
      };
    },
    {
      scope: root,
      dependencies: [products],
    }
  );

  return (
    <section
      ref={root}
      className="relative w-full bg-neutral-950"
    >
      <div
        ref={track}
        style={{
          height: `calc(var(--stage-h) * ${products.length})`,
        }}
      >
        <div className="sticky top-0 h-[var(--stage-h)] overflow-hidden">
          {products.map((product, index) => (
            <article
              key={product.id}
              data-panel
              className="absolute inset-0 overflow-hidden"
              style={{
                zIndex: index + 1,
              }}
            >
              {/* Background */}
              <div
                data-cover
                className="absolute inset-0 will-change-transform"
              >
                <img
                  src={product.cover}
                  alt=""
                  draggable={false}
                  className="h-full w-full object-cover"
                />

                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-black/10" />
              </div>

              {/* Content */}
              <div className="relative z-10 flex h-full items-center justify-between gap-12 px-[7%] max-md:flex-col max-md:justify-center">

                {/* Product information */}
                <div className="max-w-xl text-white">

                  <p className="mb-4 text-sm uppercase tracking-[0.35em] text-white/60">
                    UniPolos Manufacturing
                  </p>

                  <h2 className="max-w-[10ch] text-5xl font-semibold leading-[0.95] tracking-tight md:text-7xl lg:text-[5.5rem]">
                    {product.title}
                  </h2>

                  {/* Tags */}
                  <div className="mt-8 flex flex-wrap gap-2">
                    {product.tags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-full border border-white/20 bg-black/30 px-4 py-2 text-sm backdrop-blur-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  {/* Description */}
                  <p className="mt-8 max-w-lg text-base leading-relaxed text-white/70">
                    {product.description}
                  </p>

                </div>

                {/* Product Preview */}
                <div className="w-[38%] max-md:w-full">

                  <div className="overflow-hidden rounded-2xl shadow-2xl shadow-black/50">

                    <img
                      data-preview
                      src={product.preview}
                      alt={product.title}
                      draggable={false}
                      className="aspect-[4/5] w-full object-cover will-change-transform"
                    />

                  </div>

                  {/* Manufacturing specs */}
                  <div className="mt-4 grid grid-cols-3 gap-2 text-white">

                    <div className="rounded-lg bg-white/10 p-3 backdrop-blur-md">
                      <p className="text-xs text-white/50">
                        GSM
                      </p>

                      <p className="mt-1 font-medium">
                        {product.gsm}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white/10 p-3 backdrop-blur-md">
                      <p className="text-xs text-white/50">
                        Style
                      </p>

                      <p className="mt-1 font-medium">
                        {product.style}
                      </p>
                    </div>

                    <div className="rounded-lg bg-white/10 p-3 backdrop-blur-md">
                      <p className="text-xs text-white/50">
                        MOQ
                      </p>

                      <p className="mt-1 font-medium">
                        {product.minimumQuantity}
                      </p>
                    </div>

                  </div>

                </div>

              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProductSliceScroll;
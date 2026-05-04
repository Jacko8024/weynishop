import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Full-width hero slider, AliExpress-style.
 *
 * Each slide:
 *  - imageUrl   (background, cover-fit, gradient overlay for text readability)
 *  - title      (big headline)
 *  - subtitle   (subtext)
 *  - ctaLabel   (button text — defaults to "Shop now" if a linkUrl exists)
 *  - linkUrl    (CTA destination — internal /path or external URL)
 *
 * Behaviour:
 *  - Auto-advances every 5s, smooth crossfade.
 *  - Pauses on hover/touch.
 *  - Left/right arrows on md+, dot indicators always.
 *  - Aspect ratios: 16:7 on md+, 4:3 on mobile (keeps text readable on phones).
 *  - First image is `loading="eager"` + `fetchpriority="high"` so the LCP element
 *    renders fast; the rest are `loading="lazy"`.
 */
export default function HeroSlider({ slides = [], interval = 5000 }) {
  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const total = slides.length;
  const timerRef = useRef(null);

  useEffect(() => {
    if (paused || total <= 1) return undefined;
    timerRef.current = setInterval(() => {
      setIdx((i) => (i + 1) % total);
    }, interval);
    return () => clearInterval(timerRef.current);
  }, [paused, total, interval]);

  if (!total) return null;

  const go = (dir) => setIdx((i) => (i + dir + total) % total);

  return (
    <section
      className="relative rounded-2xl overflow-hidden bg-slate-100 h-44 sm:h-56 md:h-64 lg:h-72 xl:h-80"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="absolute inset-0">
        {slides.map((s, i) => {
          const isActive = i === idx;
          const inner = (
            <>
              {/* Background image */}
              <img
                src={s.imageUrl}
                alt={s.title || `Banner ${i + 1}`}
                className="absolute inset-0 w-full h-full object-cover"
                loading={i === 0 ? 'eager' : 'lazy'}
                fetchpriority={i === 0 ? 'high' : 'auto'}
                decoding="async"
                width="1600"
                height="700"
              />
              {/* Gradient overlay for text readability */}
              <div
                aria-hidden="true"
                className="absolute inset-0"
                style={{
                  background:
                    'linear-gradient(90deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.25) 45%, rgba(0,0,0,0) 75%)',
                }}
              />

              {/* Text + CTA */}
              {(s.title || s.subtitle || s.ctaLabel || s.linkUrl) && (
                <div className="relative h-full flex flex-col justify-center px-4 sm:px-8 md:px-12 max-w-xl md:max-w-2xl text-white">
                  {s.title && (
                    <h2 className="text-lg sm:text-2xl md:text-4xl font-extrabold leading-tight drop-shadow-md font-localized line-clamp-2">
                      {s.title}
                    </h2>
                  )}
                  {s.subtitle && (
                    <p className="mt-1 sm:mt-2 text-xs sm:text-sm md:text-base opacity-95 max-w-md drop-shadow line-clamp-2">
                      {s.subtitle}
                    </p>
                  )}
                  {(s.ctaLabel || s.linkUrl) && (
                    <span className="mt-2.5 sm:mt-4 inline-flex items-center justify-center self-start px-4 sm:px-6 py-2 sm:py-2.5 rounded-full bg-white text-slate-900 font-semibold text-xs sm:text-sm md:text-base shadow-md hover:shadow-lg active:scale-95 transition whitespace-nowrap">
                      {s.ctaLabel || 'Shop now'}
                    </span>
                  )}
                </div>
              )}
            </>
          );

          const wrapperCls = `absolute inset-0 transition-opacity duration-700 ease-out ${
            isActive ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`;
          return s.linkUrl ? (
            <Link
              key={s._id || s.id || i}
              to={s.linkUrl}
              className={wrapperCls}
              aria-label={s.title || `Banner ${i + 1}`}
              aria-hidden={!isActive}
              tabIndex={isActive ? 0 : -1}
            >
              {inner}
            </Link>
          ) : (
            <div key={s._id || s.id || i} className={wrapperCls} aria-hidden={!isActive}>
              {inner}
            </div>
          );
        })}
      </div>

      {/* Arrows — md+ only, hidden on mobile to save space */}
      {total > 1 && (
        <>
          <button
            type="button"
            onClick={() => go(-1)}
            className="hidden md:grid absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 place-items-center rounded-full bg-white/40 hover:bg-white/70 text-white hover:text-slate-900 backdrop-blur transition z-10"
            aria-label="Previous slide"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={() => go(1)}
            className="hidden md:grid absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 place-items-center rounded-full bg-white/40 hover:bg-white/70 text-white hover:text-slate-900 backdrop-blur transition z-10"
            aria-label="Next slide"
          >
            <ChevronRight size={22} />
          </button>

          {/* Dots */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setIdx(i)}
                className={`h-1.5 rounded-full transition-all ${
                  i === idx ? 'w-7 bg-white' : 'w-1.5 bg-white/55 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${i + 1}`}
                aria-current={i === idx ? 'true' : 'false'}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

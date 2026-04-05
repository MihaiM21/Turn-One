"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Loading } from "@/components/ui/loading";

type Card = {
  id: string;
  title: string;
  link: string;
  comingSoon?: boolean;
};

const sharedBackgroundImage = "/turn-one-car/2026-turn-one-car/0001.webp";

const cards: Card[] = [
  { id: "home",      title: "HOME",      link: "/home",               comingSoon: false },
  { id: "dashboard", title: "DASHBOARD", link: "/dashboard",          comingSoon: false },
  { id: "store",     title: "STORE",     link: "/store",              comingSoon: true  },
  { id: "AI",        title: "AI",        link: "https://ai.t1f1.com", comingSoon: true  },
  { id: "API",       title: "API CONSOLE",       link: "https://api.t1f1.com", comingSoon: true  },
  // { id: "DOCS",       title: "DOCS",       link: "https://docs.t1f1.com", comingSoon: true  },
];

// Desktop: parallelogram clip. Mobile: straight vertical cards (no skew).
const SKEW_PX = 48;
const SKEW_PX_MOBILE = 0;

function parallelogramClip(s: number) {
  if (s === 0) return "none";
  return `polygon(${s}px 0%, 100% 0%, calc(100% - ${s}px) 100%, 0% 100%)`;
}

export default function HomePage() {
  const [activeCard, setActiveCard] = useState<number | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const img = new window.Image();
      img.src = sharedBackgroundImage;
      img.onload = () => setImageLoaded(true);
    }
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft")  setActiveCard(p => p === null ? 0 : Math.max(0, p - 1));
      if (e.key === "ArrowRight") setActiveCard(p => p === null ? 0 : Math.min(cards.length - 1, p + 1));
      if (e.key === "Escape")     setActiveCard(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const anyActive = activeCard !== null;
  const skew = isMobile ? SKEW_PX_MOBILE : SKEW_PX;

  // ── Width/height calculations ──
  // Desktop: horizontal cards side by side
  // Mobile: vertical cards stacked (top to bottom), active one expands in HEIGHT
  const getDesktopWidth = (index: number) => {
    if (!anyActive) return "14vw";
    return activeCard === index ? "42vw" : "8vw";
  };

  const getMobileHeight = (index: number) => {
    if (!anyActive) return "16vh";
    return activeCard === index ? "52vh" : "10vh";
  };

  return (
    <div className="relative flex flex-col min-h-[100dvh] text-white overflow-hidden">
      {!imageLoaded && <Loading message="Loading assets..." />}

      {/* Full-page background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-black via-red-950 to-black" />
      </div>

      {/* Preload */}
      <div className="hidden">
        <Image src={sharedBackgroundImage} priority alt="" width={1456} height={816}
          onLoad={() => setImageLoaded(true)} />
      </div>

      {/* Grid texture */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Stage */}
      <div className="relative flex items-center justify-center flex-1 w-full px-4 md:px-0">

        {/* ── DESKTOP layout: horizontal parallelogram cards ── */}
        <div className="hidden md:flex items-stretch justify-center" style={{ height: "85vh", gap: "0px" }}>
          {cards.map((card, index) => {
            const isActive  = activeCard === index;
            const isHovered = hoveredCard === index;

            return (
              <motion.div
                key={card.id}
                className="relative flex-shrink-0 cursor-pointer"
                style={{
                  clipPath: parallelogramClip(skew),
                  height: "100%",
                  marginLeft: index === 0 ? 0 : `-${SKEW_PX - 10}px`,
                  zIndex: isActive ? 10 : isHovered ? 5 : cards.length - index,
                }}
                animate={{ width: getDesktopWidth(index) }}
                transition={{ width: { duration: 0.65, ease: [0.22, 1, 0.36, 1] } }}
                onClick={() => setActiveCard(p => p === index ? null : index)}
                onHoverStart={() => setHoveredCard(index)}
                onHoverEnd={() => setHoveredCard(null)}
              >
                <CardInner
                  card={card} index={index} isActive={isActive}
                  isHovered={isHovered} anyActive={anyActive}
                  imageLoaded={imageLoaded} isMobile={false}
                />
              </motion.div>
            );
          })}
        </div>

        {/* ── MOBILE layout: vertical stacked cards ── */}
        <div className="flex md:hidden flex-col items-stretch justify-center w-full" style={{ gap: "6px", height: "92dvh" }}>
          {cards.map((card, index) => {
            const isActive  = activeCard === index;
            const isHovered = hoveredCard === index;

            return (
              <motion.div
                key={card.id}
                className="relative flex-shrink-0 cursor-pointer w-full rounded-sm overflow-hidden"
                style={{
                  zIndex: isActive ? 10 : cards.length - index,
                }}
                animate={{ height: getMobileHeight(index) }}
                transition={{ height: { duration: 0.55, ease: [0.22, 1, 0.36, 1] } }}
                onClick={() => setActiveCard(p => p === index ? null : index)}
              >
                <CardInner
                  card={card} index={index} isActive={isActive}
                  isHovered={isHovered} anyActive={anyActive}
                  imageLoaded={imageLoaded} isMobile={true}
                />
              </motion.div>
            );
          })}
        </div>

      </div>

      {/* Bottom HUD */}
      <div className="fixed bottom-4 md:bottom-6 left-0 right-0 flex flex-col items-center z-20 pointer-events-none gap-2">
        <motion.p
          animate={{ opacity: [0.45, 0.85, 0.45] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="text-[9px] md:text-[10px] text-white/70 tracking-[0.3em] md:tracking-[0.35em] font-light"
        >
          {anyActive
            ? isMobile ? "TAP TO DESELECT" : "CLICK TO DESELECT · ARROWS TO NAVIGATE"
            : isMobile ? "TAP A CARD" : "CLICK A CARD · USE ARROW KEYS"}
        </motion.p>

        <div className="flex gap-2 items-center">
          {cards.map((_, i) => (
            <motion.div key={i} className="rounded-full"
              animate={{
                width:           activeCard === i ? 16 : 4,
                height:          4,
                backgroundColor: activeCard === i ? "#dc2626" : "rgba(255,255,255,0.2)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Shared card interior ────────────────────────────────────────────────────
function CardInner({
  card, index, isActive, isHovered, anyActive, imageLoaded, isMobile,
}: {
  card: Card;
  index: number;
  isActive: boolean;
  isHovered: boolean;
  anyActive: boolean;
  imageLoaded: boolean;
  isMobile: boolean;
}) {
  return (
    <>
      {/* Background image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: imageLoaded ? `url(${sharedBackgroundImage})` : "none",
          backgroundAttachment: isMobile ? "scroll" : "fixed",
          backgroundSize: isMobile ? "cover" : "100vw auto",
          backgroundPosition: isMobile ? `center ${20 + index * 20}%` : "center center",
          backgroundRepeat: "no-repeat",
          filter: anyActive && !isActive
            ? "brightness(0.5) contrast(1.0)"
            : "brightness(1.0) contrast(1.05)",
          transition: "filter 0.35s ease",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: isActive
            ? "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.45) 100%)"
            : anyActive
            ? "linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.55) 100%)"
            : "linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.4) 100%)",
          transition: "background 0.4s ease",
        }}
      />

      {/* Red top accent */}
      <motion.div
        className="absolute top-0 left-0 right-0 h-[3px] bg-red-600 origin-left"
        animate={{ scaleX: isActive ? 1 : 0 }}
        transition={{ duration: 0.45, delay: 0.1 }}
      />

      {/* Left border */}
      <motion.div
        className="absolute top-0 bottom-0 left-0 w-[1px]"
        style={{ background: "rgba(220,38,38,0.3)" }}
        animate={{ opacity: isActive ? 1 : 0.4 }}
      />

      {/* Content wrapper */}
      <div className={`absolute inset-0 flex ${isMobile ? "flex-row items-center" : "flex-col justify-between"} py-5 px-5 md:py-8 md:px-7`}>

        {isMobile ? (
          // ── Mobile: title left, CTA right ──
          <>
            <div className="flex-1 flex flex-col justify-center gap-1">
              {/* Index */}
              <span className="font-mono text-red-400" style={{ fontSize: "10px", opacity: isActive ? 1 : 0 }}>
                {String(index + 1).padStart(2, "0")}
              </span>

              <AnimatePresence>
                {isActive && (
                  <motion.div key="desc-m"
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.25, delay: 0.15 }}
                    className="flex flex-col gap-1"
                  >
                    <div className="h-px bg-red-500 w-8" />
                    <p className="text-white/65 tracking-widest uppercase font-light" style={{ fontSize: "10px" }}>
                      {card.comingSoon ? "Coming soon"
                        : card.id === "home" ? "Your main hub"
                        : card.id === "dashboard" ? "Live race data"
                        : card.id === "store" ? "Official merchandise"
                        : card.id === "API" ? "API Console"
                        : card.id === "DOCS" ? "Documentation" : ""}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.h2
                className="font-black uppercase tracking-widest leading-none"
                animate={{ fontSize: isActive ? "1.5rem" : anyActive ? "0.8rem" : "1rem", color: isActive ? "#fff" : "rgba(255,255,255,0.9)" }}
                transition={{ duration: 0.35 }}
                style={{ textShadow: "0 2px 12px rgba(0,0,0,0.8)", WebkitFontSmoothing: "antialiased" }}
              >
                {card.title}
              </motion.h2>
            </div>

            {/* Mobile CTA */}
            <AnimatePresence>
              {isActive && (
                <motion.div key="cta-m"
                  initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                  transition={{ duration: 0.25, delay: 0.2 }}
                >
                  {card.comingSoon ? (
                    <div className="px-4 py-2 bg-zinc-800/80 text-white/40 text-[10px] tracking-widest font-semibold rounded-sm border border-zinc-700/40 cursor-not-allowed whitespace-nowrap">
                      COMING SOON
                    </div>
                  ) : (
                    <Link href={card.link} onClick={e => e.stopPropagation()}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-[10px] tracking-widest font-semibold rounded-sm transition-colors whitespace-nowrap"
                    >
                      VIEW
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        ) : (
          // ── Desktop: original vertical layout ──
          <>
            {/* Index */}
            <span className="font-mono tracking-widest text-red-400" style={{ fontSize: "11px", opacity: isActive ? 1 : 0 }}>
              {String(index + 1).padStart(2, "0")}
            </span>

            {/* Title + description */}
            <div className="flex flex-col gap-3">
              <AnimatePresence>
                {isActive && (
                  <motion.div key="desc"
                    initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                    transition={{ duration: 0.3, delay: 0.2 }}
                    className="flex flex-col gap-2"
                  >
                    <motion.div className="h-px bg-red-500"
                      initial={{ width: 0 }} animate={{ width: 40 }}
                      transition={{ duration: 0.4, delay: 0.25 }}
                    />
                    <p className="text-white/70 tracking-widest uppercase font-light leading-relaxed" style={{ fontSize: "11px", maxWidth: 200 }}>
                      {card.comingSoon ? "Coming soon — stay tuned"
                        : card.id === "home" ? "Your main hub"
                        : card.id === "dashboard" ? "Live race data & analytics"
                        : card.id === "store" ? "Official merchandise"
                        : card.id === "API" ? "API Console"
                        : card.id === "DOCS" ? "Documentation" : "Explore AI insights"}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Collapsed title */}
              {!isActive && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden px-1">
                  <span
                    className="font-black uppercase select-none text-center"
                    style={{
                      fontSize: anyActive ? "0.65rem" : "1rem",
                      letterSpacing: "0.2em",
                      color: "rgb(255, 255, 255)",
                      textShadow: "0 2px 16px rgba(0,0,0,0.9)",
                      WebkitFontSmoothing: "antialiased",
                      textRendering: "geometricPrecision",
                      lineHeight: 1.4,
                      wordBreak: "break-word",
                      transition: "font-size 0.4s ease",
                    }}
                  >
                    {card.title}
                  </span>
                </div>
              )}

              {/* Active title */}
              {isActive && (
                <motion.h2
                  className="font-black tracking-[0.22em] uppercase leading-none select-none"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  style={{
                    fontSize: "1.85rem", color: "#ffffff",
                    WebkitFontSmoothing: "antialiased",
                    textRendering: "geometricPrecision",
                    textShadow: "0 1px 12px rgba(0,0,0,0.8)",
                  }}
                >
                  {card.title}
                </motion.h2>
              )}
            </div>

            {/* CTA */}
            <div>
              <AnimatePresence>
                {isActive && (
                  <motion.div key="cta"
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, delay: 0.3 }}
                  >
                    {card.comingSoon ? (
                      <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-zinc-800/80 text-white/40 text-xs tracking-widest font-semibold rounded-sm cursor-not-allowed border border-zinc-700/40">
                        COMING SOON
                      </div>
                    ) : (
                      <Link href={card.link} onClick={e => e.stopPropagation()}
                        className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white text-xs tracking-widest font-semibold rounded-sm transition-colors duration-200"
                      >
                        VIEW
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                          <path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </Link>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {card.comingSoon && !isActive && (
                <span className="text-red-400/60 font-mono tracking-widest" style={{ fontSize: "8px", writingMode: "vertical-rl" }}>
                  SOON
                </span>
              )}
            </div>
          </>
        )}
      </div>

      {/* Hover shimmer — desktop only */}
      {!isMobile && (
        <AnimatePresence>
          {isHovered && !isActive && (
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.06) 50%, transparent 70%)" }}
              initial={{ x: "-100%" }} animate={{ x: "100%" }} exit={{ opacity: 0 }}
              transition={{ duration: 0.55 }}
            />
          )}
        </AnimatePresence>
      )}
    </>
  );
}
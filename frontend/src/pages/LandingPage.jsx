import React, { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  GraduationCap,
  UserCheck,
  ShieldCheck,
  Settings,
  FileEdit,
  Eye,
  ArrowUpCircle,
  CheckCircle2,
  ClipboardList,
  Layers,
  Lock,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------
   Design tokens — fixed brand system (do not alter)
------------------------------------------------------------------- */
const COLORS = {
  brand: "#F97362",
  brandRgb: "249, 115, 98",
  bg: "#1E293B",
  bgDeep: "#141E2E",
  card: "#243044",
  border: "#2D3F5A",
};

/* Shared offset so every vertical/horizontal marker in the schematic
   lines up on the exact same axis, on both the spine and the rows. */
const AXIS_MOBILE = 20; // px from the left edge

/* Escalation tiers — the single idea the whole page is built around.
   Every visual system (hero chain, page spine, node color) derives
   from this same four-stage list, so the metaphor stays consistent
   from the first pixel to the last. */
const TIERS = [
  { code: "T-01", role: "Student", icon: GraduationCap, alpha: 0.32 },
  { code: "T-02", role: "Mentor", icon: UserCheck, alpha: 0.56 },
  { code: "T-03", role: "HOD", icon: ShieldCheck, alpha: 0.8 },
  { code: "T-04", role: "Admin", icon: Settings, alpha: 1 },
];

const roleCopy = [
  "Raises a classroom issue tied to a specific mentor and logs it into the record.",
  "Reviews the issue and must respond inside a fixed window before it escalates.",
  "Receives anything a mentor leaves unresolved, with full visibility across the department.",
  "Holds final oversight — configures the hierarchy and can see every case, at every tier.",
];

const steps = [
  { code: "S-01", title: "Raise", icon: FileEdit, filled: false, description: "A student submits an issue tied to their classroom and mentor." },
  { code: "S-02", title: "Review", icon: Eye, filled: false, description: "The assigned mentor reviews the issue inside a set response window." },
  { code: "S-03", title: "Escalate", icon: ArrowUpCircle, filled: false, description: "No response in time routes the issue up to the HOD automatically." },
  { code: "S-04", title: "Resolve", icon: CheckCircle2, filled: true, description: "The case closes with a recorded outcome, visible to everyone in the chain." },
];

const trustPoints = [
  { icon: ClipboardList, title: "Transparent status tracking", description: "Every issue carries a visible status from submission to close." },
  { icon: Layers, title: "Accountability at every level", description: "Each tier operates within a clearly defined scope of responsibility." },
  { icon: Lock, title: "Structured escalation", description: "Inactivity moves a case up the chain — nothing stalls silently." },
];

/* ------------------------------------------------------------------
   Motion primitives
------------------------------------------------------------------- */

function useReveal(threshold = 0.2) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.unobserve(node);
        }
      },
      { threshold, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function Reveal({ delay = 0, className, style, children }) {
  const [ref, visible] = useReveal();
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(18px)",
        transition: `opacity 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms, transform 0.55s cubic-bezier(0.16,1,0.3,1) ${delay}ms`,
        willChange: "opacity, transform",
        ...style,
      }}
    >
      {children}
    </div>
  );
}

/* Tracks how far a block has scrolled through the viewport, 0 → 1.
   Drives a vertical spine fill so the page visualizes "how far the
   issue has moved up the chain" as you read it. Scoped tightly to
   the element it's attached to, so it never bleeds into neighboring
   sections. */
function useScrollProgress() {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let ticking = false;

    const compute = () => {
      ticking = false;
      const rect = node.getBoundingClientRect();
      const vh = window.innerHeight || 800;
      const start = vh * 0.8;
      const end = -rect.height + vh * 0.35;
      const raw = (start - rect.top) / (start - end || 1);
      setProgress(Math.min(1, Math.max(0, raw)));
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(compute);
      }
    };

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return [ref, progress];
}

/* ------------------------------------------------------------------
   Visual atoms
------------------------------------------------------------------- */

function Logo({ size = 34 }) {
  return (
    <div style={{ position: "relative", width: size, height: size, background: COLORS.brand, flexShrink: 0 }}>
      <span
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#FFFFFF",
          fontWeight: 800,
          fontSize: size * 0.52,
          lineHeight: 1,
        }}
      >
        C
      </span>
      <span
        style={{
          position: "absolute",
          bottom: -3,
          right: -3,
          width: size * 0.34,
          height: size * 0.34,
          borderRadius: "9999px",
          background: COLORS.bgDeep,
          border: `2px solid ${COLORS.brand}`,
        }}
      />
    </div>
  );
}

function GridBackground() {
  return (
    <svg
      aria-hidden="true"
      className="cims-grid-drift"
      style={{ position: "absolute", inset: "-44px", width: "calc(100% + 88px)", height: "calc(100% + 88px)", pointerEvents: "none" }}
    >
      <defs>
        <pattern id="cims-grid" width="44" height="44" patternUnits="userSpaceOnUse">
          <path d="M 44 0 L 0 0 0 44" fill="none" stroke={COLORS.brand} strokeOpacity="0.06" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cims-grid)" />
    </svg>
  );
}

/* A tier / step marker on the spine. Fill intensity = position in the
   hierarchy — pale for the first tier, full brand color once a case
   reaches the top. */
function Node({ Icon, alpha = 1, filled = true, size = 40 }) {
  return (
    <div
      className="cims-node"
      style={{
        width: size,
        height: size,
        background: filled ? `rgba(${COLORS.brandRgb}, ${alpha})` : COLORS.bg,
        border: `2px solid ${filled ? "transparent" : COLORS.brand}`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <Icon size={size * 0.46} color={filled && alpha > 0.5 ? "#FFFFFF" : COLORS.brand} strokeWidth={2} />
    </div>
  );
}

function SchematicCard({ code, title, description, align = "left" }) {
  return (
    <div className="cims-card" style={{ textAlign: align === "left" ? "right" : "left", maxWidth: 400 }}>
      <div className="cims-card-accent" />
      <span style={{ display: "block", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.14em", color: COLORS.brand, marginBottom: "0.5rem" }}>
        {code}
      </span>
      <h3 style={{ fontWeight: 700, fontSize: "1.1rem", color: "#F8FAFC" }}>{title}</h3>
      <p style={{ color: "#94A3B8", marginTop: "0.5rem", fontSize: "0.92rem", lineHeight: 1.65 }}>{description}</p>
    </div>
  );
}

/* One rung of the escalation ladder: card on alternating sides,
   connected through a shared horizontal line to a center node.
   The row draws its own connector — the outer spine only needs to
   run behind the nodes, never behind text. */
function SchematicRow({ side, code, title, description, Icon, alpha, filled = true, index }) {
  const isLeft = side === "left";
  return (
    <Reveal delay={index * 70} className="relative">
      {/* Desktop: mirrored around the central spine */}
      <div className="relative hidden lg:block py-8">
        <div className="absolute inset-x-0 top-1/2 h-px -translate-y-1/2" style={{ background: COLORS.border }} />
        <div className="relative grid items-center" style={{ gridTemplateColumns: "1fr 96px 1fr" }}>
          <div className="flex justify-end pr-10">{isLeft && <SchematicCard code={code} title={title} description={description} align="left" />}</div>
          <div className="flex justify-center">
            <Node Icon={Icon} alpha={alpha} filled={filled} />
          </div>
          <div className="flex justify-start pl-10">{!isLeft && <SchematicCard code={code} title={title} description={description} align="right" />}</div>
        </div>
      </div>

      {/* Mobile: single-column timeline sharing the same axis as the spine */}
      <div className="lg:hidden relative py-5" style={{ paddingLeft: AXIS_MOBILE + 24 }}>
        <div
          className="absolute top-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{ left: AXIS_MOBILE }}
        >
          <Node Icon={Icon} alpha={alpha} filled={filled} size={34} />
        </div>
        <span style={{ display: "block", fontWeight: 700, fontSize: "0.7rem", letterSpacing: "0.14em", color: COLORS.brand, marginBottom: "0.4rem" }}>
          {code}
        </span>
        <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "#F8FAFC" }}>{title}</h3>
        <p style={{ color: "#94A3B8", marginTop: "0.4rem", fontSize: "0.9rem", lineHeight: 1.6 }}>{description}</p>
      </div>
    </Reveal>
  );
}

/* A self-contained spine block: draws its own base + progress line
   scoped exactly to its own rows, so it never runs behind headings
   or bleeds into the section above or below it. */
function SpineBlock({ items, side0 = "left" }) {
  const [ref, progress] = useScrollProgress();
  return (
    <div ref={ref} className="relative">
      <div className="pointer-events-none absolute top-0 bottom-0 w-px lg:left-1/2" style={{ left: AXIS_MOBILE, background: COLORS.border }} />
      <div
        className="pointer-events-none absolute top-0 w-px lg:left-1/2"
        style={{ left: AXIS_MOBILE, background: COLORS.brand, height: `${progress * 100}%`, transition: "height 0.12s linear" }}
      />
      {items.map((item, i) => (
        <SchematicRow key={item.code} index={i} side={i % 2 === 0 ? side0 : side0 === "left" ? "right" : "left"} {...item} />
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------
   Page
------------------------------------------------------------------- */

export default function LandingPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const roleItems = TIERS.map((tier, i) => ({
    code: tier.code,
    title: tier.role,
    description: roleCopy[i],
    Icon: tier.icon,
    alpha: tier.alpha,
    filled: true,
  }));

  const stepItems = steps.map((step) => ({
    code: step.code,
    title: step.title,
    description: step.description,
    Icon: step.icon,
    alpha: 1,
    filled: step.filled,
  }));

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: COLORS.bg,
        color: "#E2E8F0",
        fontFamily: "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        position: "relative",
        overflowX: "hidden",
        scrollBehavior: "smooth",
      }}
    >
      <style>{`
        @keyframes cims-drift {
          0%   { transform: translate(0, 0); }
          50%  { transform: translate(-22px, -22px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes cims-sweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .cims-grid-drift { animation: cims-drift 20s ease-in-out infinite; }
        .cims-card {
          position: relative;
          background: ${COLORS.card};
          border: 1px solid ${COLORS.border};
          border-radius: 0;
          padding: 1.5rem;
          transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), border-color 0.3s ease, box-shadow 0.3s ease;
          will-change: transform;
        }
        .cims-card:hover {
          transform: translateY(-4px);
          border-color: ${COLORS.brand};
          box-shadow: 0 14px 28px -20px rgba(${COLORS.brandRgb}, 0.5);
        }
        .cims-card-accent {
          position: absolute; top: 0; left: 0; right: 0; height: 2px; overflow: hidden;
        }
        .cims-card-accent::after {
          content: ""; position: absolute; inset: 0;
          background: linear-gradient(90deg, transparent, ${COLORS.brand}, transparent);
          animation: cims-sweep 4.5s linear infinite;
        }
        .cims-node { transition: transform 0.3s cubic-bezier(0.16,1,0.3,1); }
        .cims-node:hover { transform: scale(1.08); }
        .cims-cta-btn {
          position: relative; transition: transform 0.2s cubic-bezier(0.16,1,0.3,1), box-shadow 0.2s ease;
        }
        .cims-cta-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 24px -10px rgba(${COLORS.brandRgb}, 0.55); }
        .cims-cta-btn:hover .cims-cta-arrow { transform: translateX(4px); }
        .cims-cta-arrow { transition: transform 0.2s ease; }
        .cims-nav-link { transition: color 0.2s ease, border-color 0.2s ease; }
        .cims-nav-link:hover { border-color: ${COLORS.brand} !important; color: #F8FAFC !important; }
        .cims-chain-node { transition: transform 0.25s ease; }
        .cims-chain-node:hover { transform: translateY(-3px); }
        @media (prefers-reduced-motion: reduce) {
          .cims-grid-drift, .cims-card-accent::after { animation: none !important; }
          .cims-card, .cims-node, .cims-cta-btn, .cims-cta-arrow, .cims-nav-link, .cims-chain-node { transition: none !important; }
          html { scroll-behavior: auto !important; }
        }
      `}</style>

      <GridBackground />

      {/* Navbar */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 40,
          background: "rgba(20, 30, 46, 0.9)",
          backdropFilter: "blur(8px)",
          borderBottom: `1px solid ${COLORS.border}`,
          opacity: loaded ? 1 : 0,
          transform: loaded ? "translateY(0)" : "translateY(-12px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo size={34} />
            <span style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.02em" }}>CIMS</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link to="/login" className="cims-nav-link px-3 py-2 text-sm sm:px-4" style={{ fontWeight: 500, color: "#CBD5E1", border: `1px solid ${COLORS.border}` }}>
              Sign In
            </Link>
            <Link to="/login" className="cims-cta-btn px-3 py-2 text-sm sm:px-4" style={{ fontWeight: 600, color: "#FFFFFF", background: COLORS.brand }}>
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero — the thesis: the whole escalation chain, compressed */}
      <section className="relative mx-auto max-w-6xl px-4 pb-14 pt-16 sm:px-6 sm:pt-24">
        <div
          className="mx-auto flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-4"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? "translateY(0)" : "translateY(14px)",
            transition: "opacity 0.6s ease 0.05s, transform 0.6s ease 0.05s",
          }}
        >
          {TIERS.map((tier, i) => (
            <React.Fragment key={tier.code}>
              <div className="cims-chain-node flex flex-col items-center gap-1.5">
                <Node Icon={tier.icon} alpha={tier.alpha} size={40} />
                <span style={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.1em", color: "#64748B", textTransform: "uppercase" }}>
                  {tier.role}
                </span>
              </div>
              {i < TIERS.length - 1 && <ChevronRight size={16} color={COLORS.border} style={{ marginBottom: "1.1rem" }} />}
            </React.Fragment>
          ))}
        </div>

        <div className="mx-auto mt-10 max-w-3xl text-center">
          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#F8FAFC",
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.18s, transform 0.7s ease 0.18s",
            }}
          >
            Every issue follows one accountable path
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl"
            style={{
              fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
              color: "#94A3B8",
              lineHeight: 1.7,
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.3s, transform 0.7s ease 0.3s",
            }}
          >
            CIMS moves each case up a fixed hierarchy — never sideways, never
            informal. A case only advances when a tier misses its window,
            and every step it takes is on the record.
          </p>
          <div
            className="mt-8 flex justify-center"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.42s, transform 0.7s ease 0.42s",
            }}
          >
            <button
              onClick={() => navigate("/login")}
              className="cims-cta-btn inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base"
              style={{ fontWeight: 600, color: "#FFFFFF", background: COLORS.brand, border: "none", cursor: "pointer" }}
            >
              Sign In to CIMS
              <ArrowRight size={18} className="cims-cta-arrow" />
            </button>
          </div>
        </div>
      </section>

      {/* Schematic zone — hero's chain unfolds into a full vertical spine.
          Each spine block is scoped to its own rows only, so the line
          never runs behind a heading or into a neighboring section. */}
      <section className="relative mx-auto max-w-5xl px-4 py-10 sm:px-6 sm:py-16">
        <Reveal className="relative mb-6 text-center lg:mb-10">
          <span style={{ fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", color: COLORS.brand, textTransform: "uppercase" }}>
            The hierarchy
          </span>
          <h2 style={{ fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#F8FAFC", marginTop: "0.5rem" }}>
            Four tiers, one line of accountability
          </h2>
        </Reveal>

        <SpineBlock items={roleItems} side0="left" />

        <Reveal className="relative mb-6 mt-16 text-center lg:mb-10">
          <span style={{ fontWeight: 700, fontSize: "0.72rem", letterSpacing: "0.16em", color: COLORS.brand, textTransform: "uppercase" }}>
            The path of a case
          </span>
          <h2 style={{ fontWeight: 700, fontSize: "clamp(1.5rem, 3vw, 2rem)", color: "#F8FAFC", marginTop: "0.5rem" }}>
            From raised to resolved
          </h2>
        </Reveal>

        <SpineBlock items={stepItems} side0="left" />
      </section>

      {/* Trust strip */}
      <section
        className="relative px-4 py-14 sm:px-6 sm:py-20"
        style={{ background: COLORS.bgDeep, borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}
      >
        <div className="mx-auto grid max-w-5xl grid-cols-1 sm:grid-cols-3">
          {trustPoints.map(({ icon: Icon, title, description }, i) => (
            <Reveal
              key={title}
              delay={i * 90}
              className="flex flex-col items-center px-6 py-6 text-center"
              style={i > 0 ? { borderLeft: `1px solid ${COLORS.border}` } : {}}
            >
              <div className="mb-4 flex items-center justify-center" style={{ width: 44, height: 44, border: `1px solid ${COLORS.border}` }}>
                <Icon size={20} color={COLORS.brand} />
              </div>
              <h3 style={{ fontWeight: 600, fontSize: "0.98rem", color: "#F8FAFC" }}>{title}</h3>
              <p style={{ color: "#94A3B8", marginTop: "0.4rem", fontSize: "0.88rem", lineHeight: 1.6, maxWidth: 240 }}>{description}</p>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Footer CTA — the spine's final, filled node */}
      <section className="relative px-4 py-16 text-center sm:px-6 sm:py-24">
        <Reveal>
          <div className="mx-auto mb-6 flex justify-center">
            <Node Icon={CheckCircle2} alpha={1} size={52} />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: "clamp(1.5rem, 4vw, 2.25rem)", color: "#F8FAFC" }}>
            Bring structure to how issues get resolved
          </h2>
          <p className="mx-auto mt-3 max-w-xl" style={{ color: "#94A3B8" }}>
            Sign in to access your department's CIMS workspace.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate("/login")}
              className="cims-cta-btn inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base"
              style={{ fontWeight: 600, color: "#FFFFFF", background: COLORS.brand, border: "none", cursor: "pointer" }}
            >
              Sign In
              <ArrowRight size={18} className="cims-cta-arrow" />
            </button>
          </div>
        </Reveal>
      </section>

      {/* Footer */}
      <footer
        className="relative flex flex-col items-center justify-between gap-3 px-4 py-6 text-xs sm:flex-row sm:px-6"
        style={{ borderTop: `1px solid ${COLORS.border}`, color: "#64748B" }}
      >
        <span>&copy; {new Date().getFullYear()} CIMS. All rights reserved.</span>
        <Link to="/login" className="cims-nav-link" style={{ color: "#94A3B8", fontWeight: 500 }}>
          Login
        </Link>
      </footer>
    </div>
  );
}
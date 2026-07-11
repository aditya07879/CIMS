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
} from "lucide-react";

const COLORS = {
  brand: "#F97362",
  bg: "#1E293B",
  bgDeep: "#141E2E",
  card: "#243044",
  border: "#2D3F5A",
};

/* Scroll-reveal hook: fades/slides an element in once it enters the viewport. */
function useReveal(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
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

function Reveal({ as: Tag = "div", delay = 0, className, style, children }) {
  const [ref, visible] = useReveal();
  return (
    <Tag
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}

function Logo({ size = 36 }) {
  return (
    <div
      style={{
        position: "relative",
        width: size,
        height: size,
        background: COLORS.brand,
        flexShrink: 0,
      }}
    >
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
      style={{
        position: "absolute",
        inset: "-44px",
        width: "calc(100% + 88px)",
        height: "calc(100% + 88px)",
        pointerEvents: "none",
      }}
    >
      <defs>
        <pattern
          id="cims-grid"
          width="44"
          height="44"
          patternUnits="userSpaceOnUse"
        >
          <path
            d="M 44 0 L 0 0 0 44"
            fill="none"
            stroke={COLORS.brand}
            strokeOpacity="0.06"
            strokeWidth="1"
          />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#cims-grid)" />
    </svg>
  );
}

function TopAccent() {
  return (
    <div
      className="cims-accent-sweep"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(90deg, transparent, ${COLORS.brand}, transparent)`,
        }}
      />
    </div>
  );
}

function Card({ children, style, className = "" }) {
  return (
    <div className={`cims-card ${className}`} style={style}>
      <TopAccent />
      {children}
    </div>
  );
}

const roleCards = [
  {
    icon: GraduationCap,
    title: "Student",
    description:
      "Raise classroom issues directly to your assigned mentor and track their status from submission to resolution. Every update is logged and visible, so nothing gets lost in conversation.",
  },
  {
    icon: UserCheck,
    title: "Mentor",
    description:
      "Review issues raised by your students and resolve them within a defined response window. Issues left unaddressed are automatically escalated, keeping response times accountable.",
  },
  {
    icon: ShieldCheck,
    title: "HOD",
    description:
      "Oversee escalated issues across mentors and classrooms within your department. Monitor department-wide resolution activity and step in wherever a case has stalled.",
  },
  {
    icon: Settings,
    title: "Admin",
    description:
      "Configure the department hierarchy, manage user roles, and maintain oversight across the entire institution. Full visibility into every issue at every tier.",
  },
];

const steps = [
  {
    icon: FileEdit,
    title: "Raise",
    description: "A student submits an issue tied to their classroom and mentor.",
  },
  {
    icon: Eye,
    title: "Review",
    description: "The assigned mentor reviews the issue and responds within a set timeframe.",
  },
  {
    icon: ArrowUpCircle,
    title: "Escalate if needed",
    description: "Unresolved or inactive issues escalate automatically to the HOD.",
  },
  {
    icon: CheckCircle2,
    title: "Resolve",
    description: "The issue is closed with a recorded outcome, visible to everyone involved.",
  },
];

const trustPoints = [
  {
    icon: ClipboardList,
    title: "Transparent status tracking",
    description: "Every issue carries a visible status from the moment it is raised to the moment it is closed.",
  },
  {
    icon: Layers,
    title: "Accountability at every level",
    description: "Students, mentors, HODs, and admins each operate within a clearly defined scope of responsibility.",
  },
  {
    icon: Lock,
    title: "Structured escalation",
    description: "Issues do not stall silently. Inactivity triggers escalation to the next level automatically.",
  },
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const id = requestAnimationFrame(() => setLoaded(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: COLORS.bg,
        color: "#E2E8F0",
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif",
        position: "relative",
        overflowX: "hidden",
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
        @keyframes cims-pulse-ring {
          0%   { box-shadow: 0 0 0 0 rgba(249, 115, 98, 0.35); }
          100% { box-shadow: 0 0 0 10px rgba(249, 115, 98, 0); }
        }
        .cims-grid-drift {
          animation: cims-drift 18s ease-in-out infinite;
        }
        .cims-accent-sweep > div {
          animation: cims-sweep 4.5s linear infinite;
        }
        .cims-card {
          position: relative;
          background: ${COLORS.card};
          border: 1px solid ${COLORS.border};
          border-radius: 0;
          padding: clamp(1.25rem, 2vw, 1.75rem);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1),
            border-color 0.35s ease, box-shadow 0.35s ease;
        }
        .cims-card:hover {
          transform: translateY(-6px);
          border-color: ${COLORS.brand};
          box-shadow: 0 16px 32px -20px rgba(249, 115, 98, 0.45);
        }
        .cims-card:hover .cims-icon-box {
          transform: scale(1.08);
          background: rgba(249, 115, 98, 0.2) !important;
        }
        .cims-icon-box {
          transition: transform 0.35s ease, background 0.35s ease;
        }
        .cims-cta-btn {
          position: relative;
          overflow: hidden;
          transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1),
            box-shadow 0.25s ease, background 0.25s ease;
        }
        .cims-cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 24px -10px rgba(249, 115, 98, 0.55);
        }
        .cims-cta-btn:active {
          transform: translateY(0);
        }
        .cims-cta-btn:hover .cims-cta-arrow {
          transform: translateX(4px);
        }
        .cims-cta-arrow {
          transition: transform 0.25s ease;
        }
        .cims-nav-link {
          transition: color 0.25s ease, border-color 0.25s ease, background 0.25s ease;
        }
        .cims-nav-link:hover {
          border-color: ${COLORS.brand} !important;
          color: #F8FAFC !important;
        }
        .cims-hero-badge {
          animation: cims-pulse-ring 2.4s ease-out infinite;
        }
        .cims-step-num {
          transition: color 0.35s ease;
        }
        .cims-card:hover .cims-step-num {
          color: ${COLORS.brand};
        }
        @media (prefers-reduced-motion: reduce) {
          .cims-grid-drift, .cims-accent-sweep > div, .cims-hero-badge {
            animation: none !important;
          }
          .cims-card, .cims-cta-btn, .cims-icon-box, .cims-nav-link, .cims-step-num, .cims-cta-arrow {
            transition: none !important;
          }
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
            <span
              style={{ fontWeight: 700, fontSize: "1.05rem", letterSpacing: "0.02em" }}
            >
              CIMS
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/login"
              className="cims-nav-link px-3 py-2 text-sm sm:px-4"
              style={{
                fontWeight: 500,
                color: "#CBD5E1",
                border: `1px solid ${COLORS.border}`,
              }}
            >
              Sign In
            </Link>
            <Link
              to="/login"
              className="cims-cta-btn px-3 py-2 text-sm sm:px-4"
              style={{
                fontWeight: 600,
                color: "#FFFFFF",
                background: COLORS.brand,
              }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-3xl text-center">
          <div
            className="cims-hero-badge mx-auto mb-6 inline-flex items-center gap-2 px-3 py-1 text-xs sm:text-sm"
            style={{
              border: `1px solid ${COLORS.border}`,
              color: "#94A3B8",
              fontWeight: 500,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(16px)",
              transition: "opacity 0.6s ease 0.05s, transform 0.6s ease 0.05s",
            }}
          >
            <Layers size={14} color={COLORS.brand} />
            Structured issue resolution
          </div>
          <h1
            style={{
              fontWeight: 800,
              fontSize: "clamp(2rem, 5vw, 3.25rem)",
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "#F8FAFC",
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.15s, transform 0.7s ease 0.15s",
            }}
          >
            A single, accountable path for every classroom issue
          </h1>
          <p
            className="mx-auto mt-5 max-w-2xl"
            style={{
              fontSize: "clamp(0.95rem, 2vw, 1.1rem)",
              color: "#94A3B8",
              lineHeight: 1.7,
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.28s, transform 0.7s ease 0.28s",
            }}
          >
            CIMS routes every issue through a defined hierarchy — Student to
            Mentor, Mentor to HOD, HOD to Admin — so nothing is resolved
            informally and nothing goes unanswered. Each tier has a clear
            responsibility, and unresolved issues escalate automatically.
          </p>
          <div
            className="mt-8 flex justify-center"
            style={{
              opacity: loaded ? 1 : 0,
              transform: loaded ? "translateY(0)" : "translateY(20px)",
              transition: "opacity 0.7s ease 0.4s, transform 0.7s ease 0.4s",
            }}
          >
            <button
              onClick={() => navigate("/login")}
              className="cims-cta-btn inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base"
              style={{
                fontWeight: 600,
                color: "#FFFFFF",
                background: COLORS.brand,
                border: "none",
                cursor: "pointer",
              }}
            >
              Sign In to CIMS
              <ArrowRight size={18} className="cims-cta-arrow" />
            </button>
          </div>
        </div>
      </section>

      {/* Role-based value section */}
      <section className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <Reveal className="mb-10 text-center sm:mb-14">
          <h2
            style={{
              fontWeight: 700,
              fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
              color: "#F8FAFC",
            }}
          >
            Built for every tier of the department
          </h2>
          <p style={{ color: "#94A3B8", marginTop: "0.5rem" }}>
            Each role has a defined scope of responsibility within the same system.
          </p>
        </Reveal>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {roleCards.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 90}>
              <Card>
                <div
                  className="cims-icon-box mb-4 flex items-center justify-center"
                  style={{
                    width: 44,
                    height: 44,
                    background: "rgba(249, 115, 98, 0.12)",
                  }}
                >
                  <Icon size={22} color={COLORS.brand} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "#F8FAFC" }}>
                  {title}
                </h3>
                <p style={{ color: "#94A3B8", marginTop: "0.5rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
                  {description}
                </p>
              </Card>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        className="relative px-4 py-14 sm:px-6 sm:py-20"
        style={{ background: COLORS.bgDeep, borderTop: `1px solid ${COLORS.border}`, borderBottom: `1px solid ${COLORS.border}` }}
      >
        <div className="mx-auto max-w-6xl">
          <Reveal className="mb-10 text-center sm:mb-14">
            <h2
              style={{
                fontWeight: 700,
                fontSize: "clamp(1.5rem, 3vw, 2.1rem)",
                color: "#F8FAFC",
              }}
            >
              How it works
            </h2>
            <p style={{ color: "#94A3B8", marginTop: "0.5rem" }}>
              A defined path from submission to resolution.
            </p>
          </Reveal>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map(({ icon: Icon, title, description }, index) => (
              <Reveal key={title} delay={index * 90}>
                <Card>
                  <div className="mb-4 flex items-center justify-between">
                    <div
                      className="cims-icon-box flex items-center justify-center"
                      style={{
                        width: 44,
                        height: 44,
                        background: "rgba(249, 115, 98, 0.12)",
                      }}
                    >
                      <Icon size={22} color={COLORS.brand} />
                    </div>
                    <span
                      className="cims-step-num"
                      style={{ color: COLORS.border, fontWeight: 700, fontSize: "1.5rem" }}
                    >
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <h3 style={{ fontWeight: 700, fontSize: "1.05rem", color: "#F8FAFC" }}>
                    {title}
                  </h3>
                  <p style={{ color: "#94A3B8", marginTop: "0.5rem", fontSize: "0.9rem", lineHeight: 1.6 }}>
                    {description}
                  </p>
                </Card>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="relative mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
          {trustPoints.map(({ icon: Icon, title, description }, index) => (
            <Reveal key={title} delay={index * 100} className="flex items-start gap-4">
              <div
                className="flex flex-shrink-0 items-center justify-center"
                style={{ width: 40, height: 40, border: `1px solid ${COLORS.border}` }}
              >
                <Icon size={20} color={COLORS.brand} />
              </div>
              <div>
                <h3 style={{ fontWeight: 600, fontSize: "0.98rem", color: "#F8FAFC" }}>
                  {title}
                </h3>
                <p style={{ color: "#94A3B8", marginTop: "0.35rem", fontSize: "0.88rem", lineHeight: 1.6 }}>
                  {description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <section
        className="relative px-4 py-16 text-center sm:px-6 sm:py-24"
        style={{ borderTop: `1px solid ${COLORS.border}`, background: COLORS.bgDeep }}
      >
        <Reveal>
          <h2
            style={{
              fontWeight: 800,
              fontSize: "clamp(1.5rem, 4vw, 2.25rem)",
              color: "#F8FAFC",
            }}
          >
            Bring structure to how issues get resolved
          </h2>
          <p className="mx-auto mt-3 max-w-xl" style={{ color: "#94A3B8" }}>
            Sign in to access your department's CIMS workspace.
          </p>
          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate("/login")}
              className="cims-cta-btn inline-flex items-center gap-2 px-6 py-3 text-sm sm:text-base"
              style={{
                fontWeight: 600,
                color: "#FFFFFF",
                background: COLORS.brand,
                border: "none",
                cursor: "pointer",
              }}
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
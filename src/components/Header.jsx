import React from "react";
import { useTheme } from "@/context/ThemeContext";

export default function Header() {
  const { theme, toggleTheme } = useTheme();

  return (
    <header
      className="site-header"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "20px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        pointerEvents: "none",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          pointerEvents: "auto",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "0px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: "15px",
                fontWeight: "700",
                letterSpacing: "0.12em",
                color: "var(--header-text)",
                textTransform: "uppercase",
              }}
            >
              PERFECT
            </span>
            <span
              style={{
                fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
                fontSize: "15px",
                fontWeight: "300",
                letterSpacing: "0.12em",
                color: "var(--header-text)",
                textTransform: "uppercase",
              }}
            >
              PAIR
            </span>
          </div>
          <span
            style={{
              fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
              fontSize: "8px",
              fontWeight: "400",
              letterSpacing: "0.2em",
              color: "var(--header-subtext)",
              textTransform: "uppercase",
              marginTop: "-1px",
            }}
          >
            Est. 2026
          </span>
        </div>
      </div>

      {/* Right side */}
      <div
        className="header-nav"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "24px",
          pointerEvents: "auto",
        }}
      >
        <NavItem label="BROWSE" number="01" />
        <NavItem label="COLLECT" number="02" />
        <Divider />
        <QuoteText text="FOOTWEAR" />
        <Divider />
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>

      {/* Mobile responsive styles */}
      <style>{`
        @media (max-width: 600px) {
          .site-header {
            padding: 16px 20px !important;
          }
          .header-nav {
            gap: 12px !important;
          }
          .header-nav-items {
            display: none !important;
          }
        }
      `}</style>
    </header>
  );
}

function NavItem({ label, number }) {
  return (
    <div
      className="header-nav-items"
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: "6px",
        cursor: "pointer",
        opacity: 0.6,
        transition: "opacity 0.2s ease",
      }}
      onMouseEnter={(e) => (e.currentTarget.style.opacity = 1)}
      onMouseLeave={(e) => (e.currentTarget.style.opacity = 0.6)}
    >
      <span
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: "9px",
          fontWeight: "400",
          color: "var(--header-subtext)",
        }}
      >
        {number}
      </span>
      <span
        style={{
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          fontSize: "11px",
          fontWeight: "500",
          letterSpacing: "0.08em",
          color: "var(--header-text)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

function Divider() {
  return (
    <div
      style={{
        width: "1px",
        height: "12px",
        background: "var(--header-divider)",
      }}
    />
  );
}

function QuoteText({ text }) {
  return (
    <span
      className="header-nav-items"
      style={{
        fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        fontSize: "11px",
        fontWeight: "400",
        letterSpacing: "0.05em",
        color: "var(--header-text)",
        opacity: 0.4,
      }}
    >
      &ldquo;{text}&rdquo;
    </span>
  );
}

function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggle}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        width: "32px",
        height: "18px",
        borderRadius: "9px",
        border: "1px solid var(--header-divider)",
        background: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)",
        cursor: "pointer",
        padding: 0,
        position: "relative",
        transition: "background 0.25s ease",
        outline: "none",
        flexShrink: 0,
      }}
    >
      {/* Track knob */}
      <span
        style={{
          position: "absolute",
          top: "2px",
          left: isDark ? "14px" : "2px",
          width: "12px",
          height: "12px",
          borderRadius: "50%",
          background: isDark ? "#ffffff" : "#000000",
          transition: "left 0.25s ease, background 0.25s ease",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      />
    </button>
  );
}

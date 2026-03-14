import React, { useEffect, useState, useRef } from "react";
import { Html } from "@react-three/drei";
import { useThree } from "@react-three/fiber";

export function CloseButton({
  isActive,
  position,
  onClose,
}) {
  const { gl } = useThree();
  const [shouldShow, setShouldShow] = useState(false);
  const timerRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    canvasRef.current = gl.domElement;
  }, [gl]);

  // 250ms delay before showing
  useEffect(() => {
    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!isActive) {
      // Use setTimeout(0) to avoid synchronous setState
      timerRef.current = setTimeout(() => {
        setShouldShow(false);
      }, 0);
      return () => {
        if (timerRef.current)
          clearTimeout(timerRef.current);
      };
    }

    timerRef.current = setTimeout(() => {
      setShouldShow(true);
    }, 250);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [isActive]);

  if (!isActive) return null;

  // Convert 3D position to screen coordinates for Html
  // Html centers by default, so we need to adjust
  const [x, y, z] = position;

  return (
    <Html
      position={[x, y, z]}
      center
      style={{
        pointerEvents: "auto",
        transform: "translate(-50%, -150%)",
      }}
      occlude
    >
      <style>
        {`
          @keyframes breathe {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.015); }
          }
        `}
      </style>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
        onMouseEnter={() => {
          if (canvasRef.current) {
            canvasRef.current.style.cursor = "pointer";
          }
        }}
        onMouseLeave={() => {
          if (canvasRef.current) {
            canvasRef.current.style.cursor = "grab";
          }
        }}
        style={{
          width: "32px",
          height: "32px",
          border: "1px solid var(--close-btn-border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          padding: 0,
          opacity: shouldShow ? 0.6 : 0,
          animation: shouldShow
            ? "breathe 3.14s ease-in-out infinite"
            : "none",
          transform: shouldShow ? "scale(1)" : "scale(0.8)",
          transition: "opacity 0.2s ease",
          background: "transparent",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.opacity = "0.8";
        }}
        onMouseOut={(e) => {
          if (shouldShow) {
            e.currentTarget.style.opacity = "0.6";
          }
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--close-btn-stroke)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </Html>
  );
}

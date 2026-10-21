import { useEffect, useMemo, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export default function AnimatedNumber({ value, prefix = "", suffix = "", className = "" }) {
  const shouldReduceMotion = useReducedMotion();
  const parsed = useMemo(() => parseDisplayValue(value), [value]);
  const [displayValue, setDisplayValue] = useState(parsed.numeric);
  const previousValueRef = useRef(parsed.numeric);

  useEffect(() => {
    if (parsed.numeric === null) return undefined;
    if (shouldReduceMotion) {
      previousValueRef.current = parsed.numeric;
      setDisplayValue(parsed.numeric);
      return undefined;
    }

    const startValue = previousValueRef.current ?? 0;
    const endValue = parsed.numeric;
    const duration = 700;
    const startedAt = performance.now();
    let frameId = 0;

    function tick(now) {
      const progress = Math.min(1, (now - startedAt) / duration);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayValue(Math.round(startValue + (endValue - startValue) * eased));
      if (progress < 1) frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);
    previousValueRef.current = endValue;
    return () => window.cancelAnimationFrame(frameId);
  }, [parsed.numeric, shouldReduceMotion]);

  if (parsed.numeric === null) {
    return <span className={className}>{String(value ?? "")}</span>;
  }

  return (
    <motion.span
      className={className}
      initial={shouldReduceMotion ? false : { opacity: 0.6, y: 4 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: "easeOut" }}
    >
      {prefix}
      {formatAnimatedValue(displayValue, parsed.decimals)}
      {suffix}
    </motion.span>
  );
}

function parseDisplayValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return { numeric: value, decimals: hasDecimals(value) ? 1 : 0 };
  }

  if (typeof value !== "string") {
    return { numeric: null, decimals: 0 };
  }

  const cleaned = value.replace(/,/g, "").trim();
  if (!/^[-+]?\d+(\.\d+)?$/.test(cleaned)) {
    return { numeric: null, decimals: 0 };
  }

  const numeric = Number(cleaned);
  return { numeric: Number.isFinite(numeric) ? numeric : null, decimals: cleaned.includes(".") ? 1 : 0 };
}

function formatAnimatedValue(value, decimals) {
  return new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals,
  }).format(value);
}

function hasDecimals(value) {
  return Math.abs(value % 1) > 0;
}

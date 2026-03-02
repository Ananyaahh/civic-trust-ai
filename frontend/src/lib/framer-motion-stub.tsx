import React, { useEffect, useMemo, useState } from "react";

export type MotionValue<T> = T;

export function useScroll({ target }: { target: React.RefObject<HTMLElement | null> }) {
  const [scrollYProgress, setScrollYProgress] = useState(0);

  useEffect(() => {
    function updateProgress() {
      const el = target.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewport = window.innerHeight || 1;
      const total = rect.height + viewport;
      const covered = viewport - rect.top;
      const progress = Math.min(1, Math.max(0, covered / total));
      setScrollYProgress(progress);
    }

    updateProgress();
    window.addEventListener("scroll", updateProgress, { passive: true });
    window.addEventListener("resize", updateProgress);
    return () => {
      window.removeEventListener("scroll", updateProgress);
      window.removeEventListener("resize", updateProgress);
    };
  }, [target]);

  return { scrollYProgress };
}

export function useTransform(
  value: number,
  inputRange: [number, number],
  outputRange: [number, number]
): number {
  return useMemo(() => {
    const [inMin, inMax] = inputRange;
    const [outMin, outMax] = outputRange;
    if (inMax === inMin) return outMin;
    const ratio = (value - inMin) / (inMax - inMin);
    const clamped = Math.min(1, Math.max(0, ratio));
    return outMin + clamped * (outMax - outMin);
  }, [value, inputRange, outputRange]);
}

type MotionDivProps = React.HTMLAttributes<HTMLDivElement> & {
  style?: React.CSSProperties & {
    rotateX?: number;
    scale?: number;
    translateY?: number;
  };
};

const MotionDiv = React.forwardRef<HTMLDivElement, MotionDivProps>(function MotionDiv(
  { style, ...props },
  ref
) {
  const { rotateX, scale, translateY, transform, ...rest } = style || {};
  const transforms: string[] = [];

  if (typeof translateY === "number") transforms.push(`translateY(${translateY}px)`);
  if (typeof rotateX === "number") transforms.push(`rotateX(${rotateX}deg)`);
  if (typeof scale === "number") transforms.push(`scale(${scale})`);
  if (typeof transform === "string" && transform.length > 0) transforms.push(transform);

  return <div ref={ref} style={{ ...rest, transform: transforms.join(" ") }} {...props} />;
});

export const motion = {
  div: MotionDiv,
};

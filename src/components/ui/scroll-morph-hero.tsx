import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";
import logoDark from "@/assets/logo-makir.svg";

// --- Types ---
export type AnimationPhase = "scatter" | "line" | "circle" | "final";

interface FlipCardProps {
  src: string;
  index: number;
  total: number;
  phase: AnimationPhase;
  target: { x: number; y: number; rotation: number; scale: number; opacity: number };
}

// --- FlipCard Component ---
const IMG_WIDTH = 60;
const IMG_HEIGHT = 85;

function FlipCard({ src, index, total, phase, target }: FlipCardProps) {
  return (
    <motion.div
      className="absolute"
      style={{
        width: IMG_WIDTH,
        height: IMG_HEIGHT,
        perspective: 800,
        zIndex: total - index,
      }}
      animate={{
        x: target.x,
        y: target.y,
        rotate: target.rotation,
        scale: target.scale,
        opacity: target.opacity,
      }}
      transition={{
        type: "spring",
        stiffness: 40,
        damping: 15,
        mass: 1,
      }}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        whileHover={{ rotateY: 180 }}
        transition={{ duration: 0.6 }}
      >
        <div
          className="absolute inset-0 rounded-lg overflow-hidden shadow-lg"
          style={{ backfaceVisibility: "hidden" }}
        >
          <img src={src} alt={`hero-${index}`} className="w-full h-full object-cover" loading="lazy" />
        </div>
        <div
          className="absolute inset-0 rounded-lg overflow-hidden shadow-lg bg-primary flex items-center justify-center"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <div className="text-center text-primary-foreground">
            <p className="text-[10px] font-semibold">View</p>
            <p className="text-[8px] opacity-70">Details</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// --- Dot Grid Canvas ---
function DotGridCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const GAP = 28;
    const DOT_RADIUS = 1;
    const GLOW_RADIUS = 150;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      const mx = mouseRef.current.x;
      const my = mouseRef.current.y;
      const cols = Math.ceil(w / GAP) + 1;
      const rows = Math.ceil(h / GAP) + 1;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const x = c * GAP;
          const y = r * GAP;
          const dx = x - mx;
          const dy = y - my;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const t = Math.max(0, 1 - dist / GLOW_RADIUS);
          const alpha = 0.15 + t * 0.7;
          const radius = DOT_RADIUS + t * 1.5;

          if (t > 0.01) {
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(80, 65%, 55%, ${alpha})`;
            ctx.fill();
          } else {
            ctx.beginPath();
            ctx.arc(x, y, DOT_RADIUS, 0, Math.PI * 2);
            ctx.fillStyle = `hsla(220, 10%, 78%, 0.22)`;
            ctx.fill();
          }
        }
      }
      animFrameRef.current = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const handleMouseLeave = () => {
      mouseRef.current = { x: -1000, y: -1000 };
    };

    resize();
    window.addEventListener("resize", resize);
    canvas.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("mouseleave", handleMouseLeave);
    animFrameRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      canvas.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("mouseleave", handleMouseLeave);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full z-[1]" />;
}

// --- Main Hero Component ---
const TOTAL_IMAGES = 20;

const IMAGES = [
  "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=300&q=80",
  "https://images.unsplash.com/photo-1519710164239-da123dc03ef4?w=300&q=80",
  "https://images.unsplash.com/photo-1497366216548-37526070297c?w=300&q=80",
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=300&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=300&q=80",
  "https://images.unsplash.com/photo-1506765515384-028b60a970df?w=300&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=300&q=80",
  "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=300&q=80",
  "https://images.unsplash.com/photo-1500485035595-cbe6f645feb1?w=300&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=300&q=80",
  "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=300&q=80",
  "https://images.unsplash.com/photo-1518020382113-a7e8fc38eac9?w=300&q=80",
  "https://images.unsplash.com/photo-1465146344425-f00d5f5c8f07?w=300&q=80",
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?w=300&q=80",
  "https://images.unsplash.com/photo-1493246507139-91e8fad9978e?w=300&q=80",
  "https://images.unsplash.com/photo-1494438639946-1ebd1d20bf85?w=300&q=80",
  "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=300&q=80",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=300&q=80",
  "https://images.unsplash.com/photo-1523961131990-5ea7c61b2107?w=300&q=80",
  "https://images.unsplash.com/photo-1496568816309-51d7c20e3b21?w=300&q=80",
];

const lerp = (start: number, end: number, t: number) => start * (1 - t) + end * t;

interface ScrollMorphHeroProps {
  title?: string;
  subtitle?: string;
  contentTitle?: string;
  contentDescription?: string;
  children?: React.ReactNode;
  skipAnimation?: boolean;
}

export default function ScrollMorphHero({
  title = "MAKIR",
  subtitle = "ROLE PARA EXPLORAR",
  contentTitle = "CRM Eclesiástico",
  contentDescription = "Gerencie visitantes, discipulado e grupos de crescimento de forma simples e eficiente.",
  children,
  skipAnimation = false,
}: ScrollMorphHeroProps) {
  const [introPhase, setIntroPhase] = useState<AnimationPhase>("scatter");
  const [autoProgress, setAutoProgress] = useState(0); // 0 to 1
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const autoAnimRef = useRef<number>(0);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(containerRef.current);
    setContainerSize({ width: containerRef.current.offsetWidth, height: containerRef.current.offsetHeight });
    return () => observer.disconnect();
  }, []);

  // Phase timeline: scatter(0-0.5s) → line(0.5-2.5s) → circle(2.5-6.5s) → auto-morph to final
  useEffect(() => {
    if (skipAnimation) {
      setIntroPhase("final");
      setAutoProgress(1);
      return;
    }
    const t1 = setTimeout(() => setIntroPhase("line"), 500);
    const t2 = setTimeout(() => setIntroPhase("circle"), 2500);
    const t3 = setTimeout(() => {
      setIntroPhase("final");
      // Animate autoProgress from 0 to 1 over ~2s
      const start = performance.now();
      const duration = 2000;
      const animate = (now: number) => {
        const elapsed = now - start;
        const t = Math.min(elapsed / duration, 1);
        // Ease out cubic
        const eased = 1 - Math.pow(1 - t, 3);
        setAutoProgress(eased);
        if (t < 1) autoAnimRef.current = requestAnimationFrame(animate);
      };
      autoAnimRef.current = requestAnimationFrame(animate);
    }, 6500); // 4s after circle forms at 2.5s

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      cancelAnimationFrame(autoAnimRef.current);
    };
  }, [skipAnimation]);

  const mouseX = useMotionValue(0);
  const smoothMouseX = useSpring(mouseX, { stiffness: 30, damping: 20 });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const normalizedX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseX.set(normalizedX * 100);
    };
    container.addEventListener("mousemove", handleMouseMove);
    return () => container.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX]);

  const scatterPositions = useMemo(() => {
    return IMAGES.map(() => ({
      x: (Math.random() - 0.5) * 1500,
      y: (Math.random() - 0.5) * 1000,
      rotation: (Math.random() - 0.5) * 180,
      scale: 0.6,
      opacity: 0,
    }));
  }, []);

  const [parallaxValue, setParallaxValue] = useState(0);
  useEffect(() => {
    const unsub = smoothMouseX.on("change", setParallaxValue);
    return unsub;
  }, [smoothMouseX]);

  const showContent = introPhase === "final";

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {/* Dot grid background */}
      <DotGridCanvas />

      <div
        ref={containerRef}
        className="relative w-full h-full overflow-hidden z-[2]"
        style={{ touchAction: "none" }}
      >
        {/* Intro Text */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-center z-10 pointer-events-none"
          animate={{ opacity: introPhase === "circle" || introPhase === "final" ? 0 : 1 }}
          transition={{ duration: 1 }}
        >
          <motion.div
            animate={{ opacity: introPhase === "scatter" ? 0 : 1, y: introPhase === "scatter" ? 20 : 0 }}
            transition={{ duration: 0.8 }}
          >
            <img src={logoDark} alt={title} className="h-14 md:h-20" />
          </motion.div>
          <motion.p
            className="text-xs md:text-sm text-muted-foreground mt-4 tracking-[0.3em] uppercase"
            animate={{ opacity: introPhase === "line" ? 1 : 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {subtitle}
          </motion.p>
        </motion.div>

        {/* Content (fades in during final phase) */}
        <motion.div
          className="absolute inset-0 flex flex-col items-center justify-start pt-[15%] z-10 pointer-events-none"
          animate={{ opacity: showContent ? 1 : 0, y: showContent ? 0 : 20 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <img src={logoDark} alt={contentTitle} className="h-12 md:h-16 mb-4" />
          <p className="text-sm md:text-base text-muted-foreground max-w-md text-center px-4">
            {contentDescription}
          </p>
          {children && (
            <div className="mt-8 pointer-events-auto">
              {children}
            </div>
          )}
        </motion.div>

        {/* Cards */}
        <div className="absolute inset-0 flex items-center justify-center">
          {IMAGES.slice(0, TOTAL_IMAGES).map((src, i) => {
            let target = { x: 0, y: 0, rotation: 0, scale: 1, opacity: 1 };

            if (introPhase === "scatter") {
              target = scatterPositions[i];
            } else if (introPhase === "line") {
              const lineSpacing = 70;
              const lineTotalWidth = TOTAL_IMAGES * lineSpacing;
              const lineX = i * lineSpacing - lineTotalWidth / 2;
              target = { x: lineX, y: 0, rotation: 0, scale: 1, opacity: 1 };
            } else {
              // circle → final (auto morph)
              const isMobile = containerSize.width < 768;
              const minDimension = Math.min(containerSize.width, containerSize.height);

              const circleRadius = Math.min(minDimension * 0.35, 350);
              const circleAngle = (i / TOTAL_IMAGES) * 360;
              const circleRad = (circleAngle * Math.PI) / 180;
              const circlePos = {
                x: Math.cos(circleRad) * circleRadius,
                y: Math.sin(circleRad) * circleRadius,
                rotation: circleAngle + 90,
              };

              const baseRadius = Math.min(containerSize.width, containerSize.height * 1.5);
              const arcRadius = baseRadius * (isMobile ? 1.4 : 1.1);
              const arcApexY = containerSize.height * (isMobile ? 0.35 : 0.25);
              const arcCenterY = arcApexY + arcRadius;

              const spreadAngle = isMobile ? 100 : 130;
              const startAngle = -90 - spreadAngle / 2;
              const step = spreadAngle / (TOTAL_IMAGES - 1);
              const currentArcAngle = startAngle + i * step;
              const arcRad = (currentArcAngle * Math.PI) / 180;

              const arcPos = {
                x: Math.cos(arcRad) * arcRadius + parallaxValue,
                y: Math.sin(arcRad) * arcRadius + arcCenterY,
                rotation: currentArcAngle + 90,
                scale: isMobile ? 1.4 : 1.8,
              };

              target = {
                x: lerp(circlePos.x, arcPos.x, autoProgress),
                y: lerp(circlePos.y, arcPos.y, autoProgress),
                rotation: lerp(circlePos.rotation, arcPos.rotation, autoProgress),
                scale: lerp(1, arcPos.scale, autoProgress),
                opacity: 1,
              };
            }

            return (
              <FlipCard key={i} src={src} index={i} total={TOTAL_IMAGES} phase={introPhase} target={target} />
            );
          })}
        </div>
      </div>
    </div>
  );
}

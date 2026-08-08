"use client";

import { useEffect, useRef } from "react";

type ParticleType = "firefly" | "sakura";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  opacity: number;
  opacityDir: number;
  hue: number;
  swing: number;
  swingSpeed: number;
  rotation: number;
  rotationSpeed: number;
}

interface ParticleBackgroundProps {
  type?: ParticleType;
  count?: number;
}

export function ParticleBackground({
  type = "firefly",
  count = 40,
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = 0;
    let height = 0;
    let particles: Particle[] = [];
    let animationId: number | null = null;
    let lastTime = 0;
    const fps = 30;
    const interval = 1000 / fps;

    const actualCount =
      window.innerWidth < 768 ? Math.floor(count * 0.5) : count;

    function resize() {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function createParticle(): Particle {
      if (type === "sakura") {
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.6,
          vy: 0.4 + Math.random() * 0.6,
          size: 8 + Math.random() * 8,
          opacity: 0.6 + Math.random() * 0.4,
          opacityDir: 1,
          hue: 340 + Math.random() * 20,
          swing: Math.random() * Math.PI * 2,
          swingSpeed: 0.02 + Math.random() * 0.025,
          rotation: Math.random() * Math.PI * 2,
          rotationSpeed: (Math.random() - 0.5) * 0.05,
        };
      }
      return {
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.2,
        vy: -0.15 - Math.random() * 0.35,
        size: 1.5 + Math.random() * 3.5,
        opacity: 0.15 + Math.random() * 0.6,
        opacityDir: Math.random() > 0.5 ? 1 : -1,
        hue: 40 + Math.random() * 15,
        swing: Math.random() * Math.PI * 2,
        swingSpeed: 0.008 + Math.random() * 0.015,
        rotation: 0,
        rotationSpeed: 0,
      };
    }

    function initParticles() {
      particles = [];
      for (let i = 0; i < actualCount; i++) {
        particles.push(createParticle());
      }
    }

    function drawFirefly(p: Particle) {
      const glowSize = p.size * 4;
      const gradient = ctx.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, glowSize
      );
      gradient.addColorStop(0, `hsla(${p.hue}, 90%, 72%, ${p.opacity})`);
      gradient.addColorStop(0.3, `hsla(${p.hue}, 85%, 65%, ${p.opacity * 0.4})`);
      gradient.addColorStop(1, `hsla(${p.hue}, 80%, 60%, 0)`);
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowSize, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `hsla(${p.hue}, 100%, 92%, ${p.opacity})`;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }

    function drawSakura(p: Particle) {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation);
      ctx.globalAlpha = p.opacity;

      const s = p.size;
      ctx.fillStyle = `hsl(${p.hue}, 80%, 75%)`;
      ctx.beginPath();
      ctx.moveTo(0, -s);
      ctx.bezierCurveTo(s * 0.4, -s * 0.6, s * 0.5, s * 0.2, 0, s * 0.5);
      ctx.bezierCurveTo(-s * 0.5, s * 0.2, -s * 0.4, -s * 0.6, 0, -s);
      ctx.fill();

      ctx.fillStyle = `hsla(${p.hue}, 70%, 90%, ${p.opacity * 0.5})`;
      ctx.beginPath();
      ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function updateParticle(p: Particle) {
      p.swing += p.swingSpeed;
      p.x += p.vx + Math.sin(p.swing) * (type === "sakura" ? 0.8 : 0.25);
      p.y += p.vy;
      p.rotation += p.rotationSpeed;

      if (type === "firefly") {
        p.opacity += p.opacityDir * 0.008;
        if (p.opacity > 0.75) { p.opacity = 0.75; p.opacityDir = -1; }
        if (p.opacity < 0.08) { p.opacity = 0.08; p.opacityDir = 1; }

        if (p.y < -20) {
          p.y = height + 20;
          p.x = Math.random() * width;
        }
      } else {
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * width;
        }
      }

      if (p.x < -30) p.x = width + 30;
      if (p.x > width + 30) p.x = -30;
    }

    function animate(time: number) {
      animationId = requestAnimationFrame(animate);

      const dt = time - lastTime;
      if (dt < interval) return;
      lastTime = time - (dt % interval);

      ctx.clearRect(0, 0, width, height);

      for (const p of particles) {
        updateParticle(p);
        if (type === "sakura") {
          drawSakura(p);
        } else {
          drawFirefly(p);
        }
      }
    }

    resize();
    initParticles();
    animationId = requestAnimationFrame(animate);

    const handleResize = () => {
      resize();
      initParticles();
    };
    window.addEventListener("resize", handleResize);

    const handleVisibility = () => {
      if (document.hidden) {
        if (animationId) {
          cancelAnimationFrame(animationId);
          animationId = null;
        }
      } else if (!animationId) {
        lastTime = 0;
        animationId = requestAnimationFrame(animate);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);

    return () => {
      if (animationId) cancelAnimationFrame(animationId);
      window.removeEventListener("resize", handleResize);
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, [type, count]);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

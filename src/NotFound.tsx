import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";

// Import all Funko images

import BackgroundStars from "/src/assets/space-bg.jpg";

const NotFound: React.FC = () => {
const funkos = [
  {
    src: "/src/assets/funko-pop/EmmettBrown.png",
    alt: "Emmett Brown",
    size: 180
  },
  {
    src: "/src/assets/funko-pop/Dogpool.png",
    alt: "Dogpool", 
    size: 160
  },
  {
    src: "/src/assets/funko-pop/DrPhosporus.png",
    alt: "Dr. Phosphorus",
    size: 200
  },
  {
    src: "/src/assets/funko-pop/Lilo.png",
    alt: "Lilo",
    size: 150
  },
  {
    src: "/src/assets/funko-pop/winnie.png",
    alt: "Winnie the Pooh",
    size: 170
  }
];

  // Animation values
  const count = useMotionValue(0);
  const rounded = useTransform(count, (latest) => Math.round(latest));
  const [currentFunko, setCurrentFunko] = useState(0);
  const [exitLeft, setExitLeft] = useState(true);

  // Environment / device checks
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isCoarsePointer = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  const hasTouch = typeof window !== 'undefined' && ('ontouchstart' in window || (navigator && (navigator as any).maxTouchPoints > 0));
  // Enable parallax only on fine-pointer, non-reduced-motion, non-touch devices
  const enableParallax = !isCoarsePointer && !prefersReducedMotion && !hasTouch;

  // Background parallax effect (only enabled on non-coarse, non-reduced-motion devices)
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const backgroundX = enableParallax && typeof window !== 'undefined' ? useTransform(mouseX, [0, window.innerWidth], [-50, 50]) : useMotionValue(0);
  const backgroundY = enableParallax && typeof window !== 'undefined' ? useTransform(mouseY, [0, window.innerHeight], [-30, 30]) : useMotionValue(0);

  // mobile detection for layout tweaks
  const [isMobile, setIsMobile] = useState<boolean>(false);
  useEffect(() => {
    const update = () => setIsMobile(typeof window !== 'undefined' ? window.innerWidth < 640 : false);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  useEffect(() => {
    // Count up animation -- respect reduced motion
    const animation = prefersReducedMotion ? { stop: () => {} } as any : animate(count, 404, { duration: 2 });

    // Funko rotation: slower on mobile / coarse pointer to save CPU
    const intervalMs = isCoarsePointer ? 7000 : 3000;
    const interval = setInterval(() => {
      setExitLeft((v) => !v);
      setTimeout(() => {
        setCurrentFunko((prev) => (prev + 1) % funkos.length);
      }, 500);
    }, intervalMs);

    // Mouse movement for parallax: only attach if parallax enabled
    const handleMouseMove = (e: MouseEvent) => {
      if (!enableParallax) return;
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

  // Attach mousemove only when parallax is enabled and device is not a touch device
  if (enableParallax && !hasTouch) window.addEventListener("mousemove", handleMouseMove);

    return () => {
      if (!prefersReducedMotion) animation.stop();
      clearInterval(interval);
  if (enableParallax && !hasTouch) window.removeEventListener("mousemove", handleMouseMove);
    };
  }, [isCoarsePointer, prefersReducedMotion, enableParallax, isMobile]);

  // Particle/background tuning for mobile/coarse/reduced-motion
  const particleCount = (isMobile || isCoarsePointer || prefersReducedMotion) ? 6 : 30;
  const bgFunkoCount = (isMobile || isCoarsePointer || prefersReducedMotion) ? 0 : 5;

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* Animated space background with parallax */}
      <motion.div 
        className="absolute inset-0 bg-black"
        style={{
          x: backgroundX,
          y: backgroundY,
          backgroundImage: `url(${BackgroundStars})`, opacity: 0.8,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      />

  {/* Glowing particles (reduced on mobile / reduced-motion) */}
  {(!isCoarsePointer && !prefersReducedMotion) && [...Array(particleCount)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          initial={{
            x: (typeof window !== 'undefined' ? Math.random() * window.innerWidth : 0),
            y: (typeof window !== 'undefined' ? Math.random() * window.innerHeight : 0),
            opacity: 0,
            width: Math.random() * 5 + 1,
            height: Math.random() * 5 + 1
          }}
          animate={{
            y: [null, (Math.random() - 0.5) * 100],
            opacity: [0, 0.7, 0],
            transition: {
              duration: Math.random() * 5 + 3,
              repeat: Infinity,
              repeatType: "reverse"
            }
          }}
        />
      ))}

      {/* Main content */}
      <div className="relative h-full w-full flex items-center justify-center p-8 text-white">
        <div className="max-w-4xl mx-auto text-center z-10">
          {/* Animated 404 number */}
              <motion.h1
                className={`font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-600 mb-4 ${isMobile ? 'text-6xl' : 'text-9xl'}`}
                initial={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -50 }}
                animate={prefersReducedMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 1 }}
              >
                <motion.span>{rounded}</motion.span>
              </motion.h1>

          {/* Error message */}
          <motion.p 
            className="text-2xl mb-12"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            Houston, we have a problem! This page is lost in space.
          </motion.p>

          {/* Animated Funko Pop */}
          <div className="relative mb-12" style={{ height: isMobile ? 220 : 256 }}>
            {funkos.map((funko, index) => (
              <motion.div
                key={index}
                className="absolute inset-0 flex items-center justify-center"
                initial={{ 
                  x: index === currentFunko ? 0 : (exitLeft ? -500 : 500),
                  opacity: index === currentFunko ? 1 : 0,
                  rotate: index === currentFunko ? 0 : (exitLeft ? -30 : 30)
                }}
                animate={{ 
                  x: index === currentFunko ? 0 : (exitLeft ? 500 : -500),
                  opacity: index === currentFunko ? 1 : 0,
                  rotate: index === currentFunko ? [0, -10, 10, 0] : 0,
                  transition: { 
                    x: { duration: prefersReducedMotion ? 0 : 0.5 },
                    opacity: { duration: prefersReducedMotion ? 0 : 0.3 },
                    rotate: prefersReducedMotion ? undefined : { 
                      duration: 2, 
                      repeat: Infinity,
                      ease: "easeInOut" 
                    }
                  }
                }}
                exit={{ 
                  x: exitLeft ? -500 : 500,
                  opacity: 0,
                  transition: { duration: 0.5 }
                }}
              >
                <img
                  src={funko.src}
                  alt={funko.alt}
                  className="drop-shadow-2xl"
                  style={{ 
                    height: `${Math.round(funko.size * (isMobile ? 0.6 : 1))}px`,
                    filter: "drop-shadow(0 0 15px rgba(255, 255, 255, 0.7))"
                  }}
                />
              </motion.div>
            ))}
          </div>

          {/* Home button */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2 }}
          >
            <Link
              to="/"
              className="inline-block px-12 py-4 text-xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 rounded-full hover:from-purple-700 hover:to-blue-600 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              Beam Me Home
            </Link>
          </motion.div>

          {/* Floating Funko Pops in background (disabled on mobile/reduced-motion) */}
          {(!isCoarsePointer && !prefersReducedMotion) && [...Array(bgFunkoCount)].map((_, i) => {
            const randomFunko = funkos[Math.floor(Math.random() * funkos.length)];
            return (
              <motion.div
                key={`bg-${i}`}
                className="absolute"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  width: `${Math.random() * 100 + 50}px`,
                  opacity: 0.3,
                  zIndex: 0
                }}
                animate={{
                  y: [0, (Math.random() - 0.5) * 100],
                  x: [0, (Math.random() - 0.5) * 100],
                  rotate: [0, 360],
                  transition: {
                    duration: Math.random() * 10 + 10,
                    repeat: Infinity,
                    repeatType: "reverse",
                    ease: "linear"
                  }
                }}
              >
                <img 
                  src={randomFunko.src} 
                  alt="" 
                  className="w-full h-full object-contain" 
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default NotFound;
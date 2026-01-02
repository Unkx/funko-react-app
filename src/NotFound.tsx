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

  // Background parallax effect
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const backgroundX = useTransform(mouseX, [0, window.innerWidth], [-50, 50]);
  const backgroundY = useTransform(mouseY, [0, window.innerHeight], [-30, 30]);

  useEffect(() => {
    // Count up animation
    const animation = animate(count, 404, { duration: 2 });
    
    // Funko rotation
    const interval = setInterval(() => {
      setExitLeft(!exitLeft);
      setTimeout(() => {
        setCurrentFunko((prev) => (prev + 1) % funkos.length);
      }, 500);
    }, 3000);

    // Mouse movement for parallax
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);

    return () => {
      animation.stop();
      clearInterval(interval);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

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

      {/* Glowing particles */}
      {[...Array(30)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white"
          initial={{
            x: Math.random() * window.innerWidth,
            y: Math.random() * window.innerHeight,
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
            className="text-9xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-red-500 to-purple-600 mb-4"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
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
          <div className="relative h-64 mb-12">
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
                    x: { duration: 0.5 },
                    opacity: { duration: 0.3 },
                    rotate: { 
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
                    height: `${funko.size}px`,
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

          {/* Floating Funko Pops in background */}
          {[...Array(5)].map((_, i) => {
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
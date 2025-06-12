// src/components/layout/ParticleBackground.tsx
'use client';
import React, { useEffect, useState } from 'react';

const ParticleBackground = () => {
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    const numParticles = 10; // Keep it reasonable for performance
    const newParticles = Array.from({ length: numParticles }).map((_, i) => {
      const animationDuration = Math.random() * 10 + 15; // Animation duration 15s to 25s
      const animationDelay = Math.random() * 20; // Delay up to 20s
      
      const isVertical = Math.random() > 0.4; // Introduce some vertical lines
      let style: React.CSSProperties;

      if (isVertical) {
        const lineWidthPx = Math.random() * 1 + 1; // 1px to 2px thick
        const lineHeightVh = Math.random() * 40 + 20; // 20vh to 60vh tall
        style = {
          width: `${lineWidthPx}px`,
          height: `${lineHeightVh}vh`,
          left: `${Math.random() * 100}vw`, // Random horizontal position
          top: `-${lineHeightVh}vh`, // Start off-screen to the top
          animationName: 'line-scan-vertical',
          animationDuration: `${animationDuration}s`,
          animationDelay: `${animationDelay}s`,
        };
      } else { // Horizontal
        const lineWidthVw = Math.random() * 40 + 20; // 20vw to 60vw wide
        const lineHeightPx = Math.random() * 1 + 1; // 1px to 2px thick
        style = {
          width: `${lineWidthVw}vw`,
          height: `${lineHeightPx}px`,
          left: `-${lineWidthVw}vw`, // Start off-screen to the left
          top: `${Math.random() * 100}vh`, // Random vertical position
          animationName: 'line-scan',
          animationDuration: `${animationDuration}s`,
          animationDelay: `${animationDelay}s`,
        };
      }
      
      return {
        id: i,
        style: style,
      };
    });
    setParticles(newParticles);
  }, []);

  return (
    <div className="fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden">
      {particles.map(p => (
        <div key={p.id} className="particle" style={p.style} />
      ))}
    </div>
  );
};

export default ParticleBackground;

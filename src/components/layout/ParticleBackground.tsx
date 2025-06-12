// src/components/layout/ParticleBackground.tsx
'use client';
import React, { useEffect, useState } from 'react';

const ParticleBackground = () => {
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    const numParticles = 8; // Reduced number of lines
    const newParticles = Array.from({ length: numParticles }).map((_, i) => {
      const lineWidthVw = Math.random() * 30 + 20; // Line width from 20vw to 50vw
      const lineHeightPx = Math.random() * 1 + 1; // Line height 1px to 2px
      
      const animationDuration = Math.random() * 10 + 15; // Animation duration 15s to 25s
      const animationDelay = Math.random() * 20; // Delay up to 20s
      
      return {
        id: i,
        style: {
          width: `${lineWidthVw}vw`,
          height: `${lineHeightPx}px`,
          left: `-${lineWidthVw}vw`, // Start off-screen to the left
          top: `${Math.random() * 100}%`, // Random vertical position
          animationDuration: `${animationDuration}s`,
          animationDelay: `${animationDelay}s`,
          // Common properties like animation-name, timing-function, iteration-count, background, opacity are in .particle class
        } as React.CSSProperties,
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

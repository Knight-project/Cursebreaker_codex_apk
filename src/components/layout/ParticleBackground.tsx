// src/components/layout/ParticleBackground.tsx
'use client';
import React, { useEffect, useState } from 'react';

const ParticleBackground = () => {
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    const numParticles = 20; // Adjust for density
    const newParticles = Array.from({ length: numParticles }).map((_, i) => {
      const size = Math.random() * 3 + 1; // Particle size 1px to 4px
      const animationDuration = Math.random() * 5 + 5; // 5s to 10s
      const animationDelay = Math.random() * 5; // Delay up to 5s
      return {
        id: i,
        style: {
          width: `${size}px`,
          height: `${size}px`,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDuration: `${animationDuration}s`,
          animationDelay: `${animationDelay}s`,
          opacity: 0, // Start hidden, animation handles fade in
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

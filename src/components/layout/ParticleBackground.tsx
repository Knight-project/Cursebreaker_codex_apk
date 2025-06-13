
// src/components/layout/ParticleBackground.tsx
'use client';
import React, { useEffect, useState } from 'react';

const ParticleBackground = () => {
  const [particles, setParticles] = useState<Array<{ id: number; style: React.CSSProperties }>>([]);

  useEffect(() => {
    const numParticles = 12; // Reduced number of lines
    const newParticles = Array.from({ length: numParticles }).map((_, i) => {
      const animationDuration = Math.random() * 4 + 6; // Slightly Slower: Animation duration 6s to 10s
      const animationDelay = Math.random() * 12; // Delay up to 12s
      
      const lineWidthPx = Math.random() * 1 + 0.5; 
      const lineHeightVh = Math.random() * 50 + 30; 
      const style: React.CSSProperties = {
        width: `${lineWidthPx}px`,
        height: `${lineHeightVh}vh`,
        left: `${Math.random() * 100}vw`, 
        top: `-${lineHeightVh}vh`, 
        animationName: 'line-scan-vertical',
        animationDuration: `${animationDuration}s`,
        animationDelay: `${animationDelay}s`,
      };
      
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


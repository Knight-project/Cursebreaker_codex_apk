
// src/components/layout/LoadingScreen.tsx
'use client';

import React from 'react';
import { Loader2 } from 'lucide-react'; // Using a Lucide icon for simplicity, can be replaced with custom SVG

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-sm pt-16 pb-16"> {/* pt/pb to account for header/nav */}
      <div className="loading-animation-container">
        <div className="loading-ring"></div>
        <div className="loading-ring"></div>
        <div className="loading-ring"></div>
        <svg className="loading-logo" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
          {/* Simplified Codex-like symbol */}
          <circle cx="50" cy="50" r="30" stroke="hsl(var(--primary))" strokeWidth="3" fill="none" />
          <path d="M50 20 V80 M20 50 H80" stroke="hsl(var(--primary))" strokeWidth="2" strokeLinecap="round"/>
          <circle cx="50" cy="50" r="10" fill="hsl(var(--accent))" className="pulse-accent"/>
        </svg>
      </div>
      <p className="mt-8 text-lg font-headline text-primary animate-pulse tracking-wider">
        INITIALIZING CODEX INTERFACE...
      </p>
    </div>
  );
};

export default LoadingScreen;

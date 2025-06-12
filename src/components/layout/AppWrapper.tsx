// src/components/layout/AppWrapper.tsx
'use client';

import React, { ReactNode } from 'react';
import Header from './Header';
import BottomNavigationBar from './BottomNavigationBar';
import ParticleBackground from './ParticleBackground';
import { useApp } from '@/contexts/AppContext';

interface AppWrapperProps {
  children: ReactNode;
}

const AppWrapper = ({ children }: AppWrapperProps) => {
  const { showLevelUp, appSettings } = useApp();

  return (
    <div className="flex flex-col min-h-screen bg-background">
      {appSettings.enableAnimations && <ParticleBackground />}
      {showLevelUp && appSettings.enableAnimations && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 screen-flash">
          <h1 className="text-4xl font-bold text-primary-foreground animate-pulse font-headline">LEVEL UP!</h1>
        </div>
      )}
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8 pt-20 pb-24 relative z-10"> {/* pt-20 for header, pb-24 for nav */}
        {children}
      </main>
      <BottomNavigationBar />
    </div>
  );
};

export default AppWrapper;

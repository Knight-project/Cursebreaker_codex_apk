// src/components/layout/Header.tsx
'use client';
import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation'; // Corrected import

const Header = () => {
  const { activeTab } = useApp();
  const router = useRouter();

  const pageTitles: { [key: string]: string } = {
    home: "Home Dashboard",
    timers: "Timers & Graphs", // Changed from "Focus Timers"
    rival: "Your Rival",
    journal: "Daily Journal",
    stats: "Character Stats",
    settings: "Settings",
    graphs: "Data Logs & Trends" // Added for when on the graphs page
  };
  
  const title = pageTitles[activeTab] || APP_NAME;

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link
          href="/"
          className="text-xl font-bold font-headline brand-gradient hover:opacity-80 transition-opacity"
        >
          {APP_NAME}
        </Link>
        <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2 hidden md:block">
          {title}
        </h1>
        <Button variant="ghost" size="icon" onClick={handleSettingsClick} aria-label="Settings">
          <Settings className="h-7 w-7 text-accent neon-icon" />
        </Button>
      </div>
    </header>
  );
};

export default Header;

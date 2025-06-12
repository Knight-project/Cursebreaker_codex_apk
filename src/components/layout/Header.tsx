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
    timers: "Focus Timers",
    rival: "Your Rival",
    journal: "Daily Journal",
    stats: "Character Stats",
    settings: "Settings"
  };
  
  const title = pageTitles[activeTab] || APP_NAME;

  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md shadow-md">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" passHref legacyBehavior>
          <a className="text-xl font-bold font-headline text-primary hover:text-primary/80 transition-colors">
            {APP_NAME}
          </a>
        </Link>
        <h1 className="text-lg font-semibold text-foreground absolute left-1/2 -translate-x-1/2 hidden md:block">
          {title}
        </h1>
        <Button variant="ghost" size="icon" onClick={handleSettingsClick} aria-label="Settings">
          <Settings className="h-6 w-6 text-accent neon-icon" />
        </Button>
      </div>
    </header>
  );
};

export default Header;

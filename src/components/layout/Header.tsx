
// src/components/layout/Header.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

const languageCycles = [
  { lang: 'en', text: APP_NAME },
  { lang: 'jp', text: "呪破秘典" }, // Cursebreaker Codex in Japanese
  { lang: 'ko', text: "파멸의서" },   // Cursebreaker Codex in Korean
  { lang: 'ru', text: "КодексРазлома" },// Cursebreaker Codex in Russian
  { lang: 'zh', text: "破咒密碼" }, // Cursebreaker Codex in Chinese
];


const Header = () => {
  const { activeTab } = useApp();
  const router = useRouter();
  const [currentLangIndex, setCurrentLangIndex] = useState(0);
  const [displayedAppName, setDisplayedAppName] = useState(languageCycles[0].text);

  useEffect(() => {
    setDisplayedAppName(languageCycles[currentLangIndex].text);

    const intervalId = setInterval(() => {
      setCurrentLangIndex(prevIndex => {
        const nextIndex = (prevIndex + 1) % languageCycles.length;
        if (nextIndex === 0) { 
            return 0;
        } else if (prevIndex === 0) { 
            return Math.floor(Math.random() * (languageCycles.length - 1)) + 1;
        }
        return 0; 
      });
    }, 300000); // 5 minutes 

    return () => clearInterval(intervalId);
  }, [currentLangIndex]);


  const pageTitles: { [key: string]: string } = {
    home: "Home Dashboard",
    timers: "Timers & Graphs",
    rival: "Your Rival",
    journal: "Daily Journal",
    stats: "Character Stats",
    settings: "Settings",
    graphs: "Data Logs & Trends"
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
          className="text-xl font-brand text-accent hover:opacity-80 transition-opacity uppercase"
        >
          {displayedAppName}
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


// src/components/layout/Header.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants';
import Link from 'next/link';
import { useApp } from '@/contexts/AppContext';
import { useRouter } from 'next/navigation'; // Corrected import
import { cn } from '@/lib/utils';

const languageCycles = [
  { lang: 'en', text: APP_NAME },
  { lang: 'jp', text: "呪破秘典" }, // Placeholder for Cursebreaker Codex in Japanese
  { lang: 'ko', text: "파멸의서" },   // Placeholder for Cursebreaker Codex in Korean
  { lang: 'ru', text: "КодексРазлома" },// Placeholder for Cursebreaker Codex in Russian
  { lang: 'zh', text: "破咒密碼" }, // Placeholder for Cursebreaker Codex in Chinese
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
        // Alternate between English (index 0) and one other random language
        if (nextIndex === 0) { // Back to English
            return 0;
        } else if (prevIndex === 0) { // Was English, pick a random foreign one
            // Pick a random index from 1 to length-1
            return Math.floor(Math.random() * (languageCycles.length - 1)) + 1;
        }
        // If it was a foreign language, switch back to English
        return 0; 
      });
    }, 15000); // 15 seconds for foreign, 15 for english = 30 second cycle for one pair

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
          className={cn(
            "text-xl font-brand brand-gradient hover:opacity-80 transition-opacity",
             // Apply Noto Sans for CJK/RU if detected, otherwise Uncial Antiqua
            (languageCycles[currentLangIndex].lang !== 'en') && "font-sans" // Fallback for non-Latin
          )}
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

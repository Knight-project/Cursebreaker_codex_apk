// src/components/layout/BottomNavigationBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Timer, Users, SettingsIcon, BookOpen } from 'lucide-react'; // Users for Rival, BookOpen for Journal
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const navItems = [
  { href: '/timers', label: 'Timers', icon: Timer, key: 'timers' },
  { href: '/', label: 'Home', icon: Home, key: 'home' },
  { href: '/rival', label: 'Rival', icon: Users, key: 'rival' },
  // { href: '/journal', label: 'Journal', icon: BookOpen, key: 'journal' },
  // { href: '/settings', label: 'Settings', icon: SettingsIcon, key: 'settings'},
];

const BottomNavigationBar = () => {
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useApp();

  const isActive = (itemKey: string) => itemKey === activeTab || (itemKey === 'home' && pathname === '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-top z-50">
      <div className="container mx-auto px-4 h-16 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.key);
          return (
            <Link href={item.href} key={item.label} passHref legacyBehavior>
              <a 
                onClick={() => setActiveTab(item.key)}
                className={cn(
                "flex flex-col items-center justify-center text-xs w-1/3 h-full transition-colors duration-200",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                <Icon className={cn("h-6 w-6 mb-0.5", active ? "text-primary neon-icon-primary" : "text-muted-foreground group-hover:text-foreground neon-icon" )} />
                <span className={cn("font-medium", active && "font-bold")}>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;

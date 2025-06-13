
// src/components/layout/BottomNavigationBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Timer, Users } from 'lucide-react'; // Users instead of User, assuming for 'Rival' (plural or group context)
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

const navItems = [
  { href: '/timers', label: 'Timers', icon: Timer, key: 'timers' },
  { href: '/', label: 'Home', icon: Home, key: 'home' },
  { href: '/rival', label: 'Rival', icon: Users, key: 'rival' },
];

const OrbitingIconAnimator = ({ children }: { children: React.ReactNode }) => {
  const orbitSize = 'calc(1.5rem + 14px)'; // Icon (24px) + 14px padding = 38px diameter
  const commonArcStyles: React.CSSProperties = {
    width: orbitSize,
    height: orbitSize,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  return (
    <div className="relative grid place-items-center w-6 h-6"> {/* Parent is relative, sized like icon */}
      {children} {/* The Icon itself */}
      <span className="orbit-arc nav-orbit-arc-primary-1" style={commonArcStyles}></span>
      <span className="orbit-arc nav-orbit-arc-primary-2" style={commonArcStyles}></span>
      <span className="orbit-arc nav-orbit-arc-primary-3" style={commonArcStyles}></span>
    </div>
  );
};


const BottomNavigationBar = () => {
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useApp();

  const isActive = (itemKey: string) => itemKey === activeTab || (itemKey === 'home' && pathname === '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border z-50">
      <div className="container mx-auto px-0 h-16 flex justify-around items-stretch"> {/* Changed items-center to items-stretch */}
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const active = isActive(item.key);
          return (
            <Link
              href={item.href}
              key={item.label}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "flex flex-col items-center justify-center text-xs w-1/3 h-full transition-all duration-200 group relative",
                "border-2", // Base: all tabs have a 2px border width defined
                active
                  ? "text-primary border-accent" // Active: all sides get accent color
                  : [
                      "text-muted-foreground hover:text-foreground border-transparent", // Non-active: all sides get transparent color initially
                      (index < navItems.length - 1) ? "border-r-border/30" : "" // If non-active and needs divider, set 2px right border color
                    ]
              )}
            >
              <div className={cn(
                "flex flex-col items-center justify-center transition-transform duration-200 h-full", 
                active ? "scale-110" : "scale-90 group-hover:scale-100"
              )}>
                <div className={cn("mb-0.5 flex items-center justify-center h-8")}>
                  {active ? (
                    <OrbitingIconAnimator>
                      <Icon className={cn("h-6 w-6 text-primary neon-icon-primary")} />
                    </OrbitingIconAnimator>
                  ) : (
                    <Icon className={cn("h-6 w-6 text-muted-foreground group-hover:text-foreground")} />
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;


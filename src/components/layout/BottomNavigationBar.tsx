// src/components/layout/BottomNavigationBar.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import { Home, Timer, Users } from 'lucide-react';
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
    // borderRadius, borderStyle, borderWidth, borderColor are in .orbit-arc class
    // Specific animation and border colors are in .orbit-arc-X classes
  };

  return (
    <div className="relative grid place-items-center w-6 h-6"> {/* Parent is relative, sized like icon */}
      {children} {/* The Icon itself */}
      <span className="orbit-arc orbit-arc-1" style={commonArcStyles}></span>
      <span className="orbit-arc orbit-arc-2" style={commonArcStyles}></span>
      <span className="orbit-arc orbit-arc-3" style={commonArcStyles}></span>
    </div>
  );
};


const BottomNavigationBar = () => {
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useApp();

  const isActive = (itemKey: string) => itemKey === activeTab || (itemKey === 'home' && pathname === '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border shadow-top z-50">
      <div className="container mx-auto px-4 h-16 flex justify-around items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.key);
          return (
            <Link href={item.href} key={item.label} passHref legacyBehavior>
              <a
                onClick={() => setActiveTab(item.key)}
                className={cn(
                "flex flex-col items-center justify-center text-xs w-1/3 h-full transition-all duration-200",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}>
                <div className={cn("mb-0.5 transition-transform duration-200", active ? "scale-110" : "scale-90")}>
                  {active ? (
                    <OrbitingIconAnimator>
                      <Icon className={cn("h-6 w-6 text-primary neon-icon-primary")} />
                    </OrbitingIconAnimator>
                  ) : (
                    <Icon className={cn("h-6 w-6 text-muted-foreground group-hover:text-foreground")} />
                  )}
                </div>
                <span className={cn("font-medium transition-opacity duration-200", active ? "font-bold opacity-100" : "opacity-80")}>{item.label}</span>
              </a>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigationBar;

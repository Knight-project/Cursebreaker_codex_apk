
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

const OrbitingIconAnimator = ({ children, activeTabKey }: { children: React.ReactNode; activeTabKey: string }) => {
  const orbitSize = 'calc(1.5rem + 14px)'; // Icon (24px) + 14px padding = 38px diameter
  const commonArcStyles: React.CSSProperties = {
    width: orbitSize,
    height: orbitSize,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
  };

  const isRivalActive = activeTabKey === 'rival';
  const arcBaseClass = "orbit-arc";
  const arcColorClass1 = isRivalActive ? "nav-orbit-arc-destructive-1" : "nav-orbit-arc-primary-1";
  const arcColorClass2 = isRivalActive ? "nav-orbit-arc-destructive-2" : "nav-orbit-arc-primary-2";
  const arcColorClass3 = isRivalActive ? "nav-orbit-arc-destructive-3" : "nav-orbit-arc-primary-3";

  return (
    <div className="relative grid place-items-center w-6 h-6"> {/* Parent is relative, sized like icon */}
      {children} {/* The Icon itself */}
      <span className={cn(arcBaseClass, arcColorClass1)} style={commonArcStyles}></span>
      <span className={cn(arcBaseClass, arcColorClass2)} style={commonArcStyles}></span>
      <span className={cn(arcBaseClass, arcColorClass3)} style={commonArcStyles}></span>
    </div>
  );
};


const BottomNavigationBar = () => {
  const pathname = usePathname();
  const { activeTab, setActiveTab } = useApp();

  const isActive = (itemKey: string) => itemKey === activeTab || (itemKey === 'home' && pathname === '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-card/90 backdrop-blur-md border-t border-border z-50">
      <div className="container mx-auto px-0 h-16 flex justify-around items-stretch">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.key);
          const isRivalTab = item.key === 'rival';
          return (
            <Link
              href={item.href}
              key={item.label}
              onClick={() => setActiveTab(item.key)}
              className={cn(
                "flex flex-col items-center justify-center text-xs w-1/3 h-full transition-all duration-200 group relative",
                active
                  ? cn(
                      "border-b-2 border-b-accent active-nav-shadow",
                      "border-l-transparent border-r-transparent border-t-transparent" 
                    )
                  : "text-muted-foreground hover:text-foreground border-transparent"
              )}
            >
              <div className={cn(
                "flex flex-col items-center justify-center transition-transform duration-200 h-full",
                active ? "scale-110" : "scale-90 group-hover:scale-100"
              )}>
                <div className={cn("mb-0.5 flex items-center justify-center h-8")}>
                  {active ? (
                    <OrbitingIconAnimator activeTabKey={item.key}>
                      <Icon className={cn(
                        "h-6 w-6",
                        isRivalTab && active ? "text-destructive neon-icon-destructive" : "text-primary neon-icon-primary"
                       )} />
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

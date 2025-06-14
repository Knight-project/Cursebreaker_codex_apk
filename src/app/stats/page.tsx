
// src/app/stats/page.tsx
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import { Card, CardContent } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect } from 'react';
import type { UserStat, Attribute } from '@/lib/types';
import { ATTRIBUTES_LIST } from '@/lib/types';
import { BarChart, Brain, Zap, Shield, Palette, Smile, TrendingUp } from 'lucide-react';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

const attributeIcons: { [key in typeof ATTRIBUTES_LIST[number]]?: React.ElementType } = {
  Strength: BarChart,
  Intelligence: Brain,
  Endurance: Shield,
  Creativity: Palette,
  Charisma: Smile,
};

const CyberpunkAvatarPlaceholder = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-primary/50">
    <defs>
      <linearGradient id="cyberGradStatsId" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity:0.1}} />
        <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity:0.1}} />
      </linearGradient>
    </defs>
    <rect width="100" height="100" fill="hsl(var(--background))" />
    <circle cx="50" cy="45" r="25" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="url(#cyberGradStatsId)" />
    <path d="M30 80 Q50 100 70 80 Q50 90 30 80" stroke="hsl(var(--primary))" strokeWidth="1" fill="hsl(var(--primary))" fillOpacity="0.05" />
    <rect x="47" y="10" width="6" height="8" fill="hsl(var(--border))" opacity="0.3"/>
    <line x1="35" y1="47" x2="65" y2="47" stroke="hsl(var(--accent))" strokeWidth="0.5"/>
  </svg>
);

const toRoman = (num: number): string => {
  const romanMap: { [key: number]: string } = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
    6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
  };
  return romanMap[num] || num.toString();
};

const AttributeBar = ({ value, maxValue, colorClass = 'bg-primary' }: { value: number; maxValue: number; colorClass?: string }) => {
  const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
  return (
    <div className="h-1.5 w-full bg-muted/30 rounded-sm overflow-hidden border border-border/50">
      <div
        className={cn("h-full rounded-sm transition-all duration-300", colorClass)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};


export default function StatsPage() {
  const { userProfile, setActiveTab, appSettings } = useApp();

  useEffect(() => {
    setActiveTab('stats');
  }, [setActiveTab]);

  const {
    userName,
    avatarUrl,
    rankName,
    subRank,
    totalExp,
    currentStreak,
    dailyTaskCompletionPercentage,
    stats,
    customQuote,
  } = userProfile;

  const attributeDisplayOrder: Attribute[] = ["Strength", "Intelligence", "Endurance", "Creativity", "Charisma"];

  return (
    <AppWrapper>
      <Card className="max-w-2xl mx-auto bg-card/90 backdrop-blur-md shadow-2xl border-2 border-primary/60 font-code text-sm">
        {/* Header Bar */}
        <div className="px-3 py-1.5 border-b-2 border-primary/60 flex justify-between items-center">
          <h1 className="text-base font-headline text-primary uppercase tracking-wider">{appSettings.enableAnimations ? "CURSEBREAKER_CODEX" : "CBR_CDX"}</h1>
          <div className="text-xs text-primary/70 flex items-center">
            <span className="mr-2">SYSTEM STATUS:</span> <span className="text-green-400">ONLINE</span>
            <span className="ml-3 mr-1">SIGNAL:</span>
            <div className="flex space-x-0.5">
              {[...Array(4)].map((_, i) => <div key={i} className="w-1 h-2.5 bg-green-400" />)}
            </div>
          </div>
        </div>

        <CardContent className="p-2 sm:p-3 md:p-4 space-y-3">
          {/* Main Info Block */}
          <div className="flex flex-col md:flex-row gap-3 md:gap-4">
            <div className="w-full md:w-1/3 flex-shrink-0">
              <div className="aspect-square w-full border-2 border-primary/50 p-0.5 bg-background/50">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="User Avatar"
                    layout="responsive"
                    width={200}
                    height={200}
                    className="object-cover w-full h-full"
                    data-ai-hint="user portrait"
                  />
                ) : (
                  <CyberpunkAvatarPlaceholder />
                )}
              </div>
            </div>

            <div className="flex-grow space-y-1.5 text-primary/90">
              <div>
                <span className="text-xs text-muted-foreground block">RANK DESIGNATION:</span>
                <span className="block text-base text-primary">{rankName}</span>
              </div>
              <div>
                <span className="text-xs text-muted-foreground block">OPERATIVE ID:</span>
                <span className="block text-xl text-accent font-headline uppercase tracking-wide">{userName.toUpperCase() || "N/A"}</span>
              </div>
              <Separator className="my-1.5 bg-border/30"/>
              <div className="flex justify-between">
                <div>
                  <span className="text-xs text-muted-foreground block">CLEARANCE LVL:</span>
                  <span className="block">{toRoman(subRank)}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block text-right">EXP TOTAL:</span>
                  <span className="block text-right">{totalExp.toLocaleString()}</span>
                </div>
              </div>
               <Separator className="my-1.5 bg-border/30"/>
              <div>
                <span className="text-xs text-muted-foreground block">CURRENT DIRECTIVE:</span>
                <p className="text-xs text-foreground/80 italic leading-tight min-h-[2.5em] line-clamp-2">
                  {customQuote || "No directive assigned."}
                </p>
              </div>
               <Separator className="my-1.5 bg-border/30"/>
               <div className="grid grid-cols-2 gap-x-2 text-xs">
                <div>
                  <span className="text-muted-foreground">CONSECUTIVE OPS:</span> <span className="text-primary">{currentStreak}</span>
                </div>
                <div className="text-right">
                  <span className="text-muted-foreground">EFFICIENCY:</span> <span className="text-primary">{dailyTaskCompletionPercentage.toFixed(1)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attributes Section */}
          <Separator className="my-3 bg-primary/60 h-0.5"/>
          <div>
            <h3 className="text-xs text-center text-muted-foreground uppercase mb-2 tracking-widest">FIELD ASSESSMENT // CORE ATTRIBUTES</h3>
            <div className="space-y-2.5">
              {attributeDisplayOrder.map(attrKey => {
                const stat = stats[attrKey.toLowerCase() as keyof typeof stats];
                if (!stat) return null;
                const Icon = attributeIcons[attrKey as typeof ATTRIBUTES_LIST[number]] || Zap;

                return (
                  <div key={attrKey} className="text-xs">
                    <div className="flex justify-between items-center mb-0.5">
                      <div className="flex items-center text-primary">
                        <Icon className="mr-1.5 h-3 w-3" />
                        <span className="font-medium uppercase tracking-wide">{attrKey}</span>
                      </div>
                      <span className="text-primary/80">LVL {stat.level}</span>
                    </div>
                    <AttributeBar value={stat.exp} maxValue={stat.expToNextLevel} colorClass="bg-accent" />
                    <p className="text-right text-muted-foreground mt-0.5">
                      EXP: {stat.exp.toLocaleString()}/{stat.expToNextLevel.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>

        {/* Footer Bar */}
        <div className="px-3 py-1.5 border-t-2 border-primary/60">
          <p className="text-xs text-center text-primary/70 uppercase">
            {appSettings.enableAnimations ? "Cursebreaker Codex" : "CBR_CDX"} :: User Profile Interface :: v2.1
          </p>
        </div>
      </Card>
    </AppWrapper>
  );
}


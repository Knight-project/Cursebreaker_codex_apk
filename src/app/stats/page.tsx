
// src/app/stats/page.tsx
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect } from 'react';
import type { UserStat, Attribute } from '@/lib/types';
import { ATTRIBUTES_LIST } from '@/lib/types';
import { BarChart, Brain, Zap, Shield, Palette, Smile } from 'lucide-react';
import RankDisplay from '@/components/shared/RankDisplay';
import Image from 'next/image';
import { Separator } from '@/components/ui/separator';

const attributeIcons: { [key in typeof ATTRIBUTES_LIST[number]]?: React.ElementType } = {
  Strength: BarChart,
  Intelligence: Brain,
  Endurance: Shield,
  Creativity: Palette,
  Charisma: Smile,
};

// Placeholder for avatar, similar to home page
const CyberpunkAvatarPlaceholder = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground group-hover:text-primary transition-colors">
    <defs>
      <linearGradient id="cyberGradUserStats" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity:0.3}} />
        <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity:0.3}} />
      </linearGradient>
    </defs>
    <circle cx="50" cy="40" r="20" stroke="hsl(var(--primary))" strokeWidth="2" fill="url(#cyberGradUserStats)" />
    <path d="M30 70 Q50 90 70 70 Q50 80 30 70" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary))" fillOpacity="0.1" />
    <rect x="46" y="5" width="8" height="10" fill="hsl(var(--border))" opacity="0.5"/>
    <line x1="40" y1="42" x2="60" y2="42" stroke="hsl(var(--accent))" strokeWidth="1"/>
  </svg>
);


export default function StatsPage() {
  const { userProfile, setActiveTab } = useApp();

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
    taskHistory,
  } = userProfile;

  const profileDetailsList = [
    { label: 'Rank', value: <RankDisplay rankName={rankName} subRank={subRank} className="text-sm" /> },
    { label: 'Total EXP', value: totalExp.toLocaleString() },
    { label: 'Current Streak', value: `${currentStreak} days` },
    { label: 'Daily Completion', value: `${dailyTaskCompletionPercentage.toFixed(1)}%` },
  ];

  // Order in which attributes should be displayed
  const attributeDisplayOrder: Attribute[] = ["Strength", "Intelligence", "Endurance", "Creativity", "Charisma"];

  return (
    <AppWrapper>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
        {/* Left Column - Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-primary/30">
            <CardContent className="p-6 flex flex-col items-center">
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-full overflow-hidden border-2 border-primary mb-4 shadow-lg relative">
                {avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt="User Avatar"
                    layout="fill"
                    objectFit="cover"
                    className="rounded-full"
                    data-ai-hint="user portrait"
                  />
                ) : (
                  <div className="w-full h-full bg-card flex items-center justify-center overflow-hidden rounded-full">
                    <CyberpunkAvatarPlaceholder />
                  </div>
                )}
              </div>
              <h2 className="text-2xl font-headline text-accent mb-4 text-center uppercase">
                {userName.toUpperCase() || "OPERATIVE"}
              </h2>
              
              <div className="w-full space-y-2.5 text-sm">
                {profileDetailsList.map((detail, index) => (
                  <React.Fragment key={detail.label}>
                    <div className="flex justify-between items-baseline">
                      <span className="font-headline text-muted-foreground uppercase text-xs tracking-wider">{detail.label}:</span>
                      <span className="font-code text-foreground text-right">{detail.value}</span>
                    </div>
                    {index < profileDetailsList.length - 1 && <Separator className="my-1.5 bg-border/40" />}
                  </React.Fragment>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Attributes and Logs */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary uppercase tracking-wider">Core Attributes</CardTitle>
              <CardDescription>Proficiency levels across key disciplines.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5 pt-2">
              {attributeDisplayOrder.map(attrKey => {
                const stat = stats[attrKey.toLowerCase() as keyof typeof stats];
                if (!stat) return null; // Should not happen with current setup
                
                const progress = stat.expToNextLevel > 0 ? (stat.exp / stat.expToNextLevel) * 100 : 100;
                const Icon = attributeIcons[attrKey as typeof ATTRIBUTES_LIST[number]] || Zap;

                return (
                  <div key={attrKey} className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center">
                        <Icon className="mr-2 h-4 w-4 text-primary flex-shrink-0" />
                        <h3 className="text-sm font-headline text-foreground uppercase tracking-wide truncate" title={attrKey}>{attrKey}</h3>
                      </div>
                      <span className="text-sm font-code text-primary font-semibold">Lvl {stat.level}</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-secondary" indicatorClassName="bg-primary" />
                    <p className="text-xs text-muted-foreground font-code text-right">
                      EXP: {stat.exp.toLocaleString()} / {stat.expToNextLevel.toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary uppercase tracking-wider">Mission Log</CardTitle>
              <CardDescription>Summary of recent operational history.</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground font-code text-sm">
                Total directives logged: <span className="text-primary font-semibold">{taskHistory.length}</span>
              </p>
              <p className="mt-2 text-xs text-muted-foreground font-code">
                (Detailed task history and notable achievements will be displayed here in future iterations.)
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppWrapper>
  );
}


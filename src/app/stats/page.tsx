// src/app/stats/page.tsx
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect } from 'react';
import type { UserStat } from '@/lib/types';
import { ATTRIBUTES_LIST } from '@/lib/types'; // Ensure this is correctly imported
import { BarChart, Brain, Zap, Shield, Palette, Smile } from 'lucide-react'; // Icons for stats

const attributeIcons: { [key in typeof ATTRIBUTES_LIST[number]]?: React.ElementType } = {
  Strength: BarChart,
  Intelligence: Brain,
  Endurance: Shield,
  Creativity: Palette,
  Charisma: Smile,
};


const StatDisplay = ({ name, stat }: { name: string; stat: UserStat }) => {
  const Icon = attributeIcons[name as typeof ATTRIBUTES_LIST[number]] || Zap; // Default icon
  const progress = stat.expToNextLevel > 0 ? (stat.exp / stat.expToNextLevel) * 100 : 100;

  return (
    <Card className="bg-card/90 border-border hover:border-primary/50 transition-all">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-medium font-headline flex items-center">
          <Icon className="mr-2 h-5 w-5 text-primary neon-icon-primary" />
          {name}
        </CardTitle>
        <span className="text-sm font-bold text-primary">Lvl {stat.level}</span>
      </CardHeader>
      <CardContent>
        <div className="text-xs text-muted-foreground mb-1">
          EXP: {stat.exp} / {stat.expToNextLevel}
        </div>
        <Progress value={progress} className="h-2 bg-secondary" indicatorClassName="bg-primary" />
      </CardContent>
    </Card>
  );
};

export default function StatsPage() {
  const { userProfile, setActiveTab } = useApp();

  useEffect(() => {
    setActiveTab('stats');
  }, [setActiveTab]);

  const { stats, rankName, subRank, totalExp, currentStreak, dailyTaskCompletionPercentage } = userProfile;

  return (
    <AppWrapper>
      <div className="space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-primary/30">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Character Overview</CardTitle>
            <CardDescription className="text-muted-foreground">Your current standing in the realms.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <p><strong>Rank:</strong> {rankName} (Sub-Rank {subRank})</p>
            <p><strong>Total EXP:</strong> {totalExp}</p>
            <p><strong>Current Streak:</strong> {currentStreak} days</p>
            <p><strong>Today's Completion:</strong> {dailyTaskCompletionPercentage.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-accent">Attributes</CardTitle>
            <CardDescription className="text-muted-foreground">Your prowess in various disciplines.</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {(Object.keys(stats) as Array<keyof typeof stats>).map((key) => {
              if (ATTRIBUTES_LIST.includes(key.charAt(0).toUpperCase() + key.slice(1) as typeof ATTRIBUTES_LIST[number])) {
                return (
                  <StatDisplay 
                    key={key} 
                    name={key.charAt(0).toUpperCase() + key.slice(1)} 
                    stat={stats[key]} 
                  />
                );
              }
              return null;
            })}
          </CardContent>
        </Card>

         {/* Placeholder for Task History */}
        <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">Task History & Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Detailed task history and notable achievements will be displayed here in the future.</p>
            {/* Example: userProfile.taskHistory.length could be displayed */}
            <p className="mt-2">Total tasks logged: {userProfile.taskHistory.length}</p>
          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
}

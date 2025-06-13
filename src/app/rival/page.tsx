
// src/app/rival/page.tsx
'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect, useState, useRef, type ChangeEvent, useMemo } from 'react';
import Image from 'next/image';
import { Swords, PlusCircle, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';

const CyberpunkRivalPlaceholder = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground group-hover:text-destructive transition-colors">
    <defs>
      <linearGradient id="cyberRivalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: 'hsl(var(--destructive))', stopOpacity:0.4}} />
        <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity:0.2}} />
      </linearGradient>
       <clipPath id="rivalHeadClip">
        <circle cx="50" cy="40" r="22"/>
      </clipPath>
    </defs>
    {/* Base head shape */}
    <circle cx="50" cy="40" r="22" stroke="hsl(var(--destructive))" strokeWidth="2.5" fill="url(#cyberRivalGrad)" />
    
    {/* Aggressive "Horns" or "Crest" */}
    <path d="M40 18 Q50 10 60 18 L55 25 Q50 20 45 25 Z" fill="hsl(var(--destructive) / 0.7)" stroke="hsl(var(--destructive))" strokeWidth="1.5" />

    {/* Sharper "Eyes" - more angular */}
    <path d="M35 42 L48 38 L45 46 Z" fill="hsl(var(--accent) / 0.8)" stroke="hsl(var(--accent))" strokeWidth="1"/>
    <path d="M65 42 L52 38 L55 46 Z" fill="hsl(var(--accent) / 0.8)" stroke="hsl(var(--accent))" strokeWidth="1"/>

    {/* More angular "Chin guard" or "Jawline" */}
    <path d="M30 70 L50 85 L70 70 L65 75 L50 90 L35 75 Z" stroke="hsl(var(--destructive))" strokeWidth="2" fill="hsl(var(--destructive) / 0.3)" />
    
    {/* Extra "Tech" detail, slightly menacing */}
     <rect x="25" y="50" width="8" height="4" fill="hsl(var(--border))" opacity="0.6" transform="rotate(-15 25 50)"/>
     <rect x="67" y="50" width="8" height="4" fill="hsl(var(--border))" opacity="0.6" transform="rotate(15 67 50)"/>
      <line x1="50" y1="58" x2="50" y2="68" stroke="hsl(var(--border))" strokeWidth="1.5" opacity="0.7"/>
  </svg>
);

const chartConfigRival = {
  rivalExp: {
    label: "Rival Cumulative EXP",
    color: "hsl(var(--destructive))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function RivalPage() {
  const { rival, updateRivalTaunt, setActiveTab, setRival } = useApp();
  const [isLoadingTaunt, setIsLoadingTaunt] = useState(false);
  const rivalImageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    setActiveTab('rival');
    if (!rival.lastTaunt) {
      handleGetTaunt();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveTab]);

  const handleGetTaunt = async () => {
    setIsLoadingTaunt(true);
    await updateRivalTaunt();
    setIsLoadingTaunt(false);
  };

  const handleRivalAvatarClick = () => {
    rivalImageInputRef.current?.click();
  };

  const handleRivalAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive",
        });
        if(event.target) event.target.value = "";
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setRival(prev => ({ ...prev, avatarUrl: reader.result as string }));
        toast({ title: "Rival Avatar Updated!" });
      };
      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Could not process the selected image.",
          variant: "destructive",
        });
      };
      reader.readAsDataURL(file);
    }
     if (event.target) {
      event.target.value = "";
    }
  };

  const rivalExpGrowthData = useMemo(() => {
    const history = rival.expHistory || []; 
    
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    const cumulativeStatsByDay: { [date: string]: number } = {};
    
    let initialExpBeforeWindow = 0;
    const firstDayOfWindow = format(last14Days[0], 'yyyy-MM-dd');
    const sortedHistory = [...history].sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const lastHistoricalEntryBeforeWindow = sortedHistory
        .filter(h => h.date < firstDayOfWindow)
        .pop();

    if (lastHistoricalEntryBeforeWindow) {
        initialExpBeforeWindow = lastHistoricalEntryBeforeWindow.totalExp;
    } else {
        const firstHistoricalEntry = sortedHistory[0];
        if (firstHistoricalEntry) {
             initialExpBeforeWindow = (firstHistoricalEntry.totalExp || 0) - (firstHistoricalEntry.expGained || 0);
             if (initialExpBeforeWindow < 0) initialExpBeforeWindow = 0;
        }
    }
    
    let runningTotal = initialExpBeforeWindow;

    last14Days.forEach(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      const entriesForThisDay = history.filter(h => h.date === dayString);
      if (entriesForThisDay.length > 0) {
          runningTotal = entriesForThisDay[entriesForThisDay.length - 1].totalExp;
      }
      cumulativeStatsByDay[dayString] = runningTotal;
    });
    
    return last14Days.map(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      return {
        date: format(day, 'MMM d'),
        rivalExp: cumulativeStatsByDay[dayString] || 0, 
      };
    });

  }, [rival.expHistory]);

  return (
    <AppWrapper>
      <div className="space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-destructive/30">
          <CardHeader className="items-center text-center flex flex-col p-4">
            <div className="avatar-arc-container mb-3 w-[150px] h-[150px]">
              <div onClick={handleRivalAvatarClick} className="cursor-pointer relative group w-[120px] h-[120px] border-2 border-destructive p-0.5 rounded-full overflow-hidden">
                {rival.avatarUrl && rival.avatarUrl !== 'https://placehold.co/120x120.png' ? (
                  <Image
                    src={rival.avatarUrl}
                    alt={`${rival.name}'s Avatar`}
                    width={120}
                    height={120}
                    className="object-cover w-full h-full rounded-full"
                    data-ai-hint="fantasy character"
                  />
                ) : (
                  <div className="w-full h-full bg-card flex items-center justify-center overflow-hidden rounded-full">
                     <CyberpunkRivalPlaceholder />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <PlusCircle className="h-10 w-10 text-destructive neon-icon" />
                </div>
              </div>
              <span className="avatar-orbiting-arc avatar-orbiting-arc-type1" style={{ width: '128px', height: '128px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(15deg)', borderRightColor: 'transparent', borderBottomColor: 'transparent' }}></span>
              <span className="avatar-orbiting-arc avatar-orbiting-arc-type2" style={{ width: '138px', height: '138px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-40deg)', borderLeftColor: 'transparent', borderTopColor: 'transparent' }}></span>
              <span className="avatar-orbiting-arc avatar-orbiting-arc-type3" style={{ width: '148px', height: '148px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(60deg)', borderTopColor: 'transparent',  borderRightColor: 'transparent' }}></span>
            </div>
            <input type="file" ref={rivalImageInputRef} onChange={handleRivalAvatarChange} accept="image/*" className="hidden" />

            <CardTitle className="font-headline text-2xl text-destructive uppercase tracking-wider">{rival.name}</CardTitle>
            <CardDescription className="text-muted-foreground text-xs font-code">{rival.rankName} - {rival.subRank}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center pt-2 pb-4 px-4">
            <div className="px-0 sm:px-4"> {/* Adjusted padding for progress bar container */}
              <div className="flex justify-between text-xs mb-1 font-code">
                <span className="text-foreground uppercase">Rival EXP</span>
                <span className="text-destructive">{rival.currentExpInSubRank} / {rival.expToNextSubRank}</span>
              </div>
              <Progress
                value={(rival.currentExpInSubRank / rival.expToNextSubRank) * 100}
                className="h-2 bg-secondary" /* Removed mx-4, parent div handles padding */
                indicatorClassName="bg-destructive"
              />
            </div>

            <Card className="bg-background/50 border-border mt-4 rounded-md">
              <CardHeader className="p-3">
                <CardTitle className="text-xs font-medium text-center text-muted-foreground uppercase font-headline tracking-wider">Transmission from Rival</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <p className="text-base italic text-center text-foreground min-h-[40px] flex items-center justify-center font-code">
                  {rival.lastTaunt || "Static..."}
                </p>
                <Button onClick={handleGetTaunt} disabled={isLoadingTaunt} className="mt-3 w-full bg-destructive hover:bg-destructive/90 font-headline uppercase text-xs py-2">
                  <Swords className="mr-2 h-3 w-3" />
                  {isLoadingTaunt ? 'Provoking...' : 'Provoke Rival'}
                </Button>
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-destructive flex items-center">
              <TrendingUp className="mr-2 h-5 w-5" /> Rival EXP Growth
            </CardTitle>
            <CardDescription>Cumulative EXP gained by your rival (over the past 14 days).</CardDescription>
          </CardHeader>
          <CardContent>
            {rivalExpGrowthData.length > 1 ? ( // Require at least 2 points to draw a line
              <ChartContainer config={chartConfigRival} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rivalExpGrowthData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                    <YAxis tickLine={false} axisLine={false} tickMargin={8} fontSize={10}/>
                    <ChartTooltip 
                      content={<ChartTooltipContent />} 
                    />
                    <Line type="monotone" dataKey="rivalExp" stroke="var(--color-rivalExp)" strokeWidth={2} dot={{ r: 3, fill: "var(--color-rivalExp)", strokeWidth:1, stroke:"hsl(var(--background))" }} activeDot={{r:5}} name="Rival EXP"/>
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-4">Not enough EXP history for your rival to display growth graph.</p>
            )}
          </CardContent>
        </Card>

      </div>
    </AppWrapper>
  );
}

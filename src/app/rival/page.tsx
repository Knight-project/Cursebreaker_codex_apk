
// src/app/rival/page.tsx
'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect, useState, useRef, type ChangeEvent, useMemo, useCallback } from 'react';
import Image from 'next/image';
import { Swords, PlusCircle, TrendingUp, TimerIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval, differenceInSeconds, isValid as dateIsValid } from 'date-fns';
import RankDisplay from '@/components/shared/RankDisplay';
import { playSound } from '@/lib/soundManager';

const CyberpunkRivalPlaceholder = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground group-hover:text-destructive transition-colors">
    <defs>
      <linearGradient id="cyberGradRival" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: 'hsl(var(--destructive))', stopOpacity:0.3}} />
        <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity:0.3}} />
      </linearGradient>
    </defs>
    <circle cx="50" cy="40" r="20" stroke="hsl(var(--destructive))" strokeWidth="2" fill="url(#cyberGradRival)" />
    <path d="M30 70 Q50 90 70 70 Q50 80 30 70" stroke="hsl(var(--destructive))" strokeWidth="1.5" fill="hsl(var(--destructive))" fillOpacity="0.1" />
    <rect x="46" y="5" width="8" height="10" fill="hsl(var(--border))" opacity="0.5"/>
    <line x1="40" y1="42" x2="60" y2="42" stroke="hsl(var(--accent))" strokeWidth="1"/>
  </svg>
);


const chartConfigRival = {
  rivalExp: {
    label: "Rival Cumulative EXP",
    color: "hsl(var(--destructive))",
  },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function RivalPage() {
  const { rival, updateRivalTaunt, setActiveTab, setRival, userProfile } = useApp();
  const [isLoadingTaunt, setIsLoadingTaunt] = useState(false);
  const rivalImageInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [timeLeftForExpGain, setTimeLeftForExpGain] = useState("Calculating...");

  useEffect(() => {
    setActiveTab('rival');
    if (!rival.lastTaunt) {
      handleGetTaunt();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveTab]);

  const formatTimeLeft = useCallback((totalSeconds: number) => {
    if (totalSeconds < 0) return "Processing EXP Gain...";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (!rival.nextExpGainTime) {
      setTimeLeftForExpGain("Not scheduled");
      return;
    }

    const calculateTime = () => {
      const nextGainDate = new Date(rival.nextExpGainTime!);
      if (!dateIsValid(nextGainDate)) {
         setTimeLeftForExpGain("Invalid date");
         return;
      }
      const secondsRemaining = differenceInSeconds(nextGainDate, new Date());
      setTimeLeftForExpGain(formatTimeLeft(secondsRemaining));
    };

    calculateTime();
    const intervalId = setInterval(calculateTime, 1000);
    return () => clearInterval(intervalId);
  }, [rival.nextExpGainTime, formatTimeLeft]);


  const handleGetTaunt = async () => {
    setIsLoadingTaunt(true);
    await updateRivalTaunt(); 
    setIsLoadingTaunt(false);
  };

  const handleRivalAvatarClick = () => {
    rivalImageInputRef.current?.click();
    playSound('buttonClick');
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
        playSound('buttonClick'); 
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
        const firstEntryInOrAfterWindow = sortedHistory.find(h => h.date >= firstDayOfWindow);
        if (firstEntryInOrAfterWindow) {
            initialExpBeforeWindow = (firstEntryInOrAfterWindow.totalExp || 0) - (firstEntryInOrAfterWindow.expGained || 0);
            if (initialExpBeforeWindow < 0) initialExpBeforeWindow = 0;
        }
    }

    let runningTotal = initialExpBeforeWindow;

    last14Days.forEach(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      const relevantHistoryEntries = sortedHistory.filter(h => h.date <= dayString);
      if (relevantHistoryEntries.length > 0) {
          runningTotal = relevantHistoryEntries[relevantHistoryEntries.length - 1].totalExp;
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
  
  const avatarContainerSize = "w-[120px] h-[120px] sm:w-[150px] sm:h-[150px]";
  const avatarSize = "w-[100px] h-[100px] sm:w-[120px] sm:h-[120px]";
  const arcBaseSize = 100; // Base for calculation, corresponds to the smaller avatar size
  const arcSizeMultiplier = 1.25; // For sm screens

  return (
    <AppWrapper>
      <div className="space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-destructive/30">
          <CardHeader className="items-center text-center flex flex-col p-4">
            <div className={`avatar-arc-container mb-3 ${avatarContainerSize}`}>
              <div onClick={handleRivalAvatarClick} className={`cursor-pointer relative group border-2 border-destructive p-0.5 rounded-full overflow-hidden ${avatarSize}`}>
                {rival.avatarUrl && rival.avatarUrl !== 'https://placehold.co/120x120.png' ? (
                  <Image
                    src={rival.avatarUrl}
                    alt={`${rival.name}'s Avatar`}
                    layout="fill"
                    objectFit="cover"
                    className="rounded-full"
                    data-ai-hint="fantasy character"
                  />
                ) : (
                  <div className="w-full h-full bg-card flex items-center justify-center overflow-hidden rounded-full">
                     <CyberpunkRivalPlaceholder />
                  </div>
                )}
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <PlusCircle className="h-8 w-8 sm:h-10 sm:w-10 text-destructive neon-icon-destructive" />
                </div>
              </div>
              <span className="avatar-orbiting-arc avatar-orbiting-arc-type1" style={{ width: `calc(${arcBaseSize * 1.08}px * var(--avatar-scale, 1))`, height: `calc(${arcBaseSize * 1.08}px * var(--avatar-scale, 1))`, top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(15deg)', borderRightColor: 'transparent', borderBottomColor: 'transparent' }}></span>
              <span className="avatar-orbiting-arc avatar-orbiting-arc-type2" style={{ width: `calc(${arcBaseSize * 1.18}px * var(--avatar-scale, 1))`, height: `calc(${arcBaseSize * 1.18}px * var(--avatar-scale, 1))`, top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-40deg)', borderLeftColor: 'transparent', borderTopColor: 'transparent' }}></span>
              <span className="avatar-orbiting-arc avatar-orbiting-arc-type3" style={{ width: `calc(${arcBaseSize * 1.28}px * var(--avatar-scale, 1))`, height: `calc(${arcBaseSize * 1.28}px * var(--avatar-scale, 1))`, top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(60deg)', borderTopColor: 'transparent',  borderRightColor: 'transparent' }}></span>
            </div>
            <style jsx>{`
              .avatar-arc-container { --avatar-scale: 1; }
              @media (min-width: 640px) { /* sm breakpoint */
                .avatar-arc-container { --avatar-scale: ${arcSizeMultiplier}; }
              }
            `}</style>
            <input type="file" ref={rivalImageInputRef} onChange={handleRivalAvatarChange} accept="image/*" className="hidden" />

            <CardTitle className="font-headline text-2xl text-destructive uppercase tracking-wider">{rival.name}</CardTitle>
            <CardDescription className="text-xs font-code">
              <RankDisplay rankName={rival.rankName} subRank={rival.subRank} isRival className="text-muted-foreground" />
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center pt-2 pb-4 px-4">
            <div className="px-0 sm:px-4">
              <div className="flex justify-between text-xs mb-1 font-code">
                <span className="text-foreground uppercase">Rival EXP</span>
                <span className="text-destructive">{rival.currentExpInSubRank} / {rival.expToNextSubRank}</span>
              </div>
              <Progress
                value={(rival.expToNextSubRank > 0 ? (rival.currentExpInSubRank / rival.expToNextSubRank) : 0) * 100}
                className="h-2 bg-secondary"
                indicatorClassName="bg-destructive"
              />
            </div>

            <Card className="bg-background/30 border-border/50 mt-4 rounded-md shadow-inner">
              <CardHeader className="p-2">
                 <CardTitle className="text-xs font-medium text-center text-muted-foreground uppercase font-headline tracking-wider flex items-center justify-center">
                    <TimerIcon className="mr-2 h-4 w-4 text-destructive/70"/>
                    Next EXP Surge In
                 </CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                 <p className="text-xl font-mono font-bold text-destructive text-center tabular-nums">
                    {timeLeftForExpGain}
                  </p>
              </CardContent>
            </Card>


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
            {rivalExpGrowthData.length > 1 ? (
              <ChartContainer config={chartConfigRival} className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={rivalExpGrowthData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                    <YAxis 
                      axisLine={{ stroke: 'hsl(var(--border))' }} 
                      tickLine={{ stroke: 'hsl(var(--border))' }} 
                      tickMargin={8} 
                      fontSize={10}
                    />
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

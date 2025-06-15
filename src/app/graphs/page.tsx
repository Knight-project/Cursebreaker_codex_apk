
// src/app/graphs/page.tsx
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect, useMemo, useState } from 'react';
import { LineChart as LineChartIcon, TrendingUp } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { CartesianGrid, XAxis, YAxis, Line, LineChart, ResponsiveContainer } from 'recharts';
import { ATTRIBUTES_LIST, type Attribute } from '@/lib/types';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const chartConfigBase = {
  completion: {
    label: "Task Completion %",
    color: "hsl(var(--accent))",
  },
  strength: { label: "Strength EXP", color: "hsl(var(--chart-1))" },
  intelligence: { label: "Intelligence EXP", color: "hsl(var(--chart-2))" },
  endurance: { label: "Endurance EXP", color: "hsl(var(--chart-3))" },
  creativity: { label: "Creativity EXP", color: "hsl(var(--chart-4))" },
  charisma: { label: "Charisma EXP", color: "hsl(var(--chart-5))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function GraphsPage() {
  const { userProfile, tasks, setActiveTab } = useApp();
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    setActiveTab('graphs');
  }, [setActiveTab]);

  const dailyCompletionData = useMemo(() => {
    if (!hasMounted) return [];
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    return last14Days.map(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      const tasksAddedOnDay = tasks.filter(t => t.dateAdded === dayString);
      const tasksCompletedFromAdded = tasksAddedOnDay.filter(t => t.isCompleted);
      
      let completionRate = 0;
      if (tasksAddedOnDay.length > 0) {
        completionRate = (tasksCompletedFromAdded.length / tasksAddedOnDay.length) * 100;
      } else {
        completionRate = 0; 
      }
      
      return {
        date: format(day, 'MMM d'), 
        completion: parseFloat(completionRate.toFixed(1)),
      };
    });
  }, [tasks, hasMounted]);

  const attributeGrowthData = useMemo(() => {
    if (!hasMounted) return [];
    const last14Days = eachDayOfInterval({
      start: subDays(new Date(), 13),
      end: new Date(),
    });

    const cumulativeStatsByDay: { [date: string]: { [key in Attribute]?: number } } = {};
    const runningTotals: { [key in Attribute]?: number } = {};
    ATTRIBUTES_LIST.forEach(attr => {
      if (attr !== "None") runningTotals[attr] = 0;
    });

    last14Days.forEach(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      cumulativeStatsByDay[dayString] = { ...runningTotals }; 

      userProfile.taskHistory.forEach(task => {
        if (task.dateCompleted === dayString && task.attributeAffectedForStatExp && task.statExpGained) {
          if (task.attributeAffectedForStatExp !== "None") {
             runningTotals[task.attributeAffectedForStatExp] = (runningTotals[task.attributeAffectedForStatExp] || 0) + task.statExpGained;
          }
        }
      });
       cumulativeStatsByDay[dayString] = { ...runningTotals }; 
    });
    
    return last14Days.map(day => {
      const dayString = format(day, 'yyyy-MM-dd');
      const entry: any = { date: format(day, 'MMM d') };
      ATTRIBUTES_LIST.forEach(attr => {
        if (attr !== "None") {
          entry[attr.toLowerCase()] = cumulativeStatsByDay[dayString]?.[attr] || 0;
        }
      });
      return entry;
    });

  }, [userProfile.taskHistory, hasMounted]);
  
  const chartConfig = chartConfigBase;

  if (!hasMounted) {
    return (
      <AppWrapper>
        <div className="space-y-8">
          <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <Skeleton className="h-7 w-3/4" /> {/* Title */}
              <Skeleton className="h-5 w-full mt-1" /> {/* Description */}
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" /> {/* Chart Area */}
            </CardContent>
          </Card>
          <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <Skeleton className="h-7 w-3/4" /> {/* Title */}
              <Skeleton className="h-5 w-full mt-1" /> {/* Description */}
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[300px] w-full" /> {/* Chart Area */}
            </CardContent>
          </Card>
        </div>
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <div className="space-y-8">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <LineChartIcon className="mr-2 h-6 w-6" /> Daily Task Completion
            </CardTitle>
            <CardDescription>Percentage of tasks added on a given day that were completed (over the past 14 days).</CardDescription>
          </CardHeader>
          <CardContent>
            {dailyCompletionData.length > 0 ? (
              <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={dailyCompletionData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/>
                    <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                    <YAxis 
                      axisLine={{ stroke: 'hsl(var(--border))' }} 
                      tickLine={{ stroke: 'hsl(var(--border))' }} 
                      tickMargin={8} 
                      domain={[0, 100]} 
                      tickFormatter={(value) => `${value}%`}
                    />
                    <ChartTooltip 
                      content={<ChartTooltipContent formatter={(value, name) => [`${value}%`, name as string]}/>} 
                    />
                    <Line type="monotone" dataKey="completion" stroke="var(--color-completion)" strokeWidth={3} dot={{ r: 4, fill: "var(--color-completion)", strokeWidth:1, stroke:"hsl(var(--background))" }} activeDot={{r:6}} name="Completion Rate"/>
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-4">Not enough task data to display completion trends.</p>
            )}
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-accent flex items-center">
              <TrendingUp className="mr-2 h-6 w-6" /> Cumulative Attribute EXP Growth
            </CardTitle>
            <CardDescription>Cumulative EXP gained for each attribute from completed tasks (over the past 14 days).</CardDescription>
          </CardHeader>
          <CardContent>
            {attributeGrowthData.length > 0 ? (
               <ChartContainer config={chartConfig} className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={attributeGrowthData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} />
                      <YAxis 
                        axisLine={{ stroke: 'hsl(var(--border))' }} 
                        tickLine={{ stroke: 'hsl(var(--border))' }} 
                        tickMargin={8} 
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      {ATTRIBUTES_LIST.filter(attr => attr !== "None").map(attr => (
                         <Line 
                            key={attr} 
                            type="monotone" 
                            dataKey={attr.toLowerCase()} 
                            stroke={`var(--color-${attr.toLowerCase()})`} 
                            strokeWidth={2} 
                            dot={{ r: 3, strokeWidth:1 }} 
                            activeDot={{r:5}}
                            name={chartConfig[attr.toLowerCase() as keyof typeof chartConfig]?.label || attr} 
                          />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
              </ChartContainer>
            ) : (
              <p className="text-muted-foreground text-center py-4">Not enough task history data to display attribute growth.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
}

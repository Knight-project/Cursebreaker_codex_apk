
// src/app/graphs/page.tsx
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect } from 'react';
import { BarChart, TrendingUp, LineChart as LineChartIcon } from 'lucide-react';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { CartesianGrid, XAxis, Line, LineChart, Bar as RechartsBar, ResponsiveContainer } from 'recharts'; // Renamed Bar to RechartsBar
import { ATTRIBUTES_LIST } from '@/lib/types';

const chartConfig = {
  completion: {
    label: "Task Completion %",
    color: "hsl(var(--accent))",
  },
  strength: { label: "Strength", color: "hsl(var(--chart-1))" },
  intelligence: { label: "Intelligence", color: "hsl(var(--chart-2))" },
  endurance: { label: "Endurance", color: "hsl(var(--chart-3))" },
  creativity: { label: "Creativity", color: "hsl(var(--chart-4))" },
  charisma: { label: "Charisma", color: "hsl(var(--chart-5))" },
} satisfies import("@/components/ui/chart").ChartConfig;


export default function GraphsPage() {
  const { userProfile, tasks, setActiveTab } = useApp();

  useEffect(() => {
    setActiveTab('graphs');
  }, [setActiveTab]);

  // Dummy data for daily task completion - last 14 days
  const dailyCompletionData = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return {
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      completion: Math.floor(Math.random() * 60) + 40, // Random % between 40-100
    };
  });

  // Dummy data for stat growth over time (e.g., last 7 entries or levels)
  const statGrowthData = ATTRIBUTES_LIST.filter(attr => attr !== "None").map(attr => ({
    name: attr,
    // Create 5 data points for each attribute for demonstration
    data: Array.from({length: 5}, (_, i) => ({
      time: `T${i+1}`, // Representing time points or levels
      value: (userProfile.stats[attr.toLowerCase() as keyof typeof userProfile.stats]?.level || 1) + Math.floor(Math.random() * (i + 1) * 2) // Simplified growth
    }))
  }));
  // Example for Recharts: combine data for multi-line chart if needed, or separate charts
  const combinedStatData = Array.from({length: 5}, (_, i) => {
    let entry: any = { time: `T${i+1}` };
    ATTRIBUTES_LIST.filter(attr => attr !== "None").forEach(attr => {
      entry[attr.toLowerCase()] = (userProfile.stats[attr.toLowerCase()as keyof typeof userProfile.stats]?.level || 1) + Math.floor(Math.random() * (i+1) * 2);
    });
    return entry;
  });


  return (
    <AppWrapper>
      <div className="space-y-8">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary flex items-center">
              <LineChartIcon className="mr-2 h-6 w-6" /> Daily Task Completion
            </CardTitle>
            <CardDescription>Your task completion percentage over the past 14 days.</CardDescription>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={dailyCompletionData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))"/>
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} tickFormatter={(value) => value.slice(0,6)}/>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="completion" stroke="var(--color-completion)" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-accent flex items-center">
              <TrendingUp className="mr-2 h-6 w-6" /> Attribute Growth
            </CardTitle>
            <CardDescription>Progression of your attributes over time.</CardDescription>
          </CardHeader>
          <CardContent>
             <ChartContainer config={chartConfig} className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={combinedStatData} margin={{ top: 5, right: 20, left: -25, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="time" tickLine={false} axisLine={false} tickMargin={8} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <ChartLegend content={<ChartLegendContent />} />
                    {ATTRIBUTES_LIST.filter(attr => attr !== "None").map(attr => (
                       <Line key={attr} type="monotone" dataKey={attr.toLowerCase()} stroke={`var(--color-${attr.toLowerCase()})`} strokeWidth={2} dot={true} name={attr} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
            </ChartContainer>
            <p className="text-sm text-muted-foreground mt-4 text-center">Note: Stat growth data is illustrative.</p>
          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
}

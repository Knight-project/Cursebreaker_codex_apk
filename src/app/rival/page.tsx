// src/app/rival/page.tsx
'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import { Swords } from 'lucide-react'; // Icon for taunt button

export default function RivalPage() {
  const { rival, updateRivalTaunt, setActiveTab } = useApp();
  const [isLoadingTaunt, setIsLoadingTaunt] = useState(false);

  useEffect(() => {
    setActiveTab('rival');
    // Initial taunt fetch if none exists
    if (!rival.lastTaunt) {
      handleGetTaunt();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setActiveTab]); // Removed rival.lastTaunt to prevent loop with updateRivalTaunt

  const handleGetTaunt = async () => {
    setIsLoadingTaunt(true);
    await updateRivalTaunt();
    setIsLoadingTaunt(false);
  };

  return (
    <AppWrapper>
      <div className="space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-destructive/30">
          <CardHeader className="items-center text-center">
            <Image 
              src={rival.avatarUrl || `https://placehold.co/150x150.png`} 
              alt={`${rival.name}'s Avatar`}
              width={120} 
              height={120} 
              className="rounded-full border-4 border-destructive shadow-lg mb-4"
              data-ai-hint="fantasy character"
            />
            <CardTitle className="font-headline text-3xl text-destructive">{rival.name}</CardTitle>
            <CardDescription className="text-muted-foreground">{rival.rankName} - Sub-Rank {rival.subRank}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center">
            <div>
              <div className="flex justify-between text-sm mb-1 px-4">
                <span className="text-foreground">Rival EXP</span>
                <span className="text-destructive">{rival.currentExpInSubRank} / {rival.expToNextSubRank}</span>
              </div>
              <Progress 
                value={(rival.currentExpInSubRank / rival.expToNextSubRank) * 100} 
                className="h-3 bg-secondary mx-4" 
                indicatorClassName="bg-destructive" 
              />
            </div>
            
            <Card className="bg-background/50 border-border mt-6">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-center text-muted-foreground">A Word From Your Rival</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-lg italic text-center text-foreground min-h-[50px] flex items-center justify-center">
                  {rival.lastTaunt || "..."}
                </p>
                <Button onClick={handleGetTaunt} disabled={isLoadingTaunt} className="mt-4 w-full bg-destructive hover:bg-destructive/90">
                  <Swords className="mr-2 h-4 w-4" />
                  {isLoadingTaunt ? 'Provoking...' : 'Provoke Rival'}
                </Button>
              </CardContent>
            </Card>

          </CardContent>
        </Card>
        
        {/* Placeholder for more rival details if needed in future */}
        {/* <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">Rival's Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">More detailed rival statistics and history will appear here.</p>
          </CardContent>
        </Card> */}
      </div>
    </AppWrapper>
  );
}

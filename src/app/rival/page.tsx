
// src/app/rival/page.tsx
'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect, useState, useRef, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Swords, PlusCircle } from 'lucide-react'; 
import { useToast } from '@/hooks/use-toast';

const CyberpunkAvatarPlaceholder = () => (
  <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-full w-full text-muted-foreground group-hover:text-destructive transition-colors">
    <path d="M50 15L20 30V70L50 85L80 70V30L50 15Z" stroke="currentColor" strokeWidth="3"/>
    <path d="M50 15V45" stroke="currentColor" strokeWidth="2"/>
    <path d="M20 30L50 45" stroke="currentColor" strokeWidth="2"/>
    <path d="M80 30L50 45" stroke="currentColor" strokeWidth="2"/>
    <path d="M35 50H65" stroke="currentColor" strokeWidth="3" />
    <path d="M50 60V85" stroke="currentColor" strokeWidth="2" />
    <circle cx="50" cy="45" r="5" fill="currentColor" className="opacity-50 group-hover:opacity-100"/>
  </svg>
);


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
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
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
      event.target.value = ""; // Reset file input
    }
  };

  return (
    <AppWrapper>
      <div className="space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-destructive/30">
          <CardHeader className="items-center text-center flex flex-col p-4">
            <div onClick={handleRivalAvatarClick} className="cursor-pointer mb-3 relative group w-[120px] h-[120px] border-2 border-destructive p-1">
              {rival.avatarUrl && rival.avatarUrl !== 'https://placehold.co/120x120.png' ? (
                <Image 
                  src={rival.avatarUrl} 
                  alt={`${rival.name}'s Avatar`}
                  width={120} 
                  height={120} 
                  className="object-cover w-full h-full"
                  data-ai-hint="fantasy character"
                />
              ) : (
                <div className="w-full h-full bg-card flex items-center justify-center overflow-hidden">
                   <CyberpunkAvatarPlaceholder />
                </div>
              )}
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlusCircle className="h-10 w-10 text-destructive neon-icon" />
              </div>
            </div>
            <input type="file" ref={rivalImageInputRef} onChange={handleRivalAvatarChange} accept="image/*" className="hidden" />
            
            <CardTitle className="font-headline text-2xl text-destructive uppercase tracking-wider">{rival.name}</CardTitle>
            <CardDescription className="text-muted-foreground text-xs font-code">{rival.rankName} - {rival.subRank}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center pt-2 pb-4 px-4">
            <div>
              <div className="flex justify-between text-xs mb-1 px-4 font-code">
                <span className="text-foreground uppercase">Rival EXP</span>
                <span className="text-destructive">{rival.currentExpInSubRank} / {rival.expToNextSubRank}</span>
              </div>
              <Progress 
                value={(rival.currentExpInSubRank / rival.expToNextSubRank) * 100} 
                className="h-2 bg-secondary mx-4" 
                indicatorClassName="bg-destructive" 
              />
            </div>
            
            <Card className="bg-background/50 border-border mt-4">
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
      </div>
    </AppWrapper>
  );
}

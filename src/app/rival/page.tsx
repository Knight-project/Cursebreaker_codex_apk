
// src/app/rival/page.tsx
'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect, useState, useRef, type ChangeEvent } from 'react';
import Image from 'next/image';
import { Swords, User, PlusCircle } from 'lucide-react'; // Icon for taunt button, User for placeholder, PlusCircle for upload overlay
import { useToast } from '@/hooks/use-toast';

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
          <CardHeader className="items-center text-center flex flex-col">
            <div onClick={handleRivalAvatarClick} className="cursor-pointer mb-4 relative group">
              {rival.avatarUrl ? (
                <Image 
                  src={rival.avatarUrl} 
                  alt={`${rival.name}'s Avatar`}
                  width={120} 
                  height={120} 
                  className="rounded-full border-4 border-destructive shadow-lg object-cover"
                  data-ai-hint="fantasy character"
                />
              ) : (
                <div className="w-[120px] h-[120px] rounded-full border-4 border-destructive shadow-lg bg-card flex items-center justify-center overflow-hidden">
                   <User className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
              <div className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <PlusCircle className="h-10 w-10 text-white" />
              </div>
            </div>
            <input type="file" ref={rivalImageInputRef} onChange={handleRivalAvatarChange} accept="image/*" className="hidden" />
            
            <CardTitle className="font-headline text-3xl text-destructive">{rival.name}</CardTitle>
            <CardDescription className="text-muted-foreground">{rival.rankName} - Sub-Rank {rival.subRank}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-center pt-4">
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
      </div>
    </AppWrapper>
  );
}

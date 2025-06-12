
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

const CyberpunkRivalPlaceholder = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground group-hover:text-destructive transition-colors">
    <defs>
      <linearGradient id="cyberRivalGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: 'hsl(var(--destructive))', stopOpacity:0.3}} />
        <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity:0.3}} />
      </linearGradient>
    </defs>
    <circle cx="50" cy="40" r="22" stroke="hsl(var(--destructive))" strokeWidth="2" fill="url(#cyberRivalGrad)" />
    <path d="M35 75 Q50 95 65 75 Q50 85 35 75" stroke="hsl(var(--destructive))" strokeWidth="1.5" fill="hsl(var(--destructive) / 0.1)" />
    <rect x="45" y="8" width="10" height="8" fill="hsl(var(--border))" opacity="0.5" transform="rotate(10 50 12)"/>
    <line x1="38" y1="45" x2="48" y2="40" stroke="hsl(var(--accent))" strokeWidth="1.5"/>
    <line x1="62" y1="45" x2="52" y2="40" stroke="hsl(var(--accent))" strokeWidth="1.5"/>
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

  return (
    <AppWrapper>
      <div className="space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-destructive/30">
          <CardHeader className="items-center text-center flex flex-col p-4">
            <div className="avatar-arc-container mb-3 w-[150px] h-[150px]">
              <div onClick={handleRivalAvatarClick} className="cursor-pointer relative group w-[120px] h-[120px] border-2 border-destructive p-0.5 rounded-full overflow-hidden"> {/* Removed mx-auto my-auto */}
                {rival.avatarUrl && rival.avatarUrl !== 'https://placehold.co/120x120.png' ? ( // Check specifically for the old placeholder
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
              <span className="avatar-orbiting-arc avatar-orbiting-arc-type1" style={{ width: '130px', height: '130px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(15deg)', borderRightColor: 'transparent', borderBottomColor: 'transparent' }}></span>
              <span className="avatar-orbiting-arc avatar-orbiting-arc-type2" style={{ width: '140px', height: '140px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-40deg)', borderLeftColor: 'transparent', borderTopColor: 'transparent' }}></span>
              <span className="avatar-orbiting-arc avatar-orbiting-arc-type3" style={{ width: '150px', height: '150px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(60deg)', borderTopColor: 'transparent',  borderRightColor: 'transparent' }}></span>
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
      </div>
    </AppWrapper>
  );
}

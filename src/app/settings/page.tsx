
// src/app/settings/page.tsx
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { RIVAL_NAMES_POOL } from '@/lib/constants';
import { playSound } from '@/lib/soundManager';

export default function SettingsPage() {
  const { appSettings, setAppSettings, userProfile, setUserProfile, rival, setRival, setActiveTab } = useApp();
  const { toast } = useToast();

  // Local state for debounced input might be useful for performance if direct context updates are too frequent.
  // For now, direct updates are used for simplicity, similar to Home page editing.
  const [currentUserName, setCurrentUserName] = useState(userProfile.userName);
  const [currentCustomQuote, setCurrentCustomQuote] = useState(userProfile.customQuote);

  useEffect(() => {
    setActiveTab('settings');
  }, [setActiveTab]);

  useEffect(() => {
    setCurrentUserName(userProfile.userName);
  }, [userProfile.userName]);

  useEffect(() => {
    setCurrentCustomQuote(userProfile.customQuote);
  }, [userProfile.customQuote]);


  const handleSettingsChange = (key: keyof typeof appSettings, value: any) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
    toast({ title: "Settings Updated", description: `${String(key).replace(/([A-Z])/g, ' $1').trim()} setting changed.` });
    playSound('buttonClick');
  };

  const handleRivalNameChange = (newName: string) => {
    setRival(prev => ({ ...prev, name: newName }));
    toast({ title: "Rival Name Updated!", description: `Your rival is now known as ${newName}.` });
    playSound('buttonClick');
  };
  
  const handleUserNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newName = event.target.value;
    setCurrentUserName(newName);
    setUserProfile(prev => ({ ...prev, userName: newName.trim() }));
    // Debounce or save on blur could be added here if needed
  };

  const handleUserNameBlur = () => {
    if (userProfile.userName !== currentUserName.trim()) { // Only toast if changed
        toast({ title: "Username Updated!"});
    }
  }

  const handleCustomQuoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuote = event.target.value;
    setCurrentCustomQuote(newQuote);
    setUserProfile(prev => ({ ...prev, customQuote: newQuote }));
  };
  
  const handleCustomQuoteBlur = () => {
     if (userProfile.customQuote !== currentCustomQuote) {
        toast({ title: "Quote Updated!" });
     }
  }


  return (
    <AppWrapper>
      <div className="space-y-8">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">User Profile</CardTitle>
            <CardDescription>Customize your displayed name and motivational quote.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 rounded-md border bg-background/30 space-y-2">
              <Label htmlFor="userNameInput" className="text-lg font-medium">Username</Label>
              <Input
                id="userNameInput"
                type="text"
                value={currentUserName}
                onChange={handleUserNameChange}
                onBlur={handleUserNameBlur}
                placeholder="Enter your codename"
                className="bg-input/50 focus:bg-input"
                maxLength={30}
              />
              <p className="text-xs text-muted-foreground">This name is displayed on your profile card.</p>
            </div>

            <div className="p-4 rounded-md border bg-background/30 space-y-2">
              <Label htmlFor="customQuoteInput" className="text-lg font-medium">Your Motivational Quote</Label>
              <Input
                id="customQuoteInput"
                type="text"
                value={currentCustomQuote}
                onChange={handleCustomQuoteChange}
                onBlur={handleCustomQuoteBlur}
                placeholder="Enter your guiding principle"
                className="bg-input/50 focus:bg-input"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">This quote appears below your rank.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Application Settings</CardTitle>
            <CardDescription>Customize your experience.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="flex items-center justify-between p-4 rounded-md border bg-background/30">
              <Label htmlFor="enableAnimations" className="text-lg font-medium">Enable Animations</Label>
              <Switch
                id="enableAnimations"
                checked={appSettings.enableAnimations}
                onCheckedChange={(checked) => handleSettingsChange('enableAnimations', checked)}
                aria-label="Toggle animations"
              />
            </div>
            
            <div className="flex items-center justify-between p-4 rounded-md border bg-background/30">
              <Label htmlFor="enableSoundEffects" className="text-lg font-medium">Enable Sound Effects</Label>
              <Switch
                id="enableSoundEffects"
                checked={appSettings.enableSoundEffects}
                onCheckedChange={(checked) => handleSettingsChange('enableSoundEffects', checked)}
                aria-label="Toggle sound effects"
              />
            </div>

            <div className="p-4 rounded-md border bg-background/30 space-y-2">
              <Label htmlFor="rivalName" className="text-lg font-medium">Rival Name</Label>
              <Select
                value={rival.name}
                onValueChange={handleRivalNameChange}
              >
                <SelectTrigger id="rivalName" className="w-full bg-input/50 focus:bg-input">
                  <SelectValue placeholder="Select rival name" />
                </SelectTrigger>
                <SelectContent>
                  {RIVAL_NAMES_POOL.map(name => (
                    <SelectItem key={name} value={name}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Choose the designation of your adversary.</p>
            </div>

            <div className="p-4 rounded-md border bg-background/30 space-y-2">
              <Label htmlFor="rivalDifficulty" className="text-lg font-medium">Rival Difficulty</Label>
              <Select
                value={appSettings.rivalDifficulty}
                onValueChange={(value) => handleSettingsChange('rivalDifficulty', value as "Easy" | "Normal" | "Hard")}
              >
                <SelectTrigger id="rivalDifficulty" className="w-full bg-input/50 focus:bg-input">
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Easy">Easy</SelectItem>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Hard">Hard</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">Adjusts how quickly your rival gains EXP.</p>
            </div>

            <div className="flex items-center justify-between p-4 rounded-md border bg-background/30">
              <Label htmlFor="autoAssignStatExp" className="text-lg font-medium">Auto-Assign Stat XP</Label>
              <Switch
                id="autoAssignStatExp"
                checked={appSettings.autoAssignStatExp}
                onCheckedChange={(checked) => handleSettingsChange('autoAssignStatExp', checked)}
                aria-label="Toggle automatic stat experience assignment"
              />
            </div>
             <p className="text-xs text-muted-foreground -mt-4 pl-4">
                If enabled, completing tasks automatically assigns portion of EXP to selected attribute.
              </p>
          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
}

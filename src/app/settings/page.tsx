// src/app/settings/page.tsx
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

export default function SettingsPage() {
  const { appSettings, setAppSettings, userProfile, setUserProfile, setActiveTab } = useApp();
  const { toast } = useToast();

  useEffect(() => {
    setActiveTab('settings');
  }, [setActiveTab]);

  const handleSettingsChange = (key: keyof typeof appSettings, value: any) => {
    setAppSettings(prev => ({ ...prev, [key]: value }));
    toast({ title: "Settings Updated", description: `${String(key).replace(/([A-Z])/g, ' $1').trim()} setting changed.` });
  };

  const handleQuoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUserProfile(prev => ({ ...prev, customQuote: e.target.value }));
  };
  
  const handleSaveQuote = () => {
     toast({ title: "Quote Updated", description: "Your motivational quote has been saved." });
     // User profile is already updated via useLocalStorage hook on change.
  };

  return (
    <AppWrapper>
      <div className="space-y-8">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">Application Settings</CardTitle>
            <CardDescription>Customize your Habit Horizon experience.</CardDescription>
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
                If enabled, completing tasks automatically assigns portion of EXP to selected attribute. If disabled, you might need a manual assignment system (not yet implemented).
              </p>

            <div className="p-4 rounded-md border bg-background/30 space-y-2">
              <Label htmlFor="customQuote" className="text-lg font-medium">Custom Motivational Quote</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="customQuote"
                  value={userProfile.customQuote}
                  onChange={handleQuoteChange}
                  placeholder="Enter your motivational quote"
                  className="flex-grow bg-input/50 focus:bg-input"
                />
                <Button onClick={handleSaveQuote} size="sm">Save Quote</Button>
              </div>
              <p className="text-xs text-muted-foreground">This quote appears on your Home dashboard.</p>
            </div>

          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
}

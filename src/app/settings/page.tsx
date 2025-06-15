
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useApp } from '@/contexts/AppContext';
import React, { useEffect, useState, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
// CAPACITOR_NOTE: For native Toasts, use Capacitor Toast plugin (@capacitor/toast).
import { RIVAL_NAMES_POOL, APP_NAME } from '@/lib/constants';
import { playSound } from '@/lib/soundManager';
import { Download, Upload, AlertTriangle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { INITIAL_APP_SETTINGS, INITIAL_USER_PROFILE, INITIAL_RIVAL } from '@/lib/types';


export default function SettingsPage() {
  const { 
    appSettings, setAppSettings, 
    userProfile, setUserProfile, 
    rival, setRival, 
    setActiveTab,
    getAllSaveData, loadAllSaveData
  } = useApp();
  const { toast } = useToast();

  const [currentUserName, setCurrentUserName] = useState(userProfile.userName);
  const [currentCustomQuote, setCurrentCustomQuote] = useState(userProfile.customQuote);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [pendingImportFile, setPendingImportFile] = useState<File | null>(null);
  const [hasMounted, setHasMounted] = useState(false);
  
  useEffect(() => {
    setHasMounted(true);
    setActiveTab('settings');
  }, [setActiveTab]);

  useEffect(() => {
    if (hasMounted) {
      setCurrentUserName(userProfile.userName);
    }
  }, [userProfile.userName, hasMounted]);

  useEffect(() => {
    if (hasMounted) {
      setCurrentCustomQuote(userProfile.customQuote);
    }
  }, [userProfile.customQuote, hasMounted]);


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
  };

  const handleUserNameBlur = () => {
    if (userProfile.userName !== currentUserName.trim()) { 
        toast({ title: "Username Updated!"});
    }
  }

  const handleCustomQuoteChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newQuote = event.target.value;
    setCurrentCustomQuote(newQuote);
    setUserProfile(prev => ({ ...prev, customQuote: newQuote.trim() }));
  };
  
  const handleCustomQuoteBlur = () => {
     if (userProfile.customQuote !== currentCustomQuote.trim()) {
        toast({ title: "Quote Updated!" });
     }
  }

  const handleExportData = () => {
    // CAPACITOR_NOTE: For native export, use Capacitor Filesystem to write to a file
    // and Capacitor Share plugin to allow user to save/send it.
    if (!hasMounted) return; 
    const saveData = getAllSaveData();
    const jsonString = JSON.stringify(saveData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${APP_NAME}_save_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    playSound('buttonClick');
    toast({ title: "Data Exported", description: "Your save file has been downloaded." });
  };

  const handleFileSelectForImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    // CAPACITOR_NOTE: For native import, use a file picker (custom plugin or by handling URI from Share plugin)
    // then read the file using Capacitor Filesystem.
    const file = event.target.files?.[0];
    if (file) {
      setPendingImportFile(file);
    }
     if (fileInputRef.current) {
        fileInputRef.current.value = ""; 
    }
  };

  const processImport = () => {
    if (!pendingImportFile || !hasMounted) return; 

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          toast({ title: "Import Failed", description: "Could not read file content.", variant: "destructive" });
          return;
        }
        const importedData = JSON.parse(text);
        if (loadAllSaveData(importedData)) {
           // Success toast is handled by loadAllSaveData
        }
      } catch (error) {
        console.error("Error importing data:", error);
        toast({ title: "Import Failed", description: "Invalid JSON file or structure.", variant: "destructive" });
      } finally {
        setPendingImportFile(null); 
      }
    };
    reader.readAsText(pendingImportFile);
    playSound('buttonClick');
  };

  if (!hasMounted) {
    return (
      <AppWrapper>
        <LoadingScreen />
      </AppWrapper>
    );
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
                {/* CAPACITOR_NOTE: Sound effect preferences might control native sound APIs if Capacitor Haptics/SoundEffect plugins are used. */}
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

          <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">Data Management</CardTitle>
              <CardDescription>Export your progress or import a previous save.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-md border bg-background/30 space-y-3">
                <Button onClick={handleExportData} className="w-full sm:w-auto bg-accent hover:bg-accent/90">
                  <Download className="mr-2 h-5 w-5" /> Export Data
                </Button>
                <p className="text-xs text-muted-foreground">Download a JSON file of your current app data.</p>
              </div>
              
              <div className="p-4 rounded-md border bg-background/30 space-y-3">
                 {/* CAPACITOR_NOTE: For native confirm dialogs, use Capacitor Dialog plugin (@capacitor/dialog). */}
                 <AlertDialog open={pendingImportFile !== null} onOpenChange={(open) => { if(!open) setPendingImportFile(null); }}>
                  <AlertDialogTrigger asChild>
                     <Button 
                       variant="outline" 
                       className="w-full sm:w-auto border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                       onClick={() => { playSound('buttonClick'); fileInputRef.current?.click();}}
                      >
                      <Upload className="mr-2 h-5 w-5" /> Import Data
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="mr-2 h-5 w-5 text-destructive"/> Confirm Import
                      </AlertDialogTitle>
                      <AlertDialogDescription>
                        Importing data will overwrite your current progress in this browser. This action cannot be undone. Are you sure you want to proceed with importing {pendingImportFile?.name}?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel onClick={() => {setPendingImportFile(null); playSound('buttonClick');}}>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={processImport} 
                        disabled={!pendingImportFile}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Proceed with Import
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileSelectForImport} 
                  accept=".json" 
                  className="hidden" 
                />
                <p className="text-xs text-muted-foreground">
                  Load data from a previously exported JSON file.
                  {pendingImportFile && <span className="block mt-1 text-accent">Selected file: {pendingImportFile.name}. Confirm above to proceed.</span>}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
    </AppWrapper>
  );
}


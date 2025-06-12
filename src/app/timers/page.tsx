// src/app/timers/page.tsx
'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Settings2 } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

// Pomodoro Timer Component
const PomodoroTimer = () => {
  const { pomodoroSettings, setPomodoroSettings, grantExp, appSettings } = useApp();
  const { toast } = useToast();

  const [mode, setMode] = useState<'focus' | 'shortBreak' | 'longBreak'>('focus');
  const [timeLeft, setTimeLeft] = useState(pomodoroSettings.focusDuration * 60);
  const [isActive, setIsActive] = useState(false);
  const [sessionsCompleted, setSessionsCompleted] = useState(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  
  const [tempSettings, setTempSettings] = useState(pomodoroSettings);

  const calculateTimeForMode = useCallback((currentMode: 'focus' | 'shortBreak' | 'longBreak') => {
    switch (currentMode) {
      case 'focus': return pomodoroSettings.focusDuration * 60;
      case 'shortBreak': return pomodoroSettings.shortBreakDuration * 60;
      case 'longBreak': return pomodoroSettings.longBreakDuration * 60;
      default: return pomodoroSettings.focusDuration * 60;
    }
  }, [pomodoroSettings]);

  useEffect(() => {
    setTimeLeft(calculateTimeForMode(mode));
  }, [pomodoroSettings, mode, calculateTimeForMode]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (mode === 'focus') {
        const expGained = appSettings.enableAnimations ? Math.floor(pomodoroSettings.focusDuration / 5) : 0; // Example: 1 EXP per 5 min focus
        if (expGained > 0) {
          grantExp(expGained);
          toast({ title: "Focus Session Complete!", description: `You earned ${expGained} EXP!` });
        } else {
           toast({ title: "Focus Session Complete!"});
        }
        
        const newSessionsCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newSessionsCompleted);
        if (newSessionsCompleted % pomodoroSettings.sessionsBeforeLongBreak === 0) {
          setMode('longBreak');
        } else {
          setMode('shortBreak');
        }
      } else { // break ended
        toast({ title: "Break Over!", description: "Time to focus again." });
        setMode('focus');
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, sessionsCompleted, pomodoroSettings, grantExp, toast, appSettings.enableAnimations]);

  const toggleTimer = () => setIsActive(!isActive);

  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    setTimeLeft(pomodoroSettings.focusDuration * 60);
    setSessionsCompleted(0);
  };
  
  const handleSettingsSave = () => {
    setPomodoroSettings(tempSettings);
    setIsSettingsOpen(false);
    // Reset timer with new settings if it was running or to reflect changes
    setIsActive(false);
    setTimeLeft(calculateTimeForMode(mode)); 
    toast({ title: "Pomodoro settings updated!" });
  };


  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const currentDuration = calculateTimeForMode(mode);
  const progressPercentage = currentDuration > 0 ? ((currentDuration - timeLeft) / currentDuration) * 100 : 0;


  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl text-primary">Pomodoro Timer</CardTitle>
         <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon"><Settings2 className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Pomodoro Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="focusDuration">Focus Duration (min)</Label>
                <Input id="focusDuration" type="number" value={tempSettings.focusDuration} onChange={(e) => setTempSettings(s => ({...s, focusDuration: parseInt(e.target.value) || 25}))} />
              </div>
              <div>
                <Label htmlFor="shortBreakDuration">Short Break (min)</Label>
                <Input id="shortBreakDuration" type="number" value={tempSettings.shortBreakDuration} onChange={(e) => setTempSettings(s => ({...s, shortBreakDuration: parseInt(e.target.value) || 5}))} />
              </div>
              <div>
                <Label htmlFor="longBreakDuration">Long Break (min)</Label>
                <Input id="longBreakDuration" type="number" value={tempSettings.longBreakDuration} onChange={(e) => setTempSettings(s => ({...s, longBreakDuration: parseInt(e.target.value) || 15}))} />
              </div>
              <div>
                <Label htmlFor="sessionsBeforeLongBreak">Sessions before Long Break</Label>
                <Input id="sessionsBeforeLongBreak" type="number" value={tempSettings.sessionsBeforeLongBreak} onChange={(e) => setTempSettings(s => ({...s, sessionsBeforeLongBreak: parseInt(e.target.value) || 4}))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
              <Button onClick={handleSettingsSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="flex flex-col items-center space-y-6 py-8">
        <div className="text-6xl font-mono font-bold text-accent tabular-nums">
          {formatTime(timeLeft)}
        </div>
        <Progress value={progressPercentage} className="w-full h-3" indicatorClassName="bg-accent" />
        <p className="text-muted-foreground capitalize font-medium">
          Current Mode: {mode.replace('B', ' B')}
        </p>
        <div className="flex space-x-4">
          <Button onClick={toggleTimer} variant={isActive ? "destructive" : "default"} className="w-24 bg-primary hover:bg-primary/90">
            {isActive ? <Pause className="mr-2 h-5 w-5" /> : <Play className="mr-2 h-5 w-5" />}
            {isActive ? 'Pause' : 'Start'}
          </Button>
          <Button onClick={resetTimer} variant="outline" className="w-24">
            <RotateCcw className="mr-2 h-5 w-5" />
            Reset
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">Sessions completed: {sessionsCompleted}</p>
      </CardContent>
    </Card>
  );
};


// Interval Timer (Placeholder)
const IntervalTimer = () => {
  const { intervalTimerSettings, setIntervalTimerSettings } = useApp();
  const { toast } = useToast();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempSettings, setTempSettings] = useState(intervalTimerSettings);

  const handleSettingsSave = () => {
    setIntervalTimerSettings(tempSettings);
    setIsSettingsOpen(false);
    toast({ title: "Interval Timer settings updated!" });
  };

  // Interval timer logic (notifications, etc.) would be complex and require browser APIs.
  // This is a UI placeholder.
  useEffect(() => {
    let timerId: NodeJS.Timeout | null = null;
    if (intervalTimerSettings.isEnabled) {
      // Example: log to console when a reminder would fire
      // A real implementation would use browser notifications if permission granted.
      const checkTimeAndNotify = () => {
        const now = new Date();
        const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
        
        if (currentTime >= intervalTimerSettings.windowStart && currentTime <= intervalTimerSettings.windowEnd) {
          // Simplified: check every minute if it's an interval.
          // A more robust solution would calculate next notification time.
          if (now.getMinutes() % intervalTimerSettings.repeatInterval === 0) {
             console.log(`Interval Reminder: ${intervalTimerSettings.taskName}`);
             if(document.hasFocus()){ // only toast if window is active to avoid spam
                toast({ title: "Interval Reminder", description: intervalTimerSettings.taskName });
             }
          }
        }
      };
      
      checkTimeAndNotify(); // check immediately
      timerId = setInterval(checkTimeAndNotify, 60000); // check every minute
    }
    return () => {
      if (timerId) clearInterval(timerId);
    };
  }, [intervalTimerSettings, toast]);


  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl text-primary">Interval Timer</CardTitle>
        <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon"><Settings2 className="h-5 w-5" /></Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Interval Timer Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
               <div>
                <Label htmlFor="intervalEnabled">Enable Timer</Label>
                 <Button 
                    variant={tempSettings.isEnabled ? "default" : "outline"}
                    onClick={() => setTempSettings(s => ({...s, isEnabled: !s.isEnabled}))}
                    className="w-full mt-1"
                  >
                  {tempSettings.isEnabled ? "Enabled" : "Disabled"}
                </Button>
              </div>
              <div>
                <Label htmlFor="intervalTaskName">Task Name</Label>
                <Input id="intervalTaskName" value={tempSettings.taskName} onChange={(e) => setTempSettings(s => ({...s, taskName: e.target.value}))} />
              </div>
              <div>
                <Label htmlFor="intervalWindowStart">Window Start (HH:MM)</Label>
                <Input id="intervalWindowStart" type="time" value={tempSettings.windowStart} onChange={(e) => setTempSettings(s => ({...s, windowStart: e.target.value}))} />
              </div>
               <div>
                <Label htmlFor="intervalWindowEnd">Window End (HH:MM)</Label>
                <Input id="intervalWindowEnd" type="time" value={tempSettings.windowEnd} onChange={(e) => setTempSettings(s => ({...s, windowEnd: e.target.value}))} />
              </div>
              <div>
                <Label htmlFor="intervalRepeat">Repeat Interval (min)</Label>
                <Input id="intervalRepeat" type="number" value={tempSettings.repeatInterval} onChange={(e) => setTempSettings(s => ({...s, repeatInterval: parseInt(e.target.value) || 60}))} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSettingsOpen(false)}>Cancel</Button>
              <Button onClick={handleSettingsSave}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4 py-6">
        <p className="text-muted-foreground">
          Status: <span className={intervalTimerSettings.isEnabled ? "text-green-400" : "text-red-400"}>{intervalTimerSettings.isEnabled ? 'Active' : 'Inactive'}</span>
        </p>
        {intervalTimerSettings.isEnabled && (
          <>
            <p>Task: <span className="font-medium text-foreground">{intervalTimerSettings.taskName}</span></p>
            <p>Reminds every <span className="font-medium text-accent">{intervalTimerSettings.repeatInterval} minutes</span></p>
            <p>During: <span className="font-medium text-accent">{intervalTimerSettings.windowStart} - {intervalTimerSettings.windowEnd}</span></p>
          </>
        )}
        {!intervalTimerSettings.isEnabled && (
           <p className="text-muted-foreground">Enable the timer in settings to get reminders for micro-tasks.</p>
        )}
      </CardContent>
    </Card>
  );
};

export default function TimersPage() {
  const { setActiveTab } = useApp();
  useEffect(() => {
    setActiveTab('timers');
  }, [setActiveTab]);

  return (
    <AppWrapper>
      <div className="space-y-8">
        <PomodoroTimer />
        <IntervalTimer />
      </div>
    </AppWrapper>
  );
}

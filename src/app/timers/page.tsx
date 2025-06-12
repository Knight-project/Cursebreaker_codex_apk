
// src/app/timers/page.tsx
'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Settings2, PlusCircle, Trash2, Edit3, BellRing, BellOff } from 'lucide-react';
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
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import type { IntervalTimerSetting } from '@/lib/types';
import { Switch } from '@/components/ui/switch';


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
        const expGained = appSettings.enableAnimations ? Math.floor(pomodoroSettings.focusDuration / 5) : 0;
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
      } else { 
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
                <Input id="focusDuration" type="number" value={tempSettings.focusDuration} onChange={(e) => setTempSettings(s => ({...s, focusDuration: Math.max(1, parseInt(e.target.value) || 25)}))} min="1" />
              </div>
              <div>
                <Label htmlFor="shortBreakDuration">Short Break (min)</Label>
                <Input id="shortBreakDuration" type="number" value={tempSettings.shortBreakDuration} onChange={(e) => setTempSettings(s => ({...s, shortBreakDuration: Math.max(1, parseInt(e.target.value) || 5)}))} min="1" />
              </div>
              <div>
                <Label htmlFor="longBreakDuration">Long Break (min)</Label>
                <Input id="longBreakDuration" type="number" value={tempSettings.longBreakDuration} onChange={(e) => setTempSettings(s => ({...s, longBreakDuration: Math.max(1, parseInt(e.target.value) || 15)}))} min="1" />
              </div>
              <div>
                <Label htmlFor="sessionsBeforeLongBreak">Sessions before Long Break</Label>
                <Input id="sessionsBeforeLongBreak" type="number" value={tempSettings.sessionsBeforeLongBreak} onChange={(e) => setTempSettings(s => ({...s, sessionsBeforeLongBreak: Math.max(1, parseInt(e.target.value) || 4)}))} min="1" />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
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

const IntervalTimerForm = ({
  onSave,
  initialData,
  onClose,
}: {
  onSave: (data: Omit<IntervalTimerSetting, 'id'> | IntervalTimerSetting) => void;
  initialData?: IntervalTimerSetting;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Omit<IntervalTimerSetting, 'id'>>(
    initialData ? 
    { ...initialData } : 
    { taskName: '', windowStart: '09:00', windowEnd: '17:00', repeatInterval: 60, isEnabled: true }
  );

  const handleChange = (field: keyof Omit<IntervalTimerSetting, 'id'>, value: string | number | boolean) => {
    if (field === 'repeatInterval') {
      setFormData(prev => ({ ...prev, [field]: Math.max(1, Number(value) || 1) }));
    } else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.taskName.trim()) {
      toast({ title: "Invalid Input", description: "Task name cannot be empty.", variant: "destructive" });
      return;
    }
    
    const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
    if (!timeRegex.test(formData.windowStart) || !timeRegex.test(formData.windowEnd)) {
      toast({ title: "Invalid Time Format", description: "Please enter valid start and end times in HH:MM format.", variant: "destructive" });
      return;
    }

    const startTotalMinutes = parseInt(formData.windowStart.split(':')[0]) * 60 + parseInt(formData.windowStart.split(':')[1]);
    const endTotalMinutes = parseInt(formData.windowEnd.split(':')[0]) * 60 + parseInt(formData.windowEnd.split(':')[1]);

    if (startTotalMinutes >= endTotalMinutes) {
        toast({ title: "Invalid Time Window", description: "Window start time must be before end time.", variant: "destructive"});
        return;
    }

    if (formData.repeatInterval < 1) {
      toast({ title: "Invalid Interval", description: "Repeat interval must be at least 1 minute.", variant: "destructive" });
      return;
    }
    
    onSave(initialData ? { ...formData, id: initialData.id } : formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="intervalTaskName">Task Name</Label>
        <Input id="intervalTaskName" value={formData.taskName} onChange={(e) => handleChange('taskName', e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="intervalWindowStart">Window Start (HH:MM)</Label>
          <Input id="intervalWindowStart" type="time" value={formData.windowStart} onChange={(e) => handleChange('windowStart', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="intervalWindowEnd">Window End (HH:MM)</Label>
          <Input id="intervalWindowEnd" type="time" value={formData.windowEnd} onChange={(e) => handleChange('windowEnd', e.target.value)} />
        </div>
      </div>
      <div>
        <Label htmlFor="intervalRepeat">Repeat Interval (min)</Label>
        <Input id="intervalRepeat" type="number" value={formData.repeatInterval} onChange={(e) => handleChange('repeatInterval', parseInt(e.target.value))} min="1" />
      </div>
      <div className="flex items-center space-x-2">
        <Switch id="intervalEnabled" checked={formData.isEnabled} onCheckedChange={(checked) => handleChange('isEnabled', checked)} />
        <Label htmlFor="intervalEnabled">Enable Timer</Label>
      </div>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        <Button type="submit">Save Timer</Button>
      </DialogFooter>
    </form>
  );
};

const formatTimeLeft = (totalSeconds: number | null): string => {
  if (totalSeconds === null || totalSeconds < 0) return '--:--';
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const IntervalTimerDisplayItem = ({ timer, onDelete, onEdit, onToggleEnable }: {
  timer: IntervalTimerSetting;
  onDelete: (id: string) => void;
  onEdit: (timer: IntervalTimerSetting) => void;
  onToggleEnable: (timer: IntervalTimerSetting) => void;
}) => {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isWithinWindow, setIsWithinWindow] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Calculating...");

  useEffect(() => {
    if (!timer.isEnabled) {
      setStatusMessage("Timer disabled.");
      setTimeLeft(null);
      setIsWithinWindow(false);
      return;
    }

    const calculateAndUpdateState = () => {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      const startParts = timer.windowStart.split(':').map(Number);
      const endParts = timer.windowEnd.split(':').map(Number);

      if (startParts.length !== 2 || endParts.length !== 2 || startParts.some(isNaN) || endParts.some(isNaN)) {
        setStatusMessage("Invalid time format.");
        setTimeLeft(null); setIsWithinWindow(false); return;
      }

      const windowStartTotalMinutes = startParts[0] * 60 + startParts[1];
      const windowEndTotalMinutes = endParts[0] * 60 + endParts[1];
      
      if (isNaN(windowStartTotalMinutes) || isNaN(windowEndTotalMinutes) || windowStartTotalMinutes >= windowEndTotalMinutes) {
        setStatusMessage("Invalid time window.");
        setTimeLeft(null); setIsWithinWindow(false); return;
      }

      const _isWithinWindow = currentTotalMinutes >= windowStartTotalMinutes && currentTotalMinutes <= windowEndTotalMinutes;
      setIsWithinWindow(_isWithinWindow);

      if (_isWithinWindow) {
        const lastNotifiedTimestampString = localStorage.getItem(`lastNotified_${timer.id}_timestamp`);
        let baseTimeForNextInterval: Date;

        if (lastNotifiedTimestampString) {
          baseTimeForNextInterval = new Date(parseInt(lastNotifiedTimestampString));
        } else {
          // If never notified, or for the first interval of the day
          baseTimeForNextInterval = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startParts[0], startParts[1]);
           // Adjust baseTime to the *start* of the current or next interval slot if needed
          while(baseTimeForNextInterval.getTime() + timer.repeatInterval * 60000 < now.getTime() && (baseTimeForNextInterval.getHours()*60 + baseTimeForNextInterval.getMinutes()) < windowEndTotalMinutes) {
            baseTimeForNextInterval.setTime(baseTimeForNextInterval.getTime() + timer.repeatInterval * 60000);
          }
          // If the loop pushed baseTimeForNextInterval past windowEndTotalMinutes or it was already past, handle it
          if ((baseTimeForNextInterval.getHours()*60 + baseTimeForNextInterval.getMinutes()) >= windowEndTotalMinutes && now.getTime() > baseTimeForNextInterval.getTime()) {
             setStatusMessage("Window ended for today.");
             setTimeLeft(null);
             return;
          }
        }
        
        let nextNotificationTime = new Date(baseTimeForNextInterval.getTime());
        if (now.getTime() > nextNotificationTime.getTime()) { // If current time is past the base, calculate next actual slot
             nextNotificationTime.setTime(baseTimeForNextInterval.getTime() + timer.repeatInterval * 60000);
        }


        // Ensure nextNotificationTime is not before windowStart for today, and not after windowEnd
         const nextNotificationTotalMinutes = nextNotificationTime.getHours() * 60 + nextNotificationTime.getMinutes();
        if (nextNotificationTotalMinutes < windowStartTotalMinutes && nextNotificationTime.toDateString() === now.toDateString()){
            // This case means last notification was from a previous day, or an error. Reset to window start.
            nextNotificationTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startParts[0], startParts[1]);
        }


        if (nextNotificationTotalMinutes > windowEndTotalMinutes && nextNotificationTime.toDateString() === now.toDateString()) {
            setStatusMessage("Window ended for today.");
            setTimeLeft(null);
            return;
        }
        
        const secondsUntilNext = Math.round((nextNotificationTime.getTime() - now.getTime()) / 1000);
        
        if (secondsUntilNext >= 0) {
          setTimeLeft(secondsUntilNext);
          setStatusMessage(`Next reminder in: ${formatTimeLeft(secondsUntilNext)}`);
        } else {
           // This means a reminder is due or just passed, manager will handle toast
           // For display, show "Reminder due" or prepare for next after manager updates localStorage
           setTimeLeft(0); 
           setStatusMessage("Reminder due!");
        }

      } else { // Not within window
        setTimeLeft(null);
        if (currentTotalMinutes < windowStartTotalMinutes) {
          setStatusMessage(`Timer inactive. Starts at ${timer.windowStart}.`);
        } else {
          setStatusMessage("Timer window ended for today.");
        }
      }
    };

    calculateAndUpdateState();
    const intervalId = setInterval(calculateAndUpdateState, 1000); 

    return () => clearInterval(intervalId);
  }, [timer, timer.isEnabled, timer.windowStart, timer.windowEnd, timer.repeatInterval]);


  return (
    <Card className="bg-background/50 border">
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium text-foreground">{timer.taskName}</CardTitle>
          <Switch
            checked={timer.isEnabled}
            onCheckedChange={() => onToggleEnable(timer)}
            aria-label={`Toggle timer ${timer.taskName}`}
          />
        </div>
        <CardDescription className="text-xs">
          {timer.isEnabled ? <BellRing className="inline h-3 w-3 mr-1 text-green-500" /> : <BellOff className="inline h-3 w-3 mr-1 text-red-500" />}
          Repeats every {timer.repeatInterval} min from {timer.windowStart} to {timer.windowEnd}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pb-3 min-h-[20px]"> {/* Added min-height */}
        <p className={`text-sm ${timeLeft !== null && timeLeft >= 0 && isWithinWindow && timer.isEnabled ? 'text-accent' : 'text-muted-foreground'}`}>
          {statusMessage}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pb-3 pt-0">
        <Button variant="ghost" size="icon" onClick={() => onEdit(timer)}>
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => onDelete(timer.id)} className="text-destructive hover:text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};


const IntervalTimersManager = () => {
  const { intervalTimerSettings, addIntervalTimerSetting, updateIntervalTimerSetting, deleteIntervalTimerSetting } = useApp();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingTimer, setEditingTimer] = useState<IntervalTimerSetting | undefined>(undefined);

  useEffect(() => {
    const timerId = setInterval(() => {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      intervalTimerSettings.forEach(setting => {
        if (!setting.isEnabled) return;

        const startParts = setting.windowStart.split(':').map(Number);
        const endParts = setting.windowEnd.split(':').map(Number);

        if (startParts.length !== 2 || endParts.length !== 2 || startParts.some(isNaN) || endParts.some(isNaN)) {
          return; 
        }

        const windowStartTotalMinutes = startParts[0] * 60 + startParts[1];
        const windowEndTotalMinutes = endParts[0] * 60 + endParts[1];
        
        if (isNaN(windowStartTotalMinutes) || isNaN(windowEndTotalMinutes) || windowStartTotalMinutes >= windowEndTotalMinutes) {
          return;
        }
        
        if (currentTotalMinutes >= windowStartTotalMinutes && currentTotalMinutes <= windowEndTotalMinutes) {
          const lastNotifiedTimestampKey = `lastNotified_${setting.id}_timestamp`;
          const lastNotifiedTimestamp = localStorage.getItem(lastNotifiedTimestampKey);
          
          let shouldNotify = false;
          if (!lastNotifiedTimestamp) { // First time, or cleared
            // Check if current time is at or after the first interval point within the window for today
             const firstIntervalPoint = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startParts[0], startParts[1]);
             if(now.getTime() >= firstIntervalPoint.getTime()){
                shouldNotify = (currentTotalMinutes - windowStartTotalMinutes) % setting.repeatInterval === 0;
             }
          } else {
            const lastNotifiedDate = new Date(parseInt(lastNotifiedTimestamp));
            const minutesSinceLastNotification = (now.getTime() - lastNotifiedDate.getTime()) / (1000 * 60);
            if (minutesSinceLastNotification >= setting.repeatInterval) {
                 // Ensure we are not notifying for past intervals if tab was closed, only for current or very recent ones.
                 // This check ensures we are roughly on an interval boundary from window start.
                if ((currentTotalMinutes - windowStartTotalMinutes) % setting.repeatInterval < 1) { // Check if current minute is an interval point
                    shouldNotify = true;
                }
            }
          }

          if (shouldNotify) {
            // Double check not to notify again in same minute if this runs too fast
            const lastNotifiedMinuteMarkerKey = `lastNotified_${setting.id}_minuteMarker`;
            const lastNotifiedMinuteMarker = localStorage.getItem(lastNotifiedMinuteMarkerKey);
            const currentMinuteMarker = `${now.getHours()}:${now.getMinutes()}`;

            if (lastNotifiedMinuteMarker !== currentMinuteMarker) {
                toast({ title: "Interval Reminder", description: setting.taskName });
                localStorage.setItem(lastNotifiedTimestampKey, now.getTime().toString());
                localStorage.setItem(lastNotifiedMinuteMarkerKey, currentMinuteMarker);
            }
          }
        }
      });
    }, 60000); // Check every minute for notifications

    return () => clearInterval(timerId);
  }, [intervalTimerSettings, toast]);

  const handleSaveTimer = (data: Omit<IntervalTimerSetting, 'id'> | IntervalTimerSetting) => {
    if ('id' in data) {
      updateIntervalTimerSetting(data as IntervalTimerSetting);
      toast({ title: "Interval Timer Updated!" });
    } else {
      addIntervalTimerSetting(data as Omit<IntervalTimerSetting, 'id'>);
      toast({ title: "Interval Timer Added!" });
    }
    setIsFormOpen(false);
    setEditingTimer(undefined);
  };

  const handleToggleEnable = (timer: IntervalTimerSetting) => {
    updateIntervalTimerSetting({ ...timer, isEnabled: !timer.isEnabled });
    toast({ title: timer.isEnabled ? "Timer Disabled" : "Timer Enabled", description: timer.taskName });
  };

  const handleDeleteTimer = (timerId: string) => {
    if (window.confirm("Are you sure you want to delete this interval timer?")) {
      deleteIntervalTimerSetting(timerId);
      toast({ title: "Interval Timer Deleted", variant: "destructive" });
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="font-headline text-xl text-primary">Interval Timers</CardTitle>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingTimer(undefined); }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => { setEditingTimer(undefined); setIsFormOpen(true); }}>
              <PlusCircle className="mr-2 h-4 w-4" /> Add Timer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTimer ? "Edit" : "Add New"} Interval Timer</DialogTitle>
            </DialogHeader>
            <IntervalTimerForm 
              onSave={handleSaveTimer} 
              initialData={editingTimer} 
              onClose={() => { setIsFormOpen(false); setEditingTimer(undefined); }}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4 py-6">
        {intervalTimerSettings.length === 0 && (
          <p className="text-muted-foreground text-center">No interval timers configured. Add one to get started!</p>
        )}
        {intervalTimerSettings.map(timer => (
          <IntervalTimerDisplayItem
            key={timer.id}
            timer={timer}
            onDelete={handleDeleteTimer}
            onEdit={(t) => { setEditingTimer(t); setIsFormOpen(true); }}
            onToggleEnable={handleToggleEnable}
          />
        ))}
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
        <IntervalTimersManager />
      </div>
    </AppWrapper>
  );
}


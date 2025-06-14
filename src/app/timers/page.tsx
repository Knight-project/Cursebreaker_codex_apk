
// src/app/timers/page.tsx
'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, Pause, RotateCcw, Settings2, PlusCircle, Trash2, Edit3, BellRing, BellOff, BarChartBig, Palette, Timer as TimerIcon, Save, ChevronDown } from 'lucide-react'; 
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import type { IntervalTimerSetting, CustomGraphSetting, CustomGraphVariable, TimeView, DailyGraphLog } from '@/lib/types';
import { CHART_COLOR_OPTIONS } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent } from '@/components/ui/chart';
import { CartesianGrid, XAxis, YAxis, Line, LineChart as RechartsLineChart, ResponsiveContainer } from 'recharts';
import { format, subDays, eachDayOfInterval, subMonths, eachMonthOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachWeekOfInterval, startOfYear, endOfYear, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/soundManager';


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
        // Optionally play tick sound for last few seconds
        // if (timeLeft <= 5 && timeLeft > 0) playSound('timerTick');
      }, 1000);
    } else if (isActive && timeLeft === 0) {
      setIsActive(false);
      if (mode === 'focus') {
        const expGained = appSettings.enableAnimations ? Math.floor(pomodoroSettings.focusDuration / 5) : 0;
        if (expGained > 0) {
          grantExp(expGained); // grantExp handles level up sound
          toast({ title: "Focus Session Complete!", description: `You earned ${expGained} EXP!` });
        } else {
           toast({ title: "Focus Session Complete!"});
        }
        playSound('pomodoroFocusStart'); // Or a specific "focus session end" sound
        
        const newSessionsCompleted = sessionsCompleted + 1;
        setSessionsCompleted(newSessionsCompleted);
        if (newSessionsCompleted % pomodoroSettings.sessionsBeforeLongBreak === 0) {
          setMode('longBreak');
          playSound('pomodoroBreakStart');
        } else {
          setMode('shortBreak');
          playSound('pomodoroBreakStart');
        }
      } else { 
        toast({ title: "Break Over!", description: "Time to focus again." });
        setMode('focus');
        playSound('pomodoroFocusStart');
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, timeLeft, mode, sessionsCompleted, pomodoroSettings, grantExp, toast, appSettings.enableAnimations]);

  const toggleTimer = () => {
    setIsActive(!isActive);
    playSound('buttonClick');
    if (!isActive && timeLeft > 0) { // Starting timer
        if(mode === 'focus') playSound('pomodoroFocusStart');
        else playSound('pomodoroBreakStart');
    }
  };

  const resetTimer = () => {
    setIsActive(false);
    setMode('focus');
    setTimeLeft(pomodoroSettings.focusDuration * 60);
    setSessionsCompleted(0);
    playSound('buttonClick');
  };
  
  const handleSettingsSave = () => {
    setPomodoroSettings(tempSettings);
    setIsSettingsOpen(false);
    setIsActive(false);
    setTimeLeft(calculateTimeForMode(mode)); 
    toast({ title: "Pomodoro settings updated!" });
    playSound('buttonClick');
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
        <CardTitle className="font-headline text-xl text-primary flex items-center">
            <TimerIcon className="mr-2 h-5 w-5"/> Pomodoro Timer
        </CardTitle>
         <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" onClick={() => playSound('buttonClick')}><Settings2 className="h-5 w-5" /></Button>
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
              <DialogClose asChild><Button variant="outline" onClick={() => playSound('buttonClick')}>Cancel</Button></DialogClose>
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

type IntervalFormData = Omit<IntervalTimerSetting, 'id' | 'startTime'>;

const IntervalTimerForm = ({
  onSave,
  initialData,
  onClose,
}: {
  onSave: (data: Omit<IntervalTimerSetting, 'id'>) => void;
  initialData?: IntervalTimerSetting;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<IntervalFormData>(
    initialData ? 
    { 
      taskName: initialData.taskName,
      timerMode: initialData.timerMode,
      windowStart: initialData.windowStart || '09:00',
      windowEnd: initialData.windowEnd || '17:00',
      durationHours: initialData.durationHours || 1,
      durationMinutes: initialData.durationMinutes || 0,
      repeatInterval: initialData.repeatInterval,
      isEnabled: initialData.isEnabled,
    } : 
    { 
      taskName: '', 
      timerMode: 'windowed', 
      windowStart: '09:00', 
      windowEnd: '17:00', 
      durationHours: 1, 
      durationMinutes: 0,
      repeatInterval: 60, 
      isEnabled: true 
    }
  );

  const handleChange = (field: keyof IntervalFormData, value: string | number | boolean | 'windowed' | 'duration') => {
     if (field === 'repeatInterval' || field === 'durationHours' || field === 'durationMinutes') {
      setFormData(prev => ({ ...prev, [field]: Math.max(0, Number(value) || 0) }));
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

    const saveData: Omit<IntervalTimerSetting, 'id'> = {
        taskName: formData.taskName,
        timerMode: formData.timerMode,
        repeatInterval: Math.max(1, formData.repeatInterval), 
        isEnabled: formData.isEnabled,
        startTime: initialData?.startTime 
    };

    if (formData.timerMode === 'windowed') {
        const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
        if (!formData.windowStart || !formData.windowEnd || !timeRegex.test(formData.windowStart) || !timeRegex.test(formData.windowEnd)) {
            toast({ title: "Invalid Time Format", description: "Please enter valid start and end times in HH:MM format for windowed mode.", variant: "destructive" });
            return;
        }
        const startTotalMinutes = parseInt(formData.windowStart.split(':')[0]) * 60 + parseInt(formData.windowStart.split(':')[1]);
        const endTotalMinutes = parseInt(formData.windowEnd.split(':')[0]) * 60 + parseInt(formData.windowEnd.split(':')[1]);

        if (startTotalMinutes >= endTotalMinutes) {
            toast({ title: "Invalid Time Window", description: "Window start time must be before end time.", variant: "destructive"});
            return;
        }
        saveData.windowStart = formData.windowStart;
        saveData.windowEnd = formData.windowEnd;
        saveData.durationHours = undefined;
        saveData.durationMinutes = undefined;
    } else { 
        if ((formData.durationHours || 0) === 0 && (formData.durationMinutes || 0) === 0) {
            toast({ title: "Invalid Duration", description: "Duration must be greater than 0 minutes.", variant: "destructive" });
            return;
        }
        saveData.durationHours = formData.durationHours;
        saveData.durationMinutes = formData.durationMinutes;
        saveData.windowStart = undefined;
        saveData.windowEnd = undefined;
    }
    
    onSave(saveData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 py-2">
      <div>
        <Label htmlFor="intervalTaskName">Task Name</Label>
        <Input id="intervalTaskName" value={formData.taskName} onChange={(e) => handleChange('taskName', e.target.value)} className="mt-1"/>
      </div>

      <div>
        <Label>Timer Mode</Label>
        <RadioGroup
            value={formData.timerMode}
            onValueChange={(value) => handleChange('timerMode', value as 'windowed' | 'duration')}
            className="mt-1 flex space-x-4"
        >
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="windowed" id="modeWindowed" onClick={() => playSound('buttonClick')}/>
                <Label htmlFor="modeWindowed">Windowed</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="duration" id="modeDuration" onClick={() => playSound('buttonClick')}/>
                <Label htmlFor="modeDuration">Duration</Label>
            </div>
        </RadioGroup>
      </div>

      {formData.timerMode === 'windowed' && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="intervalWindowStart">Window Start (HH:MM)</Label>
            <Input id="intervalWindowStart" type="time" value={formData.windowStart} onChange={(e) => handleChange('windowStart', e.target.value)} className="mt-1"/>
          </div>
          <div>
            <Label htmlFor="intervalWindowEnd">Window End (HH:MM)</Label>
            <Input id="intervalWindowEnd" type="time" value={formData.windowEnd} onChange={(e) => handleChange('windowEnd', e.target.value)} className="mt-1"/>
          </div>
        </div>
      )}

      {formData.timerMode === 'duration' && (
         <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="intervalDurationHours">Duration Hours</Label>
            <Input id="intervalDurationHours" type="number" value={formData.durationHours} onChange={(e) => handleChange('durationHours', parseInt(e.target.value))} min="0" className="mt-1"/>
          </div>
          <div>
            <Label htmlFor="intervalDurationMinutes">Duration Minutes</Label>
            <Input id="intervalDurationMinutes" type="number" value={formData.durationMinutes} onChange={(e) => handleChange('durationMinutes', parseInt(e.target.value))} min="0" className="mt-1"/>
          </div>
        </div>
      )}
      
      <div>
        <Label htmlFor="intervalRepeat">Repeat Interval (min)</Label>
        <Input id="intervalRepeat" type="number" value={formData.repeatInterval} onChange={(e) => handleChange('repeatInterval', parseInt(e.target.value))} min="1" className="mt-1"/>
      </div>

      <div className="flex items-center space-x-2 pt-2">
        <Switch id="intervalEnabled" checked={formData.isEnabled} onCheckedChange={(checked) => {handleChange('isEnabled', checked); playSound('buttonClick');}} />
        <Label htmlFor="intervalEnabled">Enable Timer</Label>
      </div>
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={() => {onClose(); playSound('buttonClick');}}>Cancel</Button>
        <Button type="submit" onClick={() => playSound('buttonClick')}>Save Timer</Button>
      </DialogFooter>
    </form>
  );
};

const formatTimeLeft = (totalSeconds: number | null): string => {
  if (totalSeconds === null || totalSeconds < 0) return '--:--';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  
  if (hours > 0) {
    return `${String(hours)}h ${String(minutes).padStart(2, '0')}m`;
  }
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


const IntervalTimerDisplayItem = ({ timer, onDelete, onEdit, onToggleEnable }: {
  timer: IntervalTimerSetting;
  onDelete: (id: string) => void;
  onEdit: (timer: IntervalTimerSetting) => void;
  onToggleEnable: (timer: IntervalTimerSetting, newEnabledState: boolean) => void;
}) => {
  const [timeLeftForNotification, setTimeLeftForNotification] = useState<number | null>(null);
  const [timeLeftForDuration, setTimeLeftForDuration] = useState<number | null>(null);
  const [statusMessage, setStatusMessage] = useState("Calculating...");

  useEffect(() => {
    if (!timer.isEnabled) {
      setStatusMessage("Timer disabled.");
      setTimeLeftForNotification(null);
      setTimeLeftForDuration(null);
      return;
    }

    const calculateAndUpdateState = () => {
      const now = new Date();
      const currentTotalMinutes = now.getHours() * 60 + now.getMinutes();

      if (timer.timerMode === 'windowed') {
        const startParts = timer.windowStart?.split(':').map(Number);
        const endParts = timer.windowEnd?.split(':').map(Number);

        if (!startParts || startParts.length !== 2 || !endParts || endParts.length !== 2 || startParts.some(isNaN) || endParts.some(isNaN)) {
          setStatusMessage("Invalid time format for window.");
          setTimeLeftForNotification(null); return;
        }
        const windowStartTotalMinutes = startParts[0] * 60 + startParts[1];
        const windowEndTotalMinutes = endParts[0] * 60 + endParts[1];
        
        if (windowStartTotalMinutes >= windowEndTotalMinutes) {
          setStatusMessage("Invalid time window.");
          setTimeLeftForNotification(null); return;
        }

        const isWithinWindow = currentTotalMinutes >= windowStartTotalMinutes && currentTotalMinutes < windowEndTotalMinutes;

        if (isWithinWindow) {
          const lastNotifiedTimestampString = localStorage.getItem(`lastNotified_${timer.id}_timestamp`);
          let baseTimeForNextInterval = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startParts[0], startParts[1]);
          
          if (lastNotifiedTimestampString) {
            const lastNotifiedDate = new Date(parseInt(lastNotifiedTimestampString));
            if (isValid(lastNotifiedDate) && lastNotifiedDate.getTime() >= baseTimeForNextInterval.getTime() && lastNotifiedDate.getTime() < new Date(now.getFullYear(), now.getMonth(), now.getDate(), endParts[0], endParts[1]).getTime() ) {
                 baseTimeForNextInterval = lastNotifiedDate;
            }
          }

          let nextNotificationTime = new Date(baseTimeForNextInterval.getTime());
          while (nextNotificationTime.getTime() <= now.getTime() || (nextNotificationTime.getHours()*60 + nextNotificationTime.getMinutes()) < windowStartTotalMinutes) {
            nextNotificationTime.setTime(nextNotificationTime.getTime() + timer.repeatInterval * 60000);
          }
          
          const nextNotificationTotalMinutes = nextNotificationTime.getHours() * 60 + nextNotificationTime.getMinutes();
          if (nextNotificationTotalMinutes >= windowEndTotalMinutes && nextNotificationTime.toDateString() === now.toDateString()) {
            setStatusMessage("Window ended for today.");
            setTimeLeftForNotification(null); return;
          }

          const secondsUntilNext = Math.max(0, Math.round((nextNotificationTime.getTime() - now.getTime()) / 1000));
          setTimeLeftForNotification(secondsUntilNext);
          setStatusMessage(`Next reminder in: ${formatTimeLeft(secondsUntilNext)}`);
        } else {
          setTimeLeftForNotification(null);
          if (currentTotalMinutes < windowStartTotalMinutes) {
            setStatusMessage(`Inactive. Window starts at ${timer.windowStart}.`);
          } else {
            setStatusMessage("Window ended for today.");
          }
        }
      } else { 
        if (!timer.startTime) {
          setStatusMessage("Timer enabled, awaiting start...");
          setTimeLeftForNotification(null);
          setTimeLeftForDuration(null);
          return;
        }

        const startDate = new Date(timer.startTime);
        const totalDurationSeconds = (timer.durationHours || 0) * 3600 + (timer.durationMinutes || 0) * 60;
        const endDate = new Date(startDate.getTime() + totalDurationSeconds * 1000);

        if (now.getTime() >= endDate.getTime()) {
          setStatusMessage("Duration complete.");
          setTimeLeftForNotification(null);
          setTimeLeftForDuration(0);
          return;
        }

        const secondsUntilDurationEnd = Math.max(0, Math.round((endDate.getTime() - now.getTime()) / 1000));
        setTimeLeftForDuration(secondsUntilDurationEnd);

        const lastNotifiedTimestampString = localStorage.getItem(`lastNotified_${timer.id}_timestamp`);
        let baseTimeForNotification = startDate;
        if (lastNotifiedTimestampString) {
            const lastNotifiedDate = new Date(parseInt(lastNotifiedTimestampString));
            if(isValid(lastNotifiedDate) && lastNotifiedDate.getTime() >= startDate.getTime() && lastNotifiedDate.getTime() < endDate.getTime()){
                 baseTimeForNotification = lastNotifiedDate;
            }
        }
        
        let nextNotificationTime = new Date(baseTimeForNotification.getTime());
         while(nextNotificationTime.getTime() <= now.getTime()){
            nextNotificationTime.setTime(nextNotificationTime.getTime() + timer.repeatInterval * 60000);
         }

        if (nextNotificationTime.getTime() >= endDate.getTime()) {
           setTimeLeftForNotification(null); 
           setStatusMessage(`Duration ending in: ${formatTimeLeft(secondsUntilDurationEnd)}`);
        } else {
          const secondsUntilNextNotification = Math.max(0, Math.round((nextNotificationTime.getTime() - now.getTime()) / 1000));
          setTimeLeftForNotification(secondsUntilNextNotification);
          setStatusMessage(`Next: ${formatTimeLeft(secondsUntilNextNotification)}. Total left: ${formatTimeLeft(secondsUntilDurationEnd)}`);
        }
      }
    };

    calculateAndUpdateState(); 
    const intervalId = setInterval(calculateAndUpdateState, 1000);
    return () => clearInterval(intervalId);
  }, [timer]);


  const getDescription = () => {
    const enabledIcon = timer.isEnabled ? <BellRing className="inline h-3 w-3 mr-1 text-green-500" /> : <BellOff className="inline h-3 w-3 mr-1 text-red-500" />;
    if (timer.timerMode === 'windowed') {
      return <>{enabledIcon} Repeats every {timer.repeatInterval} min from {timer.windowStart} to {timer.windowEnd}</>;
    } else {
      const durationParts = [];
      if (timer.durationHours && timer.durationHours > 0) durationParts.push(`${timer.durationHours}h`);
      if (timer.durationMinutes && timer.durationMinutes > 0) durationParts.push(`${timer.durationMinutes}m`);
      const durationStr = durationParts.join(' ') || 'N/A';
      return <>{enabledIcon} Runs for {durationStr}, repeats every {timer.repeatInterval} min.</>;
    }
  };


  return (
    <Card className="bg-background/50 border">
      <CardHeader className="pb-2 pt-4">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium text-foreground">{timer.taskName}</CardTitle>
          <Switch
            checked={timer.isEnabled}
            onCheckedChange={(checked) => {onToggleEnable(timer, checked); playSound('buttonClick');}}
            aria-label={`Toggle timer ${timer.taskName}`}
          />
        </div>
        <CardDescription className="text-xs h-6 flex items-center"> 
          {getDescription()}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-2 pb-3 min-h-[20px]">
        <p className={`text-sm ${ (timeLeftForNotification !== null && timeLeftForNotification >= 0 && timer.isEnabled) || (timeLeftForDuration !==null && timeLeftForDuration > 0 && timer.isEnabled && timer.timerMode==='duration') ? 'text-accent' : 'text-muted-foreground'}`}>
          {statusMessage}
        </p>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2 pb-3 pt-0">
        <Button variant="ghost" size="icon" onClick={() => {onEdit(timer); playSound('buttonClick');}}>
          <Edit3 className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => {onDelete(timer.id); playSound('buttonClick');}} className="text-destructive hover:text-destructive">
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

        let shouldNotify = false;
        const lastNotifiedTimestampKey = `lastNotified_${setting.id}_timestamp`;
        const lastNotifiedMinuteMarkerKey = `lastNotified_${setting.id}_minuteMarker`;
        const lastNotifiedTimestamp = localStorage.getItem(lastNotifiedTimestampKey);
        const currentMinuteMarker = `${now.getHours()}:${now.getMinutes()}`;

        if (setting.timerMode === 'windowed') {
            const startParts = setting.windowStart?.split(':').map(Number);
            const endParts = setting.windowEnd?.split(':').map(Number);

            if (!startParts || startParts.length !== 2 || !endParts || endParts.length !== 2 || startParts.some(isNaN) || endParts.some(isNaN)) return;
            
            const windowStartTotalMinutes = startParts[0] * 60 + startParts[1];
            const windowEndTotalMinutes = endParts[0] * 60 + endParts[1];

            if (windowStartTotalMinutes >= windowEndTotalMinutes || currentTotalMinutes < windowStartTotalMinutes || currentTotalMinutes >= windowEndTotalMinutes) return;

            let baseTimeForNotificationCheck = new Date(now.getFullYear(), now.getMonth(), now.getDate(), startParts[0], startParts[1]);
             if (lastNotifiedTimestamp) {
                 const lastNotifiedDate = new Date(parseInt(lastNotifiedTimestamp));
                 if (isValid(lastNotifiedDate) && lastNotifiedDate.getTime() >= baseTimeForNotificationCheck.getTime() && (lastNotifiedDate.getHours()*60 + lastNotifiedDate.getMinutes()) < windowEndTotalMinutes) {
                    baseTimeForNotificationCheck = lastNotifiedDate;
                 }
            }
            
            let nextPotentialNotificationTime = new Date(baseTimeForNotificationCheck.getTime());
            while(nextPotentialNotificationTime.getTime() <= now.getTime()){
                 nextPotentialNotificationTime.setTime(nextPotentialNotificationTime.getTime() + setting.repeatInterval * 60000);
            }
            if(nextPotentialNotificationTime.getHours() === now.getHours() && nextPotentialNotificationTime.getMinutes() === now.getMinutes()){
                 shouldNotify = true;
            }


        } else { 
            if (!setting.startTime || (!setting.durationHours && !setting.durationMinutes)) return;
            
            const startDate = new Date(setting.startTime);
            if(!isValid(startDate)) return;

            const totalDurationSeconds = (setting.durationHours || 0) * 3600 + (setting.durationMinutes || 0) * 60;
            const endDate = new Date(startDate.getTime() + totalDurationSeconds * 1000);

            if (now.getTime() >= endDate.getTime()) {
                updateIntervalTimerSetting({ ...setting, isEnabled: false, startTime: undefined });
                toast({ title: "Timer Finished", description: `${setting.taskName} duration has completed.` });
                playSound('notification'); // Or a specific "timer end" sound
                localStorage.removeItem(lastNotifiedTimestampKey); 
                localStorage.removeItem(lastNotifiedMinuteMarkerKey);
                return; 
            }
            
            let baseTimeForNotificationCheck = startDate;
            if(lastNotifiedTimestamp){
                const lastNotifiedDate = new Date(parseInt(lastNotifiedTimestamp));
                 if(isValid(lastNotifiedDate) && lastNotifiedDate.getTime() >= startDate.getTime() && lastNotifiedDate.getTime() < endDate.getTime()){
                    baseTimeForNotificationCheck = lastNotifiedDate;
                }
            }

            let nextPotentialNotificationTime = new Date(baseTimeForNotificationCheck.getTime());
             while(nextPotentialNotificationTime.getTime() <= now.getTime()){
                 nextPotentialNotificationTime.setTime(nextPotentialNotificationTime.getTime() + setting.repeatInterval * 60000);
            }

            if(nextPotentialNotificationTime.getTime() < endDate.getTime() && nextPotentialNotificationTime.getHours() === now.getHours() && nextPotentialNotificationTime.getMinutes() === now.getMinutes()){
                shouldNotify = true;
            }
        }

        if (shouldNotify) {
          const lastNotifiedMinuteMarker = localStorage.getItem(lastNotifiedMinuteMarkerKey);
          if (lastNotifiedMinuteMarker !== currentMinuteMarker) {
              toast({ title: "Interval Reminder", description: setting.taskName });
              playSound('notification');
              localStorage.setItem(lastNotifiedTimestampKey, now.getTime().toString());
              localStorage.setItem(lastNotifiedMinuteMarkerKey, currentMinuteMarker);
          }
        }
      });
    }, 60000); 

    return () => clearInterval(timerId);
  }, [intervalTimerSettings, toast, updateIntervalTimerSetting]);

  const handleSaveTimer = (data: Omit<IntervalTimerSetting, 'id'>) => {
     const saveData = { ...data };
     if (saveData.timerMode === 'duration' && saveData.isEnabled && !saveData.startTime && !editingTimer?.startTime){ 
        saveData.startTime = new Date().toISOString();
     } else if (saveData.timerMode === 'windowed'){
        saveData.startTime = undefined; 
     }


    if (editingTimer) {
      updateIntervalTimerSetting({ ...saveData, id: editingTimer.id } as IntervalTimerSetting);
      toast({ title: "Interval Timer Updated!" });
    } else {
      addIntervalTimerSetting(saveData);
      toast({ title: "Interval Timer Added!" });
    }
    setIsFormOpen(false);
    setEditingTimer(undefined);
  };

  const handleToggleEnable = (timer: IntervalTimerSetting, newEnabledState: boolean) => {
    const updatedTimer = { ...timer, isEnabled: newEnabledState };
    if (timer.timerMode === 'duration') {
      if (newEnabledState && !timer.startTime) { 
         const existingTimer = intervalTimerSettings.find(t => t.id === timer.id);
         if (!existingTimer?.startTime) {
            updatedTimer.startTime = new Date().toISOString();
         } else {
            updatedTimer.startTime = existingTimer.startTime; 
         }
      } else if (!newEnabledState) { 
        localStorage.removeItem(`lastNotified_${timer.id}_timestamp`); 
        localStorage.removeItem(`lastNotified_${timer.id}_minuteMarker`);
      }
    }
    updateIntervalTimerSetting(updatedTimer);
    toast({ title: newEnabledState ? "Timer Enabled" : "Timer Disabled", description: timer.taskName });
  };

  const handleDeleteTimer = (timerId: string) => {
    if (window.confirm("Are you sure you want to delete this interval timer?")) {
      deleteIntervalTimerSetting(timerId);
      localStorage.removeItem(`lastNotified_${timerId}_timestamp`); 
      localStorage.removeItem(`lastNotified_${timerId}_minuteMarker`);
      toast({ title: "Interval Timer Deleted", variant: "destructive" });
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="flex flex-row items-baseline justify-between">
        <CardTitle className="font-headline text-xl text-primary flex items-center">
            <BellRing className="mr-2 h-5 w-5"/>Interval Timers
        </CardTitle>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingTimer(undefined); }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => { setEditingTimer(undefined); setIsFormOpen(true); playSound('buttonClick');}}>
              <PlusCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Timer</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingTimer ? "Edit" : "Add New"} Interval Timer</DialogTitle>
            </DialogHeader>
            <IntervalTimerForm 
              onSave={handleSaveTimer} 
              initialData={editingTimer} 
              onClose={() => { setIsFormOpen(false); setEditingTimer(undefined); playSound('buttonClick'); }}
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
            onEdit={(t) => { setEditingTimer(t); setIsFormOpen(true); playSound('buttonClick'); }}
            onToggleEnable={handleToggleEnable}
          />
        ))}
      </CardContent>
    </Card>
  );
};

type CustomGraphFormData = Omit<CustomGraphSetting, 'id' | 'variables' | 'data'> & {
  variables: Array<Omit<CustomGraphVariable, 'id'> & { tempId: string }>;
};

const CustomGraphForm = ({
  onSave,
  initialData,
  onClose,
}: {
  onSave: (data: Omit<CustomGraphSetting, 'id' | 'data'>) => void;
  initialData?: CustomGraphSetting;
  onClose: () => void;
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<CustomGraphFormData>(
    initialData ? 
    { 
      name: initialData.name,
      timeView: initialData.timeView,
      variables: initialData.variables.map(v => ({ ...v, tempId: v.id })), 
    } : 
    { 
      name: '', 
      timeView: 'monthly',
      variables: [{ tempId: Date.now().toString(), name: 'Variable 1', color: CHART_COLOR_OPTIONS[0].value }]
    }
  );

  const handleGraphChange = (field: keyof Omit<CustomGraphFormData, 'variables'>, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleVariableChange = (tempId: string, field: keyof Omit<CustomGraphVariable, 'id'>, value: string) => {
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.map(v => v.tempId === tempId ? { ...v, [field]: value } : v)
    }));
  };

  const addVariable = () => {
    playSound('buttonClick');
    const nextColorIndex = formData.variables.length % CHART_COLOR_OPTIONS.length;
    setFormData(prev => ({
      ...prev,
      variables: [...prev.variables, { 
        tempId: Date.now().toString() + Math.random(), 
        name: `Variable ${prev.variables.length + 1}`, 
        color: CHART_COLOR_OPTIONS[nextColorIndex].value 
      }]
    }));
  };

  const removeVariable = (tempId: string) => {
    playSound('buttonClick');
    if (formData.variables.length <= 1) {
      toast({ title: "Cannot Remove", description: "A graph must have at least one variable.", variant: "destructive" });
      return;
    }
    setFormData(prev => ({
      ...prev,
      variables: prev.variables.filter(v => v.tempId !== tempId)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Invalid Input", description: "Graph name cannot be empty.", variant: "destructive" });
      return;
    }
    if (formData.variables.some(v => !v.name.trim())) {
      toast({ title: "Invalid Input", description: "Variable names cannot be empty.", variant: "destructive" });
      return;
    }

    const finalVariables = formData.variables.map(({ tempId, ...rest}) => {
      const originalVar = initialData?.variables.find(iv => iv.id === tempId);
      return {
        id: originalVar ? originalVar.id : tempId, 
        name: rest.name,
        color: rest.color,
      };
    });


    onSave({ name: formData.name, timeView: formData.timeView, variables: finalVariables });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-2 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Label htmlFor="graphName">Graph Name</Label>
        <Input id="graphName" value={formData.name} onChange={(e) => handleGraphChange('name', e.target.value)} className="mt-1"/>
      </div>
      <div>
        <Label htmlFor="graphTimeView">Default Time View</Label>
        <Select value={formData.timeView} onValueChange={(value) => handleGraphChange('timeView', value as TimeView)}>
          <SelectTrigger id="graphTimeView" className="mt-1" onClick={() => playSound('buttonClick')}>
            <SelectValue placeholder="Select time view" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly" onClick={() => playSound('buttonClick')}>Weekly</SelectItem>
            <SelectItem value="monthly" onClick={() => playSound('buttonClick')}>Monthly</SelectItem>
            <SelectItem value="yearly" onClick={() => playSound('buttonClick')}>Yearly</SelectItem>
            <SelectItem value="alltime" onClick={() => playSound('buttonClick')}>All Time (Max 2 Years)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-3">
        <Label>Variables</Label>
        {formData.variables.map((variable, index) => (
          <Card key={variable.tempId} className="p-3 bg-background/70">
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm font-medium">Variable {index + 1}</p>
              {formData.variables.length > 1 && (
                <Button type="button" variant="ghost" size="icon" onClick={() => removeVariable(variable.tempId)} className="h-6 w-6 text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
            <div className="space-y-2">
              <div>
                <Label htmlFor={`varName-${variable.tempId}`}>Name</Label>
                <Input id={`varName-${variable.tempId}`} value={variable.name} onChange={(e) => handleVariableChange(variable.tempId, 'name', e.target.value)} />
              </div>
              <div>
                <Label htmlFor={`varColor-${variable.tempId}`}>Color</Label>
                <Select value={variable.color} onValueChange={(value) => handleVariableChange(variable.tempId, 'color', value)}>
                  <SelectTrigger id={`varColor-${variable.tempId}`} onClick={() => playSound('buttonClick')}>
                    <SelectValue placeholder="Select color" />
                  </SelectTrigger>
                  <SelectContent>
                    {CHART_COLOR_OPTIONS.map(opt => (
                      <SelectItem key={opt.key} value={opt.value} onClick={() => playSound('buttonClick')}>
                        <div className="flex items-center">
                           <Palette className="mr-2 h-4 w-4" style={{ color: opt.value }} />
                           {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>
        ))}
        <Button type="button" variant="outline" onClick={addVariable} className="w-full">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Variable
        </Button>
      </div>
      <DialogFooter className="pt-4">
        <Button type="button" variant="outline" onClick={() => {onClose(); playSound('buttonClick');}}>Cancel</Button>
        <Button type="submit" onClick={() => playSound('buttonClick')}>Save Graph</Button>
      </DialogFooter>
    </form>
  );
};

const CustomGraphDisplayItem = ({ graph, onDelete, onEdit }: {
  graph: CustomGraphSetting;
  onDelete: (id: string) => void;
  onEdit: (graph: CustomGraphSetting) => void;
}) => {
  const { customGraphDailyLogs, logCustomGraphData } = useApp();
  const [todayInputs, setTodayInputs] = useState<{[variableId: string]: string}>({});
  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const [isLoggingOpen, setIsLoggingOpen] = useState(false);
  const [currentDisplayTimeView, setCurrentDisplayTimeView] = useState<TimeView>(graph.timeView);


  useEffect(() => {
    const initialInputs: {[variableId: string]: string} = {};
    graph.variables.forEach(variable => {
      const dailyLog = customGraphDailyLogs[graph.id]?.[variable.id];
      if (dailyLog && dailyLog.date === todayStr) {
        initialInputs[variable.id] = dailyLog.value.toString();
      } else {
        initialInputs[variable.id] = graph.data?.[variable.id]?.[todayStr]?.toString() || '';
      }
    });
    setTodayInputs(initialInputs);
  }, [customGraphDailyLogs, graph, todayStr]);


  const handleTodayInputChange = (variableId: string, value: string) => {
    setTodayInputs(prev => ({...prev, [variableId]: value}));
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      logCustomGraphData(graph.id, variableId, numValue);
    } else if (value === "") {
       logCustomGraphData(graph.id, variableId, 0); 
    }
  };


  const chartConfig = useMemo(() => {
    const config: import("@/components/ui/chart").ChartConfig = {};
    graph.variables.forEach((variable) => {
      config[variable.id] = { 
        label: variable.name, 
        color: variable.color 
      };
    });
    return config;
  }, [graph.variables]);

  const chartData = useMemo(() => {
    let dates: Date[] = [];
    const now = new Date();
    switch (currentDisplayTimeView) { 
      case 'weekly':
        dates = eachDayOfInterval({ start: subDays(now, 6), end: now });
        break;
      case 'monthly':
        dates = eachDayOfInterval({ start: subDays(now, 29), end: now });
        break;
      case 'yearly':
        dates = eachMonthOfInterval({ start: subMonths(now, 11), end: now });
        break;
      case 'alltime': 
        dates = eachMonthOfInterval({ start: subMonths(now, 23), end: now });
        break;
    }

    return dates.map(date => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const displayDate = currentDisplayTimeView === 'weekly' || currentDisplayTimeView === 'monthly' ? format(date, 'MMM d') : format(date, 'MMM yyyy');
      const entry: any = { date: displayDate };
      
      graph.variables.forEach(variable => {
        const dailyLog = customGraphDailyLogs[graph.id]?.[variable.id];
        if (dailyLog && dailyLog.date === dateStr) {
          entry[variable.id] = dailyLog.value;
        } else {
          entry[variable.id] = graph.data?.[variable.id]?.[dateStr] || 0;
        }
      });
      return entry;
    });
  }, [graph, customGraphDailyLogs, currentDisplayTimeView]); 

  const timeViewOptions: {value: TimeView, label: string}[] = [
    { value: 'weekly', label: 'Weekly View' },
    { value: 'monthly', label: 'Monthly View' },
    { value: 'yearly', label: 'Yearly View' },
    { value: 'alltime', label: 'All Time View' },
  ];

  return (
    <Card className="bg-background/50 border">
      <CardHeader className="pb-3 pt-4">
        <div className="flex justify-between items-center mb-1">
          <CardTitle className="text-lg font-medium text-foreground">{graph.name}</CardTitle>
           <div className="flex space-x-1">
            <Button variant="ghost" size="icon" onClick={() => {onEdit(graph); playSound('buttonClick');}} className="h-7 w-7">
              <Edit3 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => {onDelete(graph.id); playSound('buttonClick');}} className="text-destructive hover:text-destructive h-7 w-7">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
         <Select value={currentDisplayTimeView} onValueChange={(value: TimeView) => {setCurrentDisplayTimeView(value); playSound('buttonClick');}}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-input/30 focus:bg-input">
              <SelectValue placeholder="Select time view" />
            </SelectTrigger>
            <SelectContent>
              {timeViewOptions.map(opt => (
                <SelectItem key={opt.value} value={opt.value} className="text-xs" onClick={() => playSound('buttonClick')}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
      </CardHeader>
      <CardContent className="pt-2 pb-4 h-[300px]">
        {chartData.length > 0 ? (
            <ChartContainer config={chartConfig} className="h-full w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsLineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tickMargin={8} fontSize={10} />
                  <YAxis 
                    axisLine={{ stroke: 'hsl(var(--border))' }} 
                    tickLine={{ stroke: 'hsl(var(--border))' }} 
                    tickMargin={8} 
                    fontSize={10}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <ChartLegend content={<ChartLegendContent />} />
                  {graph.variables.map(variable => (
                    <Line
                      key={variable.id}
                      type="monotone"
                      dataKey={variable.id}
                      stroke={variable.color} 
                      strokeWidth={2}
                      dot={{ r: 2, fill: variable.color }}
                      activeDot={{ r: 4 }}
                      name={variable.name}
                    />
                  ))}
                </RechartsLineChart>
              </ResponsiveContainer>
            </ChartContainer>
          ) : (
            <p className="text-muted-foreground text-center py-4">Not enough data to display graph.</p>
          )}
      </CardContent>
      <CardFooter className="flex flex-col space-y-3 items-start p-4 pt-0">
        <div 
          onClick={() => {setIsLoggingOpen(!isLoggingOpen); playSound('buttonClick');}} 
          className="flex items-center justify-between w-full cursor-pointer hover:bg-muted/50 p-2 rounded-md transition-colors"
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') setIsLoggingOpen(!isLoggingOpen); }}
          aria-expanded={isLoggingOpen}
          aria-controls={`log-section-${graph.id}`}
        >
          <Label htmlFor={`log-section-${graph.id}`} className="text-sm font-medium cursor-pointer">Log Today's Values ({format(new Date(), 'MMM d, yyyy')}):</Label>
          <ChevronDown className={cn("h-4 w-4 transition-transform", isLoggingOpen && "rotate-180")} />
        </div>
        {isLoggingOpen && (
          <div id={`log-section-${graph.id}`} className="w-full pl-2 pr-2 space-y-2 pt-1">
            {graph.variables.map(variable => (
              <div key={variable.id} className="flex items-center space-x-2 w-full mb-1 last:mb-0">
                <Label htmlFor={`input-${graph.id}-${variable.id}`} className="text-sm min-w-[100px] md:min-w-[120px] truncate" title={variable.name}>
                  {variable.name}:
                </Label>
                <Input
                  id={`input-${graph.id}-${variable.id}`}
                  type="number"
                  value={todayInputs[variable.id] || ""}
                  onChange={(e) => handleTodayInputChange(variable.id, e.target.value)}
                  placeholder="Enter value"
                  className="h-9 text-sm flex-grow"
                />
              </div>
            ))}
          </div>
        )}
      </CardFooter>
    </Card>
  );
};


const GraphsManager = () => { 
  const { customGraphs, addCustomGraph, updateCustomGraph, deleteCustomGraph, commitStaleDailyLogs } = useApp();
  const { toast } = useToast();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingGraph, setEditingGraph] = useState<CustomGraphSetting | undefined>(undefined);

  useEffect(() => {
    commitStaleDailyLogs(); 
  }, [customGraphs, commitStaleDailyLogs]);


  const handleSaveGraph = (data: Omit<CustomGraphSetting, 'id' | 'data'>) => {
    if (editingGraph) {
      const existingData = customGraphs.find(g => g.id === editingGraph.id)?.data || {};
      updateCustomGraph({ ...data, id: editingGraph.id, data: existingData });
      toast({ title: "Graph Updated!" });
    } else {
      addCustomGraph(data); 
      toast({ title: "Graph Added!" });
    }
    setIsFormOpen(false);
    setEditingGraph(undefined);
  };
  
  const handleDeleteGraph = (graphId: string) => {
    if (window.confirm("Are you sure you want to delete this graph? This will also remove its logged data.")) {
      deleteCustomGraph(graphId);
      toast({ title: "Graph Deleted", variant: "destructive" });
    }
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
      <CardHeader className="flex flex-row items-baseline justify-between">
        <CardTitle className="font-headline text-xl text-primary flex items-center">
          <BarChartBig className="mr-2 h-5 w-5"/> Graphs 
        </CardTitle>
        <Dialog open={isFormOpen} onOpenChange={(open) => { setIsFormOpen(open); if (!open) setEditingGraph(undefined); }}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" onClick={() => { setEditingGraph(undefined); setIsFormOpen(true); playSound('buttonClick'); }}>
              <PlusCircle className="h-4 w-4 sm:mr-2" />
              <span className="hidden sm:inline">Add Graph</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md md:max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingGraph ? "Edit" : "Create New"} Graph</DialogTitle>
            </DialogHeader>
            <CustomGraphForm 
              onSave={handleSaveGraph} 
              initialData={editingGraph} 
              onClose={() => { setIsFormOpen(false); setEditingGraph(undefined); playSound('buttonClick');}}
            />
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-4 py-6">
        {customGraphs.length === 0 && (
          <p className="text-muted-foreground text-center">No graphs configured. Create one to track your progress!</p>
        )}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {customGraphs.map(graph => (
            <CustomGraphDisplayItem
              key={graph.id}
              graph={graph}
              onDelete={handleDeleteGraph}
              onEdit={(g) => { setEditingGraph(g); setIsFormOpen(true); playSound('buttonClick'); }}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}


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
        <GraphsManager /> 
      </div>
    </AppWrapper>
  );
}


'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import { PlusCircle, BarChart2, User, BookOpen, CalendarDays, Repeat, AlertTriangle, Edit2 } from 'lucide-react';
import React, { useEffect, useState, useRef, type ChangeEvent, type KeyboardEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, TaskType, Attribute } from '@/lib/types';
import { ATTRIBUTES_LIST, REMINDER_OPTIONS } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import RankDisplay from '@/components/shared/RankDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format, parseISO, startOfDay, isBefore } from 'date-fns';
import { Switch } from '@/components/ui/switch';
import { playSound } from '@/lib/soundManager';


const AddTaskForm = ({
  onTaskAdd,
  currentTaskType
}: {
  onTaskAdd: () => void;
  currentTaskType: TaskType;
}) => {
  const [taskName, setTaskName] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Moderate' | 'Hard'>('Moderate');
  const [attribute, setAttribute] = useState<Attribute>('None');
  
  const [scheduledDate, setScheduledDate] = useState<Date | undefined>(new Date());
  const [isAllDay, setIsAllDay] = useState(true);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [reminderOffsetMinutes, setReminderOffsetMinutes] = useState<number>(0);

  const [repeatIntervalDays, setRepeatIntervalDays] = useState<number>(1);

  const { addTask } = useApp();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      toast({ title: "Error", description: "Task name cannot be empty.", variant: "destructive" });
      return;
    }

    const baseTaskData = {
      name: taskName,
      difficulty,
      attribute,
      taskType: currentTaskType,
    };

    if (currentTaskType === 'event') {
      if (!scheduledDate) {
        toast({ title: "Error", description: "Please select a date for events.", variant: "destructive" });
        return;
      }
      if (!isAllDay) {
        if (!startTime) {
            toast({ title: "Error", description: "Please enter a start time for timed events.", variant: "destructive" });
            return;
        }
        if (endTime && startTime >= endTime) {
            toast({ title: "Error", description: "End time must be after start time.", variant: "destructive"});
            return;
        }
      }
      addTask({
        ...baseTaskData,
        scheduledDate: format(scheduledDate, 'yyyy-MM-dd'),
        isAllDay,
        startTime: !isAllDay ? startTime : undefined,
        endTime: !isAllDay && endTime ? endTime : undefined,
        reminderOffsetMinutes: !isAllDay && reminderOffsetMinutes ? reminderOffsetMinutes : undefined,
      });
    } else if (currentTaskType === 'ritual') {
      if (repeatIntervalDays < 1) {
        toast({ title: "Error", description: "Repeat interval must be at least 1 day.", variant: "destructive"});
        return;
      }
      addTask({ ...baseTaskData, repeatIntervalDays });
    } else { 
      addTask(baseTaskData);
    }

    setTaskName('');
    setDifficulty('Moderate');
    setAttribute('None');
    setScheduledDate(new Date());
    setIsAllDay(true);
    setStartTime('09:00');
    setEndTime('17:00');
    setReminderOffsetMinutes(0);
    setRepeatIntervalDays(1);
    
    toast({ title: "Success", description: `${currentTaskType.charAt(0).toUpperCase() + currentTaskType.slice(1)} added!` });
    onTaskAdd(); 
  };
  
  const getTaskTypeSpecificPlaceholder = () => {
    switch(currentTaskType) {
      case 'daily': return "e.g., Review project notes";
      case 'ritual': return "e.g., Morning Meditation";
      case 'event': return "e.g., Team Sync Meeting";
      default: return "Enter task name";
    }
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
      <div>
        <Label htmlFor="taskName" className="font-headline">Name</Label>
        <Input
          id="taskName"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder={getTaskTypeSpecificPlaceholder()}
          className="mt-1 bg-input/50 focus:bg-input"
        />
      </div>

      {currentTaskType === 'event' && (
        <>
          <div>
            <Label htmlFor="scheduledDate" className="font-headline">Scheduled Date</Label>
            <Calendar
              mode="single"
              selected={scheduledDate}
              onSelect={setScheduledDate}
              className="rounded-md mt-1 bg-popover/90 backdrop-blur-sm" 
              disabled={(date) => date < startOfDay(new Date())} 
            />
          </div>
          <div className="flex items-center space-x-2 pt-2">
            <Switch id="isAllDay" checked={isAllDay} onCheckedChange={setIsAllDay} />
            <Label htmlFor="isAllDay" className="font-headline">All Day Event</Label>
          </div>
          {!isAllDay && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startTime" className="font-headline">Start Time</Label>
                  <Input id="startTime" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="mt-1 bg-input/50 focus:bg-input"/>
                </div>
                <div>
                  <Label htmlFor="endTime" className="font-headline">End Time (Optional)</Label>
                  <Input id="endTime" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="mt-1 bg-input/50 focus:bg-input"/>
                </div>
              </div>
              <div>
                <Label htmlFor="reminderOffsetMinutes" className="font-headline">Reminder</Label>
                <Select onValueChange={(value) => setReminderOffsetMinutes(parseInt(value))} defaultValue={reminderOffsetMinutes.toString()}>
                    <SelectTrigger id="reminderOffsetMinutes" className="mt-1 bg-input/50 focus:bg-input">
                        <SelectValue placeholder="Select reminder time" />
                    </SelectTrigger>
                    <SelectContent>
                        {REMINDER_OPTIONS.map(opt => <SelectItem key={opt.value} value={opt.value.toString()}>{opt.label}</SelectItem>)}
                    </SelectContent>
                </Select>
              </div>
            </>
          )}
        </>
      )}

      {currentTaskType === 'ritual' && (
        <div>
          <Label htmlFor="repeatIntervalDays" className="font-headline">Repeat Every (days)</Label>
          <Input
            id="repeatIntervalDays"
            type="number"
            value={repeatIntervalDays}
            onChange={(e) => setRepeatIntervalDays(Math.max(1, parseInt(e.target.value) || 1))}
            min="1"
            className="mt-1 bg-input/50 focus:bg-input"
          />
        </div>
      )}

      <div>
        <Label htmlFor="difficulty" className="font-headline">Difficulty</Label>
        <Select onValueChange={(value) => setDifficulty(value as 'Easy' | 'Moderate' | 'Hard')} defaultValue={difficulty}>
          <SelectTrigger id="difficulty" className="mt-1 bg-input/50 focus:bg-input">
            <SelectValue placeholder="Select difficulty" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Easy">Easy</SelectItem>
            <SelectItem value="Moderate">Moderate</SelectItem>
            <SelectItem value="Hard">Hard</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div>
        <Label htmlFor="attribute" className="font-headline">Attribute XP</Label>
        <Select onValueChange={(value) => setAttribute(value as Attribute)} defaultValue={attribute}>
          <SelectTrigger id="attribute" className="mt-1 bg-input/50 focus:bg-input">
            <SelectValue placeholder="Select attribute" />
          </SelectTrigger>
          <SelectContent>
            {ATTRIBUTES_LIST.map(attr => <SelectItem key={attr} value={attr}>{attr}</SelectItem>)}
            <SelectItem value="None">None</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter className="pt-3">
        <DialogClose asChild>
          <Button type="button" variant="outline">Cancel</Button>
        </DialogClose>
        <Button type="submit" className="bg-primary hover:bg-primary/90">Add {currentTaskType.charAt(0).toUpperCase() + currentTaskType.slice(1)}</Button>
      </DialogFooter>
    </form>
  );
};

const TaskItem = ({ task }: { task: Task }) => {
  const { completeTask, deleteTask } = useApp();
  const { toast } = useToast();
  const today = format(new Date(), 'yyyy-MM-dd');

  let isTaskEffectivelyCompleted = false;
  let descriptionText = `${task.difficulty} - ${task.attribute}`;
  let isDueToday = true; 

  if (task.taskType === 'ritual') {
    isTaskEffectivelyCompleted = task.lastCompletedDate === today && !!task.nextDueDate && isBefore(startOfDay(new Date()), parseISO(task.nextDueDate));
    descriptionText = `Due: ${task.nextDueDate ? format(parseISO(task.nextDueDate), "MMM d") : "N/A"}. Repeats every ${task.repeatIntervalDays} day(s). ${task.difficulty} - ${task.attribute}`;
    isDueToday = task.nextDueDate === today;
  } else if (task.taskType === 'event') {
    isTaskEffectivelyCompleted = task.isCompleted;
    let timeInfo = "";
    if (!task.isAllDay && task.startTime) {
        timeInfo = ` at ${task.startTime}`;
        if (task.endTime) timeInfo += ` - ${task.endTime}`;
    } else if (task.isAllDay) {
        timeInfo = " (All Day)";
    }
    descriptionText = `Scheduled: ${task.scheduledDate ? format(new Date(task.scheduledDate + 'T00:00:00'), "MMM d") : "N/A"}${timeInfo}. ${task.difficulty} - ${task.attribute}`;
    isDueToday = task.scheduledDate === today;

  } else { 
    isTaskEffectivelyCompleted = task.isCompleted;
  }
  
  const canComplete = (task.taskType === 'ritual' && isDueToday && !isTaskEffectivelyCompleted) || 
                      ((task.taskType === 'daily' || task.taskType === 'event') && !task.isCompleted && (task.taskType === 'daily' || (task.taskType === 'event' && isDueToday)) );


  const handleComplete = () => {
    if (canComplete) {
      completeTask(task.id);
      toast({ title: `${task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)} Completed!`, description: `+EXP for ${task.name}`});
    } else if (task.taskType === 'ritual' && task.lastCompletedDate === today) {
        toast({ title: "Ritual Already Done", description: "This ritual has already been completed today.", variant: "default" });
    } else if (!isDueToday && (task.taskType === 'event' || task.taskType === 'ritual')) {
        toast({ title: "Not Due Yet", description: "This task is not scheduled for today.", variant: "default" });
    } else if (isTaskEffectivelyCompleted) {
       toast({ title: "Already Completed", description: "This task is already marked as complete.", variant: "default" });
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${task.name}"? This action cannot be undone.`)) {
      deleteTask(task.id);
      toast({ title: "Task Deleted", description: `${task.name} removed.` });
    }
  };
  
  const isPastDue = (task.taskType === 'event' && task.scheduledDate && isBefore(parseISO(task.scheduledDate), startOfDay(new Date())) && !task.isCompleted) ||
                     (task.taskType === 'ritual' && task.nextDueDate && isBefore(parseISO(task.nextDueDate), startOfDay(new Date())) && task.lastCompletedDate !== task.nextDueDate && task.lastCompletedDate !== today && !task.isCompleted);


  return (
    <div className={`p-3 border flex items-center justify-between transition-all duration-300 rounded-md 
      ${isTaskEffectivelyCompleted ? 'bg-secondary/30 border-green-500/50' : 
        isPastDue ? 'bg-destructive/10 border-destructive/30' :
        'bg-card hover:bg-card/90 border-border'}`}>
      <div className="flex-1 min-w-0">
         <div className="flex items-center">
          {task.taskType === 'ritual' && <Repeat className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />}
          {task.taskType === 'event' && <CalendarDays className="h-4 w-4 mr-2 text-muted-foreground flex-shrink-0" />} 
          {isPastDue && <AlertTriangle className="h-4 w-4 mr-2 text-destructive flex-shrink-0" />}
          <p className={`font-medium font-body truncate ${isTaskEffectivelyCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.name}</p>
        </div>
        <p className="text-xs text-muted-foreground truncate">{descriptionText}</p>
      </div>
      <div className="flex items-center space-x-2 pl-2">
        {canComplete && !isTaskEffectivelyCompleted && (
          <Button onClick={handleComplete} size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">Complete</Button>
        )}
        {isTaskEffectivelyCompleted && (
           <span className="text-xs text-green-400 font-semibold pr-2">DONE</span>
        )}
        <Button onClick={handleDelete} size="sm" variant="destructive" className="opacity-70 hover:opacity-100">Delete</Button>
      </div>
    </div>
  );
};

const CyberpunkAvatarPlaceholder = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground group-hover:text-primary transition-colors">
    <defs>
      <linearGradient id="cyberGradUser" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" style={{stopColor: 'hsl(var(--primary))', stopOpacity:0.3}} />
        <stop offset="100%" style={{stopColor: 'hsl(var(--accent))', stopOpacity:0.3}} />
      </linearGradient>
    </defs>
    <circle cx="50" cy="40" r="20" stroke="hsl(var(--primary))" strokeWidth="2" fill="url(#cyberGradUser)" />
    <path d="M30 70 Q50 90 70 70 Q50 80 30 70" stroke="hsl(var(--primary))" strokeWidth="1.5" fill="hsl(var(--primary))" fillOpacity="0.1" />
    <rect x="46" y="5" width="8" height="10" fill="hsl(var(--border))" opacity="0.5"/>
    <line x1="40" y1="42" x2="60" y2="42" stroke="hsl(var(--accent))" strokeWidth="1"/>
  </svg>
);


export default function HomePage() {
  const { userProfile, getDailyDirectives, getRituals, getEventsForToday, setUserProfile, setActiveTab } = useApp();
  const [isAddDailyOpen, setIsAddDailyOpen] = useState(false);
  const [isAddRitualOpen, setIsAddRitualOpen] = useState(false);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [editingName, setEditingName] = useState(userProfile.userName);
  const [isEditingQuote, setIsEditingQuote] = useState(false);
  const [editingQuote, setEditingQuote] = useState(userProfile.customQuote);

  const { toast } = useToast();
  const userImageInputRef = useRef<HTMLInputElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const quoteInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab('home');
  }, [setActiveTab]);

  useEffect(() => {
    setEditingName(userProfile.userName);
  }, [userProfile.userName]);

  useEffect(() => {
    setEditingQuote(userProfile.customQuote);
  }, [userProfile.customQuote]);
  
  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
    }
  }, [isEditingName]);

  useEffect(() => {
    if (isEditingQuote && quoteInputRef.current) {
      quoteInputRef.current.focus();
    }
  }, [isEditingQuote]);


  const dailyDirectives = getDailyDirectives();
  const rituals = getRituals();
  const eventsForToday = getEventsForToday();

  const handleUserAvatarClick = () => {
    userImageInputRef.current?.click();
    playSound('buttonClick');
  };

  const handleUserAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
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
        setUserProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
        toast({ title: "Avatar Updated!" });
        playSound('buttonClick');
      };
      reader.onerror = () => {
        toast({
          title: "Error reading file",
          description: "Could not process the selected image.",
          variant: "destructive",
        });
      }
      reader.readAsDataURL(file);
    }
    if (event.target) {
      event.target.value = "";
    }
  };

  const handleNameDoubleClick = () => {
    setEditingName(userProfile.userName);
    setIsEditingName(true);
  };

  const handleNameChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingName(e.target.value);
  };

  const saveName = () => {
    setUserProfile(prev => ({ ...prev, userName: editingName.trim() }));
    toast({ title: "Name Updated!" });
    setIsEditingName(false);
  };

  const handleNameKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveName();
    } else if (e.key === 'Escape') {
      setEditingName(userProfile.userName);
      setIsEditingName(false);
    }
  };

  const handleQuoteDoubleClick = () => {
    setEditingQuote(userProfile.customQuote);
    setIsEditingQuote(true);
  };

  const handleQuoteChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEditingQuote(e.target.value);
  };

  const saveQuote = () => {
    setUserProfile(prev => ({ ...prev, customQuote: editingQuote }));
    toast({ title: "Quote Updated!" });
    setIsEditingQuote(false);
  };
  
  const handleQuoteKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      saveQuote();
    } else if (e.key === 'Escape') {
      setEditingQuote(userProfile.customQuote);
      setIsEditingQuote(false);
    }
  };


  const renderTaskList = (tasksToList: Task[], taskType: TaskType) => (
    tasksToList.length > 0 ? (
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {tasksToList.map(task => (
          <TaskItem key={task.id} task={task} />
        ))}
      </div>
    ) : (
      <p className="text-muted-foreground text-center py-4 font-code text-xs">
        {taskType === 'daily' && "No directives logged for this cycle. Initiate new tasks to proceed."}
        {taskType === 'ritual' && "No rituals due today or all are completed. Establish or await next due cycle."}
        {taskType === 'event' && "No events for today. Schedule new events or check other dates."} 
      </p>
    )
  );


  return (
    <AppWrapper>
      <div className="space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-primary/30">
          <CardHeader className="items-center text-center flex flex-col p-4">
             <div className="avatar-arc-container mb-3 w-[120px] h-[120px]">
                <div onClick={handleUserAvatarClick} className="cursor-pointer relative group w-[100px] h-[100px] border-2 border-primary p-0.5 rounded-full overflow-hidden">
                    {userProfile.avatarUrl ? (
                    <Image
                        src={userProfile.avatarUrl}
                        alt="Your Avatar"
                        width={100}
                        height={100}
                        className="object-cover w-full h-full rounded-full"
                        data-ai-hint="user avatar"
                    />
                    ) : (
                    <div className="w-full h-full bg-card flex items-center justify-center overflow-hidden rounded-full">
                        <CyberpunkAvatarPlaceholder />
                    </div>
                    )}
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                    <PlusCircle className="h-8 w-8 text-primary neon-icon-primary" />
                    </div>
                </div>
                <span className="avatar-orbiting-arc avatar-orbiting-arc-type1" style={{ width: '106px', height: '106px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(20deg)', borderLeftColor: 'transparent', borderBottomColor: 'transparent' }}></span>
                <span className="avatar-orbiting-arc avatar-orbiting-arc-type2" style={{ width: '112px', height: '112px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(-35deg)', borderTopColor: 'transparent', borderBottomColor: 'transparent'  }}></span>
                <span className="avatar-orbiting-arc avatar-orbiting-arc-type3" style={{ width: '118px', height: '118px', top: '50%', left: '50%', transform: 'translate(-50%, -50%) rotate(50deg)', borderTopColor: 'transparent', borderRightColor: 'transparent' }}></span>
             </div>
              <input type="file" ref={userImageInputRef} onChange={handleUserAvatarChange} accept="image/*" className="hidden" />
            
            {isEditingName ? (
              <Input
                ref={nameInputRef}
                type="text"
                value={editingName}
                onChange={handleNameChange}
                onBlur={saveName}
                onKeyDown={handleNameKeyDown}
                className="text-2xl font-bold text-center bg-input/50 focus:bg-input border-primary text-primary mb-1 p-1 max-w-[250px]"
                maxLength={30}
              />
            ) : (
              <h2 
                onDoubleClick={handleNameDoubleClick} 
                className="text-2xl font-bold text-primary mb-1 p-1 cursor-pointer hover:bg-muted/30 rounded-md transition-colors min-h-[36px]"
                title="Double-click to edit name"
              >
                {userProfile.userName.trim() || "Double-click to set name"}
              </h2>
            )}

            <CardTitle className="font-headline text-xl text-primary uppercase tracking-wider">
              <RankDisplay rankName={userProfile.rankName} subRank={userProfile.subRank} />
            </CardTitle>

            {isEditingQuote ? (
              <Input
                ref={quoteInputRef}
                type="text"
                value={editingQuote}
                onChange={handleQuoteChange}
                onBlur={saveQuote}
                onKeyDown={handleQuoteKeyDown}
                className="text-xs text-center bg-input/50 focus:bg-input border-muted-foreground text-muted-foreground mt-1 p-1 italic max-w-[300px] w-full"
                maxLength={100}
              />
            ) : (
              <CardDescription 
                onDoubleClick={handleQuoteDoubleClick}
                className="text-muted-foreground mt-1 text-xs font-code italic cursor-pointer hover:bg-muted/30 rounded-md p-1 transition-colors min-h-[20px]"
                title="Double-click to edit quote"
              >
                {userProfile.customQuote.trim() || "No quote set. Double-click to add one."}
              </CardDescription>
            )}

            <Link href="/stats" passHref className="mt-3 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground font-headline uppercase text-xs py-2 px-4" onClick={() => playSound('buttonClick')}>
                <User className="mr-2 h-4 w-4" />
                Status Report
              </Button>
            </Link>
          </CardHeader>
          <CardContent className="space-y-3 pt-2 pb-4 px-4">
            <div>
              <div className="flex justify-between text-xs mb-1 font-code">
                <span className="text-foreground uppercase">EXP</span>
                <span className="text-primary">{userProfile.currentExpInSubRank} / {userProfile.expToNextSubRank}</span>
              </div>
              <Progress value={(userProfile.expToNextSubRank > 0 ? userProfile.currentExpInSubRank / userProfile.expToNextSubRank : 0) * 100} className="h-2 bg-secondary" indicatorClassName="bg-primary" />
            </div>
            <div className="flex justify-between text-xs font-code">
              <span className="text-foreground uppercase">Streak: <span className="text-primary font-bold">{userProfile.currentStreak}</span></span>
              <span className="text-foreground uppercase">Completion: <span className="text-primary font-bold">{userProfile.dailyTaskCompletionPercentage.toFixed(1)}%</span></span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/graphs" passHref>
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center border-muted-foreground/50 text-muted-foreground hover:bg-muted hover:text-foreground font-headline uppercase text-xs" onClick={() => playSound('buttonClick')}>
              <BarChart2 className="h-6 w-6 mb-1" />
              <span>Data Logs</span>
            </Button>
          </Link>
          <Link href="/journal" passHref>
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center border-muted-foreground/50 text-muted-foreground hover:bg-muted hover:text-foreground font-headline uppercase text-xs" onClick={() => playSound('buttonClick')}>
              <BookOpen className="h-6 w-6 mb-1" />
              <span>Chronicles</span>
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-sm border-border">
            <TabsTrigger value="daily" className="font-headline" onClick={() => playSound('buttonClick')}>Directives</TabsTrigger>
            <TabsTrigger value="rituals" className="font-headline" onClick={() => playSound('buttonClick')}>Rituals</TabsTrigger>
            <TabsTrigger value="events" className="font-headline" onClick={() => playSound('buttonClick')}>Events</TabsTrigger> 
          </TabsList>

          <TabsContent value="daily">
            <Card className="bg-card/80 backdrop-blur-sm shadow-lg mt-2">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <CardTitle className="font-headline text-lg text-primary uppercase">Daily Directives</CardTitle>
                <Dialog open={isAddDailyOpen} onOpenChange={setIsAddDailyOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground" onClick={() => playSound('buttonClick')}>
                      <PlusCircle className="h-4 w-4 mr-2 neon-icon" /> New Directive
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader><DialogTitle className="font-headline text-primary uppercase">Log New Directive</DialogTitle></DialogHeader>
                    <AddTaskForm currentTaskType="daily" onTaskAdd={() => setIsAddDailyOpen(false)} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {renderTaskList(dailyDirectives, 'daily')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rituals">
            <Card className="bg-card/80 backdrop-blur-sm shadow-lg mt-2">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <CardTitle className="font-headline text-lg text-primary uppercase">Active Rituals</CardTitle>
                 <Dialog open={isAddRitualOpen} onOpenChange={setIsAddRitualOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground" onClick={() => playSound('buttonClick')}>
                      <Repeat className="h-4 w-4 mr-2 neon-icon" /> New Ritual
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader><DialogTitle className="font-headline text-primary uppercase">Establish New Ritual</DialogTitle></DialogHeader>
                    <AddTaskForm currentTaskType="ritual" onTaskAdd={() => setIsAddRitualOpen(false)} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {renderTaskList(rituals, 'ritual')}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="events"> 
            <Card className="bg-card/80 backdrop-blur-sm shadow-lg mt-2">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <CardTitle className="font-headline text-lg text-primary uppercase">Today's Events</CardTitle> 
                <Dialog open={isAddEventOpen} onOpenChange={setIsAddEventOpen}> 
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground" onClick={() => playSound('buttonClick')}>
                      <CalendarDays className="h-4 w-4 mr-2 neon-icon" /> New Event 
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md bg-card border-border">
                    <DialogHeader><DialogTitle className="font-headline text-primary uppercase">Schedule New Event</DialogTitle></DialogHeader> 
                    <AddTaskForm currentTaskType="event" onTaskAdd={() => setIsAddEventOpen(false)} /> 
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {renderTaskList(eventsForToday, 'event')} 
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppWrapper>
  );
}


'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import { PlusCircle, BarChart2, User, BookOpen, CalendarDays } from 'lucide-react';
import React, { useEffect, useState, useRef, type ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, TaskType, Attribute } from '@/lib/types';
import { ATTRIBUTES_LIST } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import RankDisplay from '@/components/shared/RankDisplay';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from 'date-fns';


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
  const { addTask } = useApp();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      toast({ title: "Error", description: "Task name cannot be empty.", variant: "destructive" });
      return;
    }
    if (currentTaskType === 'protocol' && !scheduledDate) {
      toast({ title: "Error", description: "Please select a date for protocol tasks.", variant: "destructive" });
      return;
    }

    addTask({
      name: taskName,
      difficulty,
      attribute,
      taskType: currentTaskType,
      scheduledDate: currentTaskType === 'protocol' ? format(scheduledDate!, 'yyyy-MM-dd') : undefined,
    });

    setTaskName('');
    setDifficulty('Moderate');
    setAttribute('None');
    setScheduledDate(new Date());
    toast({ title: "Success", description: `${currentTaskType.charAt(0).toUpperCase() + currentTaskType.slice(1)} added!` });
    onTaskAdd();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="taskName" className="font-headline">Name</Label>
        <Input
          id="taskName"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder={
            currentTaskType === 'daily' ? "e.g., Review project notes" :
            currentTaskType === 'ritual' ? "e.g., Morning Meditation" :
            "e.g., Team Sync Meeting"
          }
          className="mt-1 bg-input/50 focus:bg-input"
        />
      </div>
      {currentTaskType === 'protocol' && (
        <div>
          <Label htmlFor="scheduledDate" className="font-headline">Scheduled Date</Label>
          <Calendar
            mode="single"
            selected={scheduledDate}
            onSelect={setScheduledDate}
            className="rounded-md border mt-1 bg-popover"
            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0))} // Disable past dates
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
      <DialogFooter>
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

  // Determine if task is effectively completed for today (especially for rituals)
  const isTaskDisplayCompleted = task.taskType === 'ritual' ? task.lastCompletedDate === today && task.isCompleted : task.isCompleted;

  const handleComplete = () => {
    if (!isTaskDisplayCompleted) {
      completeTask(task.id);
      toast({ title: `${task.taskType.charAt(0).toUpperCase() + task.taskType.slice(1)} Completed!`, description: `+EXP for ${task.name}`});
    }
  };

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${task.name}"? This action cannot be undone.`)) {
      deleteTask(task.id);
      toast({ title: "Task Deleted", description: `${task.name} removed.` });
    }
  };
  
  const descriptionText = task.taskType === 'protocol' && task.scheduledDate
    ? `${task.difficulty} - ${task.attribute} (Due: ${format(new Date(task.scheduledDate), "MMM d")})`
    : `${task.difficulty} - ${task.attribute}`;

  return (
    <div className={`p-3 border flex items-center justify-between transition-all duration-300 rounded-md ${isTaskDisplayCompleted ? 'bg-secondary/30 border-green-500/50' : 'bg-card hover:bg-card/90 border-border'}`}>
      <div>
        <p className={`font-medium font-body ${isTaskDisplayCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.name}</p>
        <p className="text-xs text-muted-foreground">{descriptionText}</p>
      </div>
      <div className="flex items-center space-x-2">
        {!isTaskDisplayCompleted && (
          <Button onClick={handleComplete} size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">Complete</Button>
        )}
        {isTaskDisplayCompleted && (
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
  const { userProfile, getDailyDirectives, getRituals, getProtocolsForToday, setUserProfile, setActiveTab } = useApp();
  const [isAddDailyOpen, setIsAddDailyOpen] = useState(false);
  const [isAddRitualOpen, setIsAddRitualOpen] = useState(false);
  const [isAddProtocolOpen, setIsAddProtocolOpen] = useState(false);

  const { toast } = useToast();
  const userImageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setActiveTab('home');
  }, [setActiveTab]);

  const dailyDirectives = getDailyDirectives();
  const rituals = getRituals();
  const protocolsForToday = getProtocolsForToday();

  const handleUserAvatarClick = () => {
    userImageInputRef.current?.click();
  };

  const handleUserAvatarChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        toast({
          title: "Image too large",
          description: "Please select an image smaller than 2MB.",
          variant: "destructive",
        });
        if(event.target) event.target.value = ""; // Clear the input
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setUserProfile(prev => ({ ...prev, avatarUrl: reader.result as string }));
        toast({ title: "Avatar Updated!" });
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
    // Clear the input value to allow re-selecting the same file after an error
    if (event.target) {
      event.target.value = "";
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
      <p className="text-muted-foreground text-center py-4 font-code text-xs">No {taskType}s logged for this cycle. Initiate new tasks to proceed.</p>
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

            <CardTitle className="font-headline text-xl text-primary uppercase tracking-wider">
              <RankDisplay rankName={userProfile.rankName} subRank={userProfile.subRank} />
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-1 text-xs font-code italic">{userProfile.customQuote}</CardDescription>

            <Link href="/stats" passHref className="mt-3 w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-primary text-primary hover:bg-primary hover:text-primary-foreground font-headline uppercase text-xs py-2 px-4">
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
              <Progress value={(userProfile.currentExpInSubRank / userProfile.expToNextSubRank) * 100} className="h-2 bg-secondary" indicatorClassName="bg-primary" />
            </div>
            <div className="flex justify-between text-xs font-code">
              <span className="text-foreground uppercase">Streak: <span className="text-primary font-bold">{userProfile.currentStreak}</span></span>
              <span className="text-foreground uppercase">Completion: <span className="text-primary font-bold">{userProfile.dailyTaskCompletionPercentage}%</span></span>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Link href="/graphs" passHref>
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center border-muted-foreground/50 text-muted-foreground hover:bg-muted hover:text-foreground font-headline uppercase text-xs">
              <BarChart2 className="h-6 w-6 mb-1" />
              <span>Data Logs</span>
            </Button>
          </Link>
          <Link href="/journal" passHref>
            <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center border-muted-foreground/50 text-muted-foreground hover:bg-muted hover:text-foreground font-headline uppercase text-xs">
              <BookOpen className="h-6 w-6 mb-1" />
              <span>Chronicles</span>
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="daily" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-sm border-border">
            <TabsTrigger value="daily" className="font-headline">Directives</TabsTrigger>
            <TabsTrigger value="rituals" className="font-headline">Rituals</TabsTrigger>
            <TabsTrigger value="protocols" className="font-headline">Protocols</TabsTrigger>
          </TabsList>

          <TabsContent value="daily">
            <Card className="bg-card/80 backdrop-blur-sm shadow-lg mt-2">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <CardTitle className="font-headline text-lg text-primary uppercase">Daily Directives</CardTitle>
                <Dialog open={isAddDailyOpen} onOpenChange={setIsAddDailyOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                      <PlusCircle className="h-4 w-4 mr-2 neon-icon" /> New Directive
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-card border-border">
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
                    <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                      <PlusCircle className="h-4 w-4 mr-2 neon-icon" /> New Ritual
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-card border-border">
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

          <TabsContent value="protocols">
            <Card className="bg-card/80 backdrop-blur-sm shadow-lg mt-2">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <CardTitle className="font-headline text-lg text-primary uppercase">Today's Protocols</CardTitle>
                <Dialog open={isAddProtocolOpen} onOpenChange={setIsAddProtocolOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                      <CalendarDays className="h-4 w-4 mr-2 neon-icon" /> New Protocol
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px] bg-card border-border">
                    <DialogHeader><DialogTitle className="font-headline text-primary uppercase">Schedule New Protocol</DialogTitle></DialogHeader>
                    <AddTaskForm currentTaskType="protocol" onTaskAdd={() => setIsAddProtocolOpen(false)} />
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                {renderTaskList(protocolsForToday, 'protocol')}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppWrapper>
  );
}

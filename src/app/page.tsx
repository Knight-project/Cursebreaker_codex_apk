
'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import { PlusCircle, BarChart2, User, BookOpen } from 'lucide-react';
import React, { useEffect, useState, useRef, type ChangeEvent } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, Attribute } from '@/lib/types';
import { ATTRIBUTES_LIST } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';


const AddTaskForm = ({ onTaskAdd }: { onTaskAdd: () => void }) => {
  const [taskName, setTaskName] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Moderate' | 'Hard'>('Moderate');
  const [attribute, setAttribute] = useState<Attribute>('None');
  const { addTask } = useApp();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      toast({ title: "Error", description: "Task name cannot be empty.", variant: "destructive" });
      return;
    }
    addTask({ name: taskName, difficulty, attribute });
    setTaskName('');
    setDifficulty('Moderate');
    setAttribute('None');
    toast({ title: "Success", description: "Task added!" });
    onTaskAdd(); 
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="taskName" className="font-headline">Task Name</Label>
        <Input
          id="taskName"
          value={taskName}
          onChange={(e) => setTaskName(e.target.value)}
          placeholder="e.g., Morning Meditation"
          className="mt-1 bg-input/50 focus:bg-input"
        />
      </div>
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
        <Button type="submit" className="bg-primary hover:bg-primary/90">Add Task</Button>
      </DialogFooter>
    </form>
  );
};

const TaskItem = ({ task }: { task: Task }) => {
  const { completeTask, deleteTask } = useApp();
  const { toast } = useToast();

  const handleComplete = () => {
    if (!task.isCompleted) {
      completeTask(task.id);
      toast({ title: "Task Completed!", description: `+EXP for ${task.name}`});
    }
  };
  
  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
      deleteTask(task.id);
      toast({ title: "Task Deleted", description: `${task.name} removed.` });
    }
  };

  return (
    <div className={`p-3 border flex items-center justify-between transition-all duration-300 rounded-md ${task.isCompleted ? 'bg-secondary/30 border-green-500/50' : 'bg-card hover:bg-card/90 border-border'}`}>
      <div>
        <p className={`font-medium font-body ${task.isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{task.name}</p>
        <p className="text-xs text-muted-foreground">{task.difficulty} - {task.attribute}</p>
      </div>
      <div className="flex items-center space-x-2">
        {!task.isCompleted && (
          <Button onClick={handleComplete} size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">Complete</Button>
        )}
        <Button onClick={handleDelete} size="sm" variant="destructive" className="opacity-70 hover:opacity-100">Delete</Button>
      </div>
    </div>
  );
};

const CyberpunkAvatarPlaceholder = () => (
  <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-muted-foreground group-hover:text-primary transition-colors">
    <circle cx="50" cy="35" r="15" stroke="currentColor" strokeWidth="3"/>
    <path d="M25 70C25 55 35 50 50 50C65 50 75 55 75 70Z" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.2"/>
    <line x1="50" y1="50" x2="50" y2="60" stroke="currentColor" strokeWidth="2"/>
    <path d="M40 80H60" stroke="currentColor" strokeWidth="2" />
     {/* Simple data lines */}
    <line x1="30" y1="25" x2="70" y2="25" stroke="currentColor" strokeWidth="1" strokeDasharray="2 2"/>
    <line x1="20" y1="40" x2="80" y2="40" stroke="currentColor" strokeWidth="1" strokeDasharray="3 1"/>
  </svg>
);


export default function HomePage() {
  const { userProfile, tasks, getTodaysTasks, setUserProfile, setActiveTab } = useApp();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const { toast } = useToast();
  const userImageInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    setActiveTab('home');
  }, [setActiveTab]);

  const todaysTasks = getTodaysTasks();

  const handleUserAvatarClick = () => {
    userImageInputRef.current?.click();
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

  return (
    <AppWrapper>
      <div className="space-y-6">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-primary/30">
          <CardHeader className="items-center text-center flex flex-col p-4">
             <div className="avatar-arc-container mb-3 w-[110px] h-[110px]">
                <div onClick={handleUserAvatarClick} className="cursor-pointer relative group w-[100px] h-[100px] border-2 border-primary p-0.5 rounded-full overflow-hidden mx-auto my-auto">
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
                <span className="avatar-static-arc avatar-static-arc-1" style={{ width: '110px', height: '110px', borderColor: 'hsla(var(--primary), 0.6)', transform: 'translate(-50%, -50%) rotate(20deg)', borderTopColor: 'transparent', borderLeftColor: 'transparent' }}></span>
                <span className="avatar-static-arc avatar-static-arc-2" style={{ width: '120px', height: '120px', borderColor: 'hsla(var(--accent), 0.5)', transform: 'translate(-50%, -50%) rotate(-35deg)', borderBottomColor: 'transparent', borderRightColor: 'transparent'  }}></span>
             </div>
              <input type="file" ref={userImageInputRef} onChange={handleUserAvatarChange} accept="image/*" className="hidden" />

            <CardTitle className="font-headline text-xl text-primary uppercase tracking-wider">{userProfile.rankName} - {userProfile.subRank}</CardTitle>
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

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full h-16 flex flex-col items-center justify-center border-accent text-accent hover:bg-accent hover:text-accent-foreground font-headline uppercase text-xs">
                <PlusCircle className="h-6 w-6 mb-1 neon-icon" />
                <span>New Task</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-headline text-primary uppercase">Log New Directive</DialogTitle>
              </DialogHeader>
              <AddTaskForm onTaskAdd={() => setIsAddTaskOpen(false)} />
            </DialogContent>
          </Dialog>
          
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

        <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
          <CardHeader className="p-4">
            <CardTitle className="font-headline text-lg text-primary uppercase">Daily Directives</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            {todaysTasks.length > 0 ? (
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {todaysTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4 font-code text-xs">No directives logged for this cycle. Initiate new tasks to proceed.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
}

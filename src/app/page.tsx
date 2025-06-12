'use client';
import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useApp } from '@/contexts/AppContext';
import { PlusCircle, BarChart2, User, BookOpen } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Task, Attribute } from '@/lib/types';
import { ATTRIBUTES_LIST } from '@/lib/types';
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
    onTaskAdd(); // Close dialog
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
    // Basic confirmation for now
    if (window.confirm(`Are you sure you want to delete "${task.name}"?`)) {
      deleteTask(task.id);
      toast({ title: "Task Deleted", description: `${task.name} removed.` });
    }
  };

  return (
    <div className={`p-3 rounded-md border flex items-center justify-between transition-all duration-300 ${task.isCompleted ? 'bg-secondary/30 border-green-500/50' : 'bg-card hover:bg-card/90 border-border'}`}>
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


export default function HomePage() {
  const { userProfile, tasks, getTodaysTasks, setUserProfile, activeTab, setActiveTab } = useApp();
  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [customQuoteInput, setCustomQuoteInput] = useState(userProfile.customQuote);
  const { toast } = useToast();
  
  useEffect(() => {
    setActiveTab('home');
  }, [setActiveTab]);

  const todaysTasks = getTodaysTasks();

  const handleQuoteSave = () => {
    setUserProfile(prev => ({ ...prev, customQuote: customQuoteInput }));
    toast({ title: "Quote Updated!", description: "Your new wisdom shines." });
  };


  return (
    <AppWrapper>
      <div className="space-y-6">
        {/* User Profile Summary Card */}
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl border-primary/30">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">{userProfile.rankName} - Sub-Rank {userProfile.subRank}</CardTitle>
            <CardDescription className="text-muted-foreground">{userProfile.customQuote}</CardDescription>
             <div className="flex items-center gap-2 mt-2">
              <Input 
                value={customQuoteInput} 
                onChange={(e) => setCustomQuoteInput(e.target.value)}
                placeholder="Your motivational quote"
                className="text-sm flex-grow bg-input/30 focus:bg-input"
              />
              <Button size="sm" onClick={handleQuoteSave}>Save Quote</Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span className="text-foreground">EXP</span>
                <span className="text-accent">{userProfile.currentExpInSubRank} / {userProfile.expToNextSubRank}</span>
              </div>
              <Progress value={(userProfile.currentExpInSubRank / userProfile.expToNextSubRank) * 100} className="h-3 bg-secondary" indicatorClassName="bg-primary" />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-foreground">Current Streak: <span className="text-accent font-bold">{userProfile.currentStreak} days</span></span>
              <span className="text-foreground">Today's Completion: <span className="text-accent font-bold">{userProfile.dailyTaskCompletionPercentage}%</span></span>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <PlusCircle className="h-8 w-8 mb-1 neon-icon" />
                <span className="text-sm">Add Task</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-headline text-primary">Add New Daily Task</DialogTitle>
              </DialogHeader>
              <AddTaskForm onTaskAdd={() => setIsAddTaskOpen(false)} />
            </DialogContent>
          </Dialog>
          
          <Link href="/stats" passHref>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center border-primary text-primary hover:bg-primary hover:text-primary-foreground">
              <User className="h-8 w-8 mb-1 neon-icon-primary" />
              <span className="text-sm">Stats Card</span>
            </Button>
          </Link>
          <Link href="/graphs" passHref>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center border-muted-foreground text-muted-foreground hover:bg-muted hover:text-foreground">
              <BarChart2 className="h-8 w-8 mb-1" />
              <span className="text-sm">Graphs</span>
            </Button>
          </Link>
          <Link href="/journal" passHref>
            <Button variant="outline" className="w-full h-20 flex flex-col items-center justify-center border-muted-foreground text-muted-foreground hover:bg-muted hover:text-foreground">
              <BookOpen className="h-8 w-8 mb-1" />
              <span className="text-sm">Journal</span>
            </Button>
          </Link>
        </div>

        {/* Task List */}
        <Card className="bg-card/80 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-xl text-primary">Daily Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {todaysTasks.length > 0 ? (
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                {todaysTasks.map(task => (
                  <TaskItem key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No tasks for today. Add some to begin your ascent!</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
}

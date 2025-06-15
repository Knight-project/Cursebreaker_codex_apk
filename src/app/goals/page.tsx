
// src/app/goals/page.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import AppWrapper from '@/components/layout/AppWrapper';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useApp } from '@/contexts/AppContext';
import type { Goal, Task } from '@/lib/types'; // Added Task
import { format, parseISO, startOfDay } from 'date-fns';
import { PlusCircle, Edit3, Trash2, CheckCircle, Archive, ArchiveRestore, Target, CalendarIcon as CalendarLucideIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/soundManager';
import { Progress } from '@/components/ui/progress';


interface GoalFormProps {
  initialData?: Goal;
  onSave: (data: Omit<Goal, 'id' | 'linkedTaskIds' | 'createdAt' | 'status'> & { id?: string }) => void;
  onClose: () => void;
}

const GoalForm: React.FC<GoalFormProps> = ({ initialData, onSave, onClose }) => {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    initialData?.targetDate ? parseISO(initialData.targetDate) : undefined
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: "Goal Name Required", description: "Please enter a name for your goal.", variant: "destructive" });
      return;
    }
    onSave({
      id: initialData?.id,
      name,
      description,
      targetDate: targetDate ? targetDate.toISOString() : undefined
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="goalName" className="font-headline">Goal Name</Label>
        <Input
          id="goalName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Master React Hooks"
          className="mt-1 bg-input/50 focus:bg-input"
        />
      </div>
      <div>
        <Label htmlFor="goalDescription" className="font-headline">Description (Optional)</Label>
        <Textarea
          id="goalDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe your objective..."
          className="mt-1 bg-input/50 focus:bg-input min-h-[80px]"
        />
      </div>
      <div>
        <Label htmlFor="goalTargetDate" className="font-headline">Target Date (Optional)</Label>
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              className={cn(
                "w-full justify-start text-left font-normal mt-1 bg-input/50 hover:bg-input",
                !targetDate && "text-muted-foreground"
              )}
              onClick={() => setIsCalendarOpen(true)}
            >
              <CalendarLucideIcon className="mr-2 h-4 w-4" />
              {targetDate ? format(targetDate, "PPP") : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
            <Calendar
              mode="single"
              selected={targetDate}
              onSelect={(date) => { setTargetDate(date); setIsCalendarOpen(false); }}
              disabled={(date) => date < startOfDay(new Date())}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <DialogFooter className="pt-3">
        <DialogClose asChild>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </DialogClose>
        <Button type="submit" className="bg-primary hover:bg-primary/90">
          {initialData ? "Save Changes" : "Add Goal"}
        </Button>
      </DialogFooter>
    </form>
  );
};


const GoalItem: React.FC<{ goal: Goal; tasks: Task[] }> = ({ goal, tasks }) => {
  const { deleteGoal, toggleGoalStatus, updateGoal, getGoalById } = useApp(); // Added updateGoal
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const linkedTasks = useMemo(() => {
    return tasks.filter(task => goal.linkedTaskIds.includes(task.id));
  }, [tasks, goal.linkedTaskIds]);

  const completedLinkedTasks = useMemo(() => {
    return linkedTasks.filter(task => task.isCompleted).length;
  }, [linkedTasks]);

  const progress = linkedTasks.length > 0 ? (completedLinkedTasks / linkedTasks.length) * 100 : 0;

  const handleSaveEdit = (data: Omit<Goal, 'id' | 'linkedTaskIds' | 'createdAt' | 'status'> & { id?: string }) => {
    if (data.id) {
      // Pass the full data object including name, description, targetDate
      updateGoal({
        id: data.id,
        name: data.name,
        description: data.description,
        targetDate: data.targetDate,
        status: goal.status, // preserve original status unless specifically changed
      });
    }
    setIsEditOpen(false);
    toast({title: "Goal Updated", description: `"${data.name}" has been modified.`});
    playSound('buttonClick');
  };


  return (
    <Card className="bg-card/90 backdrop-blur-sm shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-headline text-primary">{goal.name}</CardTitle>
          <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => playSound('buttonClick')}>
                <Edit3 className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-headline text-primary">Edit Goal</DialogTitle>
              </DialogHeader>
              <GoalForm
                initialData={goal}
                onSave={handleSaveEdit}
                onClose={() => {setIsEditOpen(false); playSound('buttonClick');}}
              />
            </DialogContent>
          </Dialog>
        </div>
        {goal.description && <CardDescription className="text-sm mt-1">{goal.description}</CardDescription>}
        {goal.targetDate && (
          <p className="text-xs text-muted-foreground mt-1">
            Target: {format(parseISO(goal.targetDate), "MMMM d, yyyy")}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{completedLinkedTasks} / {linkedTasks.length} Tasks</span>
          </div>
          <Progress value={progress} className="h-2 bg-secondary" indicatorClassName="bg-primary" />
        </div>
        {/* Placeholder for listing linked tasks - to be implemented in Phase 2 */}
      </CardContent>
      <CardFooter className="flex flex-wrap gap-2 justify-end">
        {goal.status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            className="border-green-500 text-green-500 hover:bg-green-500 hover:text-primary-foreground"
            onClick={() => {toggleGoalStatus(goal.id, 'completed'); playSound('buttonClick');}}
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Mark Complete
          </Button>
        )}
        {goal.status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            className="border-muted-foreground text-muted-foreground hover:bg-muted hover:text-foreground"
            onClick={() => {toggleGoalStatus(goal.id, 'archived'); playSound('buttonClick');}}
          >
            <Archive className="mr-2 h-4 w-4" /> Archive
          </Button>
        )}
        {(goal.status === 'completed' || goal.status === 'archived') && (
          <Button
            variant="outline"
            size="sm"
            className="border-primary text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => {toggleGoalStatus(goal.id, 'active'); playSound('buttonClick');}}
          >
            <ArchiveRestore className="mr-2 h-4 w-4" /> Reactivate
          </Button>
        )}
        <Button
          variant="destructive"
          size="sm"
          onClick={() => {
            if(window.confirm(`Are you sure you want to delete the goal "${goal.name}"? This cannot be undone.`)) {
              deleteGoal(goal.id);
              toast({title: "Goal Deleted", description: `"${goal.name}" has been removed.`, variant: "destructive"});
              playSound('buttonClick');
            }
          }}
        >
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function GoalsPage() {
  const { userProfile, tasks, addGoal, updateGoal, setActiveTab } = useApp();
  const [hasMounted, setHasMounted] = useState(false);
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setHasMounted(true);
    setActiveTab('goals');
  }, [setActiveTab]);

  const handleAddGoal = (data: Omit<Goal, 'id' | 'linkedTaskIds' | 'status' | 'createdAt'>) => {
    addGoal(data);
    setIsAddGoalOpen(false);
    toast({title: "Goal Added!", description: `New objective "${data.name}" created.`});
    playSound('buttonClick');
  };

  const goalsToDisplay = useMemo(() => {
    return (userProfile.goals || []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [userProfile.goals]);

  const activeGoals = useMemo(() => goalsToDisplay.filter(g => g.status === 'active'), [goalsToDisplay]);
  const completedGoals = useMemo(() => goalsToDisplay.filter(g => g.status === 'completed'), [goalsToDisplay]);
  const archivedGoals = useMemo(() => goalsToDisplay.filter(g => g.status === 'archived'), [goalsToDisplay]);

  if (!hasMounted) {
    return (
      <AppWrapper>
        <LoadingScreen />
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-headline text-accent flex items-center">
            <Target className="mr-3 h-7 w-7" /> Your Strategic Objectives
          </h1>
          <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => playSound('buttonClick')}>
                <PlusCircle className="mr-2 h-5 w-5" /> Add New Goal
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-headline text-primary">Define New Goal</DialogTitle>
              </DialogHeader>
              <GoalForm onSave={handleAddGoal} onClose={() => {setIsAddGoalOpen(false); playSound('buttonClick');}} />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-sm border-border">
            <TabsTrigger value="active" className="font-headline" onClick={() => playSound('buttonClick')}>Active ({activeGoals.length})</TabsTrigger>
            <TabsTrigger value="completed" className="font-headline" onClick={() => playSound('buttonClick')}>Completed ({completedGoals.length})</TabsTrigger>
            <TabsTrigger value="archived" className="font-headline" onClick={() => playSound('buttonClick')}>Archived ({archivedGoals.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {activeGoals.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeGoals.map(goal => <GoalItem key={goal.id} goal={goal} tasks={tasks}/>)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No active goals. Time to set some new objectives!</p>
            )}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {completedGoals.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedGoals.map(goal => <GoalItem key={goal.id} goal={goal} tasks={tasks}/>)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No goals completed yet. Keep pushing!</p>
            )}
          </TabsContent>
          <TabsContent value="archived" className="mt-4">
            {archivedGoals.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archivedGoals.map(goal => <GoalItem key={goal.id} goal={goal} tasks={tasks}/>)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No archived goals.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppWrapper>
  );
}

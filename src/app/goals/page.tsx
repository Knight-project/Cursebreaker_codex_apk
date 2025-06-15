
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
import type { Goal, Task } from '@/lib/types';
import { format, parseISO, startOfDay } from 'date-fns';
import { PlusCircle, Edit3, Trash2, CheckCircle, Archive, ArchiveRestore, Target, CalendarIcon as CalendarLucideIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/soundManager';
import { Progress } from '@/components/ui/progress';


interface TargetFormProps {
  initialData?: Goal;
  onSave: (data: Omit<Goal, 'id' | 'linkedTaskIds' | 'createdAt' | 'status'> & { id?: string }) => void;
  onClose: () => void;
}

const TargetForm: React.FC<TargetFormProps> = ({ initialData, onSave, onClose }) => {
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
      toast({ title: "Target Name Required", description: "Please enter a name for your target.", variant: "destructive" });
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
        <Label htmlFor="targetName" className="font-headline">Target Name</Label>
        <Input
          id="targetName"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Master React Hooks"
          className="mt-1 bg-input/50 focus:bg-input"
        />
      </div>
      <div>
        <Label htmlFor="targetDescription" className="font-headline">Description (Optional)</Label>
        <Textarea
          id="targetDescription"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Briefly describe your objective..."
          className="mt-1 bg-input/50 focus:bg-input min-h-[80px]"
        />
      </div>
      <div>
        <Label htmlFor="targetTargetDate" className="font-headline">Target Date (Optional)</Label>
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
        <Button type="submit" className="bg-primary hover:bg-primary/90 mb-2 sm:mb-0">
          {initialData ? "Save Changes" : "Set Target"}
        </Button>
      </DialogFooter>
    </form>
  );
};


const TargetItem: React.FC<{ goal: Goal; tasks: Task[] }> = ({ goal, tasks }) => {
  const { deleteGoal, toggleGoalStatus, updateGoal } = useApp();
  const { toast } = useToast();
  const [isEditOpen, setIsEditOpen] = useState(false);

  const linkedTasks = useMemo(() => {
    return tasks.filter(task => goal.linkedTaskIds.includes(task.id));
  }, [tasks, goal.linkedTaskIds]);

  const completedLinkedTasksCount = useMemo(() => {
    return linkedTasks.filter(task => {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      if (task.taskType === 'ritual') {
        return task.lastCompletedDate === todayStr;
      }
      return task.isCompleted;
    }).length;
  }, [linkedTasks]);


  const progress = linkedTasks.length > 0 ? (completedLinkedTasksCount / linkedTasks.length) * 100 : 0;

  const handleSaveEdit = (data: Omit<Goal, 'id' | 'linkedTaskIds' | 'createdAt' | 'status'> & { id?: string }) => {
    if (data.id) {
      updateGoal({
        id: data.id,
        name: data.name,
        description: data.description,
        targetDate: data.targetDate,
        status: goal.status,
      });
    }
    setIsEditOpen(false);
    toast({title: "Target Updated", description: `"${data.name}" has been modified.`});
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
                <DialogTitle className="font-headline text-primary">Edit Target</DialogTitle>
              </DialogHeader>
              <TargetForm
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
            Target Date: {format(parseISO(goal.targetDate), "MMMM d, yyyy")}
          </p>
        )}
      </CardHeader>
      <CardContent>
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1">
            <span>Progress</span>
            <span>{completedLinkedTasksCount} / {linkedTasks.length} Tasks</span>
          </div>
          <Progress value={progress} className="h-2 bg-secondary" indicatorClassName="bg-primary" />
        </div>
      </CardContent>
      <CardFooter className="flex flex-row flex-nowrap items-center justify-end gap-2">
        {goal.status === 'active' && (
          <Button
            variant="outline"
            size="sm"
            className="border-green-500 text-green-500 hover:bg-green-500 hover:text-primary-foreground"
            onClick={() => {toggleGoalStatus(goal.id, 'completed'); playSound('buttonClick');}}
          >
            <CheckCircle className="mr-2 h-4 w-4" /> Complete
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
          aria-label="Delete Target"
          onClick={() => {
            if(window.confirm(`Are you sure you want to delete the target "${goal.name}"? This cannot be undone.`)) {
              deleteGoal(goal.id);
              toast({title: "Target Removed", description: `"${goal.name}" has been removed.`, variant: "destructive"});
              playSound('buttonClick');
            }
          }}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function GoalsPage() {
  const { userProfile, tasks, addGoal, setActiveTab } = useApp();
  const [hasMounted, setHasMounted] = useState(false);
  const [isAddTargetOpen, setIsAddTargetOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setHasMounted(true);
    setActiveTab('goals');
  }, [setActiveTab]);

  const handleAddTarget = (data: Omit<Goal, 'id' | 'linkedTaskIds' | 'status' | 'createdAt'>) => {
    addGoal(data);
    setIsAddTargetOpen(false);
    toast({title: "Target Set!", description: `New objective "${data.name}" created.`});
    playSound('buttonClick');
  };

  const goalsToDisplay = useMemo(() => {
    return (userProfile.goals || []).sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [userProfile.goals]);

  const activeTargets = useMemo(() => goalsToDisplay.filter(g => g.status === 'active'), [goalsToDisplay]);
  const completedTargets = useMemo(() => goalsToDisplay.filter(g => g.status === 'completed'), [goalsToDisplay]);
  const archivedTargets = useMemo(() => goalsToDisplay.filter(g => g.status === 'archived'), [goalsToDisplay]);

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
            <Target className="mr-3 h-7 w-7" /> Targets
          </h1>
          <Dialog open={isAddTargetOpen} onOpenChange={setIsAddTargetOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90" onClick={() => playSound('buttonClick')}>
                <PlusCircle className="mr-2 h-5 w-5" /> Set New Target
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-card border-border">
              <DialogHeader>
                <DialogTitle className="font-headline text-primary">Set New Target</DialogTitle>
              </DialogHeader>
              <TargetForm onSave={handleAddTarget} onClose={() => {setIsAddTargetOpen(false); playSound('buttonClick');}} />
            </DialogContent>
          </Dialog>
        </div>

        <Tabs defaultValue="active" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-card/80 backdrop-blur-sm border-border">
            <TabsTrigger value="active" className="font-headline" onClick={() => playSound('buttonClick')}>Active ({activeTargets.length})</TabsTrigger>
            <TabsTrigger value="completed" className="font-headline" onClick={() => playSound('buttonClick')}>Completed ({completedTargets.length})</TabsTrigger>
            <TabsTrigger value="archived" className="font-headline" onClick={() => playSound('buttonClick')}>Archived ({archivedTargets.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4">
            {activeTargets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {activeTargets.map(goal => <TargetItem key={goal.id} goal={goal} tasks={tasks}/>)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No active targets. Time to set some new objectives!</p>
            )}
          </TabsContent>
          <TabsContent value="completed" className="mt-4">
            {completedTargets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completedTargets.map(goal => <TargetItem key={goal.id} goal={goal} tasks={tasks}/>)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No targets completed yet. Keep pushing!</p>
            )}
          </TabsContent>
          <TabsContent value="archived" className="mt-4">
            {archivedTargets.length > 0 ? (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {archivedTargets.map(goal => <TargetItem key={goal.id} goal={goal} tasks={tasks}/>)}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No archived targets.</p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppWrapper>
  );
}


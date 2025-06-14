
// src/app/journal/page.tsx
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useApp } from '@/contexts/AppContext';
import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/soundManager';

export default function JournalPage() {
  const { userProfile, setUserProfile, setActiveTab } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentEntry, setCurrentEntry] = useState('');
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();
  
  const formattedSelectedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '';

  useEffect(() => {
    setActiveTab('journal');
  }, [setActiveTab]);

  useEffect(() => {
    if (formattedSelectedDate && userProfile.journalEntries) {
      setCurrentEntry(userProfile.journalEntries[formattedSelectedDate] || '');
    } else {
      setCurrentEntry('');
    }
  }, [formattedSelectedDate, userProfile.journalEntries]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsCalendarOpen(false); // Close the popover on date selection
    playSound('buttonClick');
  };

  const handleSaveEntry = () => {
    if (!formattedSelectedDate) {
      toast({ title: "Error", description: "Please select a date.", variant: "destructive" });
      return;
    }
    setUserProfile(prevProfile => ({
      ...prevProfile,
      journalEntries: {
        ...prevProfile.journalEntries,
        [formattedSelectedDate]: currentEntry,
      },
    }));
    toast({ title: "Journal Entry Saved!", description: `Entry for ${format(selectedDate!, 'MMMM d, yyyy')} updated.` });
    playSound('buttonClick');
  };

  return (
    <AppWrapper>
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl w-full">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-primary">Daily Journal -</span>
              <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={cn(
                      "justify-start text-left font-normal h-auto py-1 px-2.5 text-base border-accent/60 hover:bg-accent/10 focus-visible:border-accent",
                       selectedDate ? "text-accent hover:text-accent" : "text-accent/70 italic hover:text-accent/90"
                    )}
                    onClick={() => {setIsCalendarOpen(!isCalendarOpen); playSound('buttonClick');}}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-popover border-border" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={handleDateSelect}
                    disabled={(date) => date > new Date()} 
                    initialFocus
                    className="rounded-md border-0 bg-popover"
                  />
                </PopoverContent>
              </Popover>
            </CardTitle>
            <CardDescription>Reflect on your progress, thoughts, and challenges.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              value={currentEntry}
              onChange={(e) => setCurrentEntry(e.target.value)}
              placeholder="Begin your entry here... What challenges did you overcome? What are your goals for tomorrow?"
              className="min-h-[300px] bg-input/30 focus:bg-input text-base"
              disabled={!selectedDate}
            />
            <Button onClick={handleSaveEntry} disabled={!selectedDate} className="w-full bg-primary hover:bg-primary/80">
              Save Entry
            </Button>
          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
}


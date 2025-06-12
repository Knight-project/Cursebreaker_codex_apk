// src/app/journal/page.tsx
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useApp } from '@/contexts/AppContext';
import React, { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

export default function JournalPage() {
  const { userProfile, setUserProfile, setActiveTab } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentEntry, setCurrentEntry] = useState('');
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
  };

  return (
    <AppWrapper>
      <div className="space-y-6 md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-xl text-primary">Select Date</CardTitle>
            </CardHeader>
            <CardContent className="flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={handleDateSelect}
                className="rounded-md border bg-popover"
                disabled={(date) => date > new Date()} // Disable future dates
              />
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2">
          <Card className="bg-card/80 backdrop-blur-sm shadow-xl">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-accent">
                Daily Journal - {selectedDate ? format(selectedDate, 'MMMM d, yyyy') : 'No date selected'}
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
      </div>
    </AppWrapper>
  );
}


// src/app/journal/page.tsx
'use client';

import AppWrapper from '@/components/layout/AppWrapper';
import LoadingScreen from '@/components/layout/LoadingScreen';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { useApp } from '@/contexts/AppContext';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { playSound } from '@/lib/soundManager';

const HOURS_OF_DAY = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

export default function JournalPage() {
  const { userProfile, setUserProfile, setActiveTab: setAppActiveTab } = useApp();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [currentDailyEntry, setCurrentDailyEntry] = useState('');
  const [currentHourlyNotes, setCurrentHourlyNotes] = useState<{ [hour: string]: string }>({});
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const { toast } = useToast();
  const [activeLocalTab, setActiveLocalTab] = useState('daily');
  const hourlyInputRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const [hasMounted, setHasMounted] = useState(false);
  
  const formattedSelectedDate = useMemo(() => selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '', [selectedDate]);

  useEffect(() => {
    setHasMounted(true);
    setAppActiveTab('journal');
  }, [setAppActiveTab]);

  useEffect(() => {
    if (!hasMounted || !formattedSelectedDate) {
      setCurrentDailyEntry('');
      setCurrentHourlyNotes({});
      return;
    }
    setCurrentDailyEntry(userProfile.journalEntries?.[formattedSelectedDate] || '');
    setCurrentHourlyNotes(userProfile.hourlyJournalEntries?.[formattedSelectedDate] || {});
  }, [formattedSelectedDate, userProfile.journalEntries, userProfile.hourlyJournalEntries, hasMounted]);

  useEffect(() => {
    if (!hasMounted) return;
    if (activeLocalTab === 'hourly' && selectedDate && format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')) {
      const currentHour = new Date().getHours();
      const currentHourStr = `${String(currentHour).padStart(2, '0')}:00`;
      
      requestAnimationFrame(() => {
        setTimeout(() => {
          const targetInput = hourlyInputRefs.current[currentHourStr];
          if (targetInput) {
            if (document.body.contains(targetInput) && targetInput.offsetParent !== null) {
              targetInput.focus();
              targetInput.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
            }
          }
        }, 150);
      });
    }
  }, [activeLocalTab, selectedDate, hasMounted]);

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date);
    setIsCalendarOpen(false);
    playSound('buttonClick');
  };

  const handleSaveDailyEntry = () => {
    if (!hasMounted || !formattedSelectedDate) {
      toast({ title: "Error", description: "Please select a date.", variant: "destructive" });
      return;
    }
    setUserProfile(prevProfile => ({
      ...prevProfile,
      journalEntries: {
        ...prevProfile.journalEntries,
        [formattedSelectedDate]: currentDailyEntry,
      },
    }));
    toast({ title: "Daily Entry Saved!", description: `Entry for ${format(selectedDate!, 'MMMM d, yyyy')} updated.` });
    playSound('buttonClick');
  };

  const handleHourlyNoteChange = (hour: string, text: string) => {
    if (!hasMounted) return;
    setCurrentHourlyNotes(prev => ({ ...prev, [hour]: text }));
  };

  const handleSaveHourlyNote = (hour: string) => {
    if (!hasMounted || !formattedSelectedDate) return;
    
    const noteToSave = currentHourlyNotes[hour];

    setUserProfile(prevProfile => {
      const dayEntries = prevProfile.hourlyJournalEntries?.[formattedSelectedDate] || {};
      const updatedDayEntries = { ...dayEntries, [hour]: noteToSave };
      
      return {
        ...prevProfile,
        hourlyJournalEntries: {
          ...prevProfile.hourlyJournalEntries,
          [formattedSelectedDate]: updatedDayEntries,
        },
      };
    });
  };

  if (!hasMounted) {
    return (
      <AppWrapper>
        <LoadingScreen />
      </AppWrapper>
    );
  }

  return (
    <AppWrapper>
      <div className="space-y-6 max-w-2xl mx-auto">
        <Card className="bg-card/80 backdrop-blur-sm shadow-xl w-full">
          <CardHeader>
            <CardTitle className="font-headline text-xl flex flex-wrap items-baseline gap-x-2 gap-y-1">
              <span className="text-primary">Journal Archive -</span>
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
            <CardDescription>Capture your daily reflections and hourly observations.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs 
              value={activeLocalTab} 
              onValueChange={(value) => {
                setActiveLocalTab(value);
                playSound('buttonClick');
              }} 
              defaultValue="daily" 
              className="w-full"
            >
              <TabsList className="grid w-full grid-cols-2 bg-card/80 backdrop-blur-sm border-border">
                <TabsTrigger value="daily" className="font-headline">Daily Entry</TabsTrigger>
                <TabsTrigger value="hourly" className="font-headline">Hourly Log</TabsTrigger>
              </TabsList>
              
              <TabsContent value="daily" className="mt-4">
                <Textarea
                  value={currentDailyEntry}
                  onChange={(e) => setCurrentDailyEntry(e.target.value)}
                  placeholder="Begin your daily reflection here... What challenges did you overcome? What are your goals for tomorrow?"
                  className="min-h-[300px] bg-input/30 focus:bg-input text-base"
                  disabled={!selectedDate}
                />
                <Button onClick={handleSaveDailyEntry} disabled={!selectedDate} className="w-full mt-4 bg-primary hover:bg-primary/80">
                  Save Daily Entry
                </Button>
              </TabsContent>

              <TabsContent value="hourly" className="mt-4">
                {formattedSelectedDate ? (
                  <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    {HOURS_OF_DAY.map(hour => (
                      <div key={hour} className="flex items-start space-x-3 p-2 border-b border-border/50 last:border-b-0">
                        <Label htmlFor={`hourly-note-${hour}`} className="w-16 pt-2 text-sm text-muted-foreground font-mono">{hour}</Label>
                        <Textarea
                          id={`hourly-note-${hour}`}
                          ref={(el) => (hourlyInputRefs.current[hour] = el)}
                          value={currentHourlyNotes[hour] || ''}
                          onChange={(e) => handleHourlyNoteChange(hour, e.target.value)}
                          onBlur={() => handleSaveHourlyNote(hour)}
                          placeholder={`Notes for ${hour}...`}
                          className="flex-1 min-h-[60px] max-h-[120px] bg-input/30 focus:bg-input text-sm"
                          rows={2}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">Please select a date to view or add hourly notes.</p>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </AppWrapper>
  );
}

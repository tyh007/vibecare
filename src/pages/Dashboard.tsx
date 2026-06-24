import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Heart, LogOut, CalendarDays, LayoutGrid, Brain, BookOpen, Tag, Menu, X, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { MoodTimeline } from "@/components/MoodTimeline";
import { AddEventDialog } from "@/components/AddEventDialog";
import { SuggestionEngine } from "@/components/SuggestionEngine";
import { CalendarWeekView } from "@/components/calendar/CalendarWeekView";
import { CalendarMonthView } from "@/components/calendar/CalendarMonthView";
import { NotesEditorSidebar } from "@/components/calendar/NotesEditorSidebar";
import { VibePartner } from "@/components/mascot/VibePartner";
import { useRewardSystem } from "@/hooks/useRewardSystem";
import { format, subDays, parseISO } from "date-fns";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";

interface MoodEntry {
  date: string;
  mood: number;
  events: string[];
}

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  date: string;
  category: string;
  notes?: string;
  color?: string;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [calendarView, setCalendarView] = useState<'day' | 'week' | 'month'>('week');
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isNotesOpen, setIsNotesOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  
  const rewardSystem = useRewardSystem();
  const [partnerName, setPartnerName] = useState(() => 
    localStorage.getItem('vibePartnerName') || 'Vibe Buddy'
  );
  const [partnerType, setPartnerType] = useState<'cat' | 'dog' | 'panda'>(() => 
    (localStorage.getItem('vibePartnerType') as 'cat' | 'dog' | 'panda') || 'cat'
  );
  const [addEventInitialDate, setAddEventInitialDate] = useState<Date | undefined>(calendarDate);
  
  const categories = [
    { id: 'all', name: 'All Events', icon: LayoutGrid, color: 'hsl(var(--primary))' },
    { id: 'academic', name: 'Academic', icon: BookOpen, color: '#8b5cf6' },
    { id: 'personal', name: 'Personal', icon: Heart, color: '#ec4899' },
    { id: 'wellness', name: 'Wellness', icon: Brain, color: '#10b981' },
  ];
  
  const [moodHistory, setMoodHistory] = useState<MoodEntry[]>(() => {
    const saved = localStorage.getItem('vc_moods');
    if (saved) {
      try { return JSON.parse(saved) as MoodEntry[]; } catch {}
    }
    return [
      { date: format(subDays(new Date(), 6), 'yyyy-MM-dd'), mood: 3, events: ['CS101 Lecture', 'Study Group'] },
      { date: format(subDays(new Date(), 5), 'yyyy-MM-dd'), mood: 4, events: ['Gym', 'Coffee with friends'] },
      { date: format(subDays(new Date(), 4), 'yyyy-MM-dd'), mood: 3, events: ['Statistics Exam', 'Library Session'] },
      { date: format(subDays(new Date(), 3), 'yyyy-MM-dd'), mood: 4, events: ['CS Lab', 'Meditation'] },
      { date: format(subDays(new Date(), 2), 'yyyy-MM-dd'), mood: 4, events: ['Group Project', 'Yoga Class'] },
      { date: format(subDays(new Date(), 1), 'yyyy-MM-dd'), mood: 5, events: ['Volunteer Work', 'Movie Night'] },
      { date: format(new Date(), 'yyyy-MM-dd'), mood: 5, events: ['Morning Walk', 'Productive Study Session'] },
    ];
  });

  const [events, setEvents] = useState<CalendarEvent[]>(() => {
    const saved = localStorage.getItem('vc_events');
    if (saved) {
      try { return JSON.parse(saved) as CalendarEvent[]; } catch {}
    }
    return [
      {
        id: '1',
        title: 'Introduction to Psychology',
        start: '2024-03-25T09:00',
        end: '2024-03-25T10:30',
        date: '2024-03-25',
        category: 'academic',
        color: '#8b5cf6'
      },
      {
        id: '2',
        title: 'Calculus II',
        start: '2024-03-25T14:00',
        end: '2024-03-25T15:30',
        date: '2024-03-25',
        category: 'academic',
        color: '#8b5cf6'
      }
    ];
  });

  useEffect(() => {
    localStorage.setItem('vc_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('vc_moods', JSON.stringify(moodHistory));
  }, [moodHistory]);

  const handleMoodSelect = (mood: number) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const newEntry: MoodEntry = {
      date: today,
      mood: mood + 1,
      events: []
    };

    const existingIndex = moodHistory.findIndex(entry => entry.date === today);
    if (existingIndex >= 0) {
      setMoodHistory(prev => prev.map((entry, idx) => 
        idx === existingIndex ? newEntry : entry
      ));
    } else {
      setMoodHistory(prev => [...prev, newEntry]);
    }

    setSelectedMood(mood);
    rewardSystem.rewardMoodCheckIn();
    
    toast({
      title: "Mood logged! 📊",
      description: "Great job checking in with yourself.",
    });
  };

  const handleAddEvent = (event?: Omit<CalendarEvent, 'id'> & { date?: Date }) => {
    if (event) {
      const eventDate = event.date && !isNaN(event.date.getTime())
        ? format(event.date, 'yyyy-MM-dd')
        : format(new Date(), 'yyyy-MM-dd');
        
      const newEvent: CalendarEvent = {
        id: Date.now().toString(),
        title: event.title,
        start: event.start,
        end: event.end,
        date: eventDate,
        category: event.category,
        notes: event.notes,
        color: event.category === 'academic' ? '#8b5cf6' : event.category === 'personal' ? '#ec4899' : '#10b981'
      };
      
      setEvents([...events, newEvent]);
      rewardSystem.rewardEventCreation();
      
      toast({
        title: "Event added! ✅",
        description: "Your schedule is looking organized.",
      });
      
      setIsAddEventOpen(false);
    } else {
      setIsAddEventOpen(true);
    }
  };

  const handleAcceptSuggestion = (suggestion: { title: string; category: string }) => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const newEvent: CalendarEvent = {
      id: Date.now().toString(),
      title: suggestion.title,
      start: format(tomorrow, "yyyy-MM-dd'T'10:00"),
      end: format(tomorrow, "yyyy-MM-dd'T'11:00"),
      date: format(tomorrow, 'yyyy-MM-dd'),
      category: suggestion.category,
      color: suggestion.category === 'academic' ? '#8b5cf6' : suggestion.category === 'personal' ? '#ec4899' : '#10b981'
    };
    
    setEvents([...events, newEvent]);
    rewardSystem.rewardActivityCompletion();
    
    toast({
      title: "Suggestion accepted! 💡",
      description: "Added to your calendar.",
    });
  };

  const handleLogout = () => {
    navigate('/auth');
    toast({
      title: "Logged out",
      description: "See you next time!",
    });
  };

  const handleViewChange = (view: 'day' | 'week' | 'month') => {
    setCalendarView(view);
  };
  
  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter(e => e.id !== eventId));
    setSelectedEvent(null);
    setIsNotesOpen(false);
    
    toast({
      title: "Event deleted",
      description: "The event has been removed.",
    });
  };
  
  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsNotesOpen(true);
  };
  
  const handleTimeSlotClick = (date: Date, time: string) => {
    setAddEventInitialDate(date);
    setIsAddEventOpen(true);
  };
  
  const handleDateClick = (date: Date) => {
    setCalendarDate(date);
    setCalendarView('week');
  };
  
  const handleSaveNotes = (eventId: string, notes: string) => {
    setEvents(events.map(e => 
      e.id === eventId ? { ...e, notes } : e
    ));
    rewardSystem.rewardNotesTaken();
  };

  const filteredEvents = selectedCategory === 'all' 
    ? events 
    : events.filter(e => e.category === selectedCategory);

  return (
    <div className="min-h-screen flex flex-col w-full bg-forest">
      {/* Main Content Area with Resizable Panels */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Desktop: Resizable Layout */}
        <div className="hidden lg:flex flex-1">
          <ResizablePanelGroup direction="horizontal">
            {/* Central Calendar Panel */}
            <ResizablePanel defaultSize={65} minSize={50}>
              <div className="h-full overflow-y-auto">
                <div className="p-6 space-y-6">
                  {/* Vibe Partner */}
                  <button
                    onClick={() => navigate('/vibe-partner')}
                    className="w-full transition-opacity"
                  >
                    <VibePartner
                      points={rewardSystem.points}
                      level={rewardSystem.level}
                      name={partnerName}
                      type={partnerType}
                      mood={moodHistory[moodHistory.length - 1]?.mood}
                      onCustomize={() => {
                        setPartnerName(localStorage.getItem('vibePartnerName') || 'Vibe Buddy');
                        setPartnerType((localStorage.getItem('vibePartnerType') as 'cat' | 'dog' | 'panda') || 'cat');
                      }}
                    />
                  </button>

                  <Card className="p-4 bg-card/75 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-semibold text-foreground">Quick Mood Check</h3>
                      <Heart className="w-5 h-5 text-secondary" />
                    </div>
                    <div className="flex justify-between gap-2">
                      {['😢', '😕', '😐', '🙂', '😊'].map((emoji, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleMoodSelect(idx)}
                          className={`w-12 h-12 rounded-full transition-all text-2xl flex items-center justify-center ${
                            selectedMood === idx 
                              ? 'bg-primary text-primary-foreground shadow-lg scale-110' 
                              : 'bg-muted hover:bg-primary/10 hover:scale-105'
                          }`}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground text-center mt-2">How are you feeling right now?</p>
                  </Card>

                  {/* Calendar Controls */}
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="flex gap-2">
                      <Button
                        variant={calendarView === 'week' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('week')}
                      >
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Week
                      </Button>
                      <Button
                        variant={calendarView === 'month' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleViewChange('month')}
                      >
                        <LayoutGrid className="w-4 h-4 mr-2" />
                        Month
                      </Button>
                    </div>
                    <Button variant="default" size="sm" onClick={() => setIsAddEventOpen(true)}>
                      <Calendar className="w-4 h-4 mr-2" />
                      Add Event
                    </Button>
                  </div>

                  {/* Calendar View */}
                  {calendarView === 'week' ? (
                    <CalendarWeekView
                      events={filteredEvents}
                      moods={moodHistory}
                      currentDate={calendarDate}
                      onDateChange={setCalendarDate}
                      onEventClick={handleEventClick}
                      onTimeSlotClick={handleTimeSlotClick}
                    />
                  ) : (
                    <CalendarMonthView
                      events={filteredEvents}
                      moods={moodHistory}
                      currentDate={calendarDate}
                      onDateChange={setCalendarDate}
                      onDateClick={handleDateClick}
                    />
                  )}

                  {/* Mood Timeline */}
                  <MoodTimeline data={moodHistory} />

                  {/* Suggestion Engine */}
                  <SuggestionEngine 
                    events={filteredEvents}
                    onAcceptSuggestion={handleAcceptSuggestion}
                  />
                </div>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Right Context Panel */}
            <ResizablePanel defaultSize={30} minSize={25} maxSize={40}>
              <aside className="h-full border-l border-border bg-card/75 backdrop-blur-sm overflow-y-auto">
                <NotesEditorSidebar
                  event={selectedEvent}
                  isOpen={isNotesOpen || !!selectedEvent}
                  onClose={() => {
                    setIsNotesOpen(false);
                    setSelectedEvent(null);
                  }}
                  onSave={handleSaveNotes}
                  onUpdate={(eventId: string, updates: Partial<CalendarEvent>) => {
                    setEvents(prev => prev.map(e => 
                      e.id === eventId ? { ...e, ...updates } : e
                    ));
                  }}
                  onDelete={handleDeleteEvent}
                />
              </aside>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Mobile: Original Layout */}
        <main className="flex-1 lg:hidden overflow-y-auto">
          <div className="p-4 space-y-6">
            {/* Vibe Partner */}
            <button
              onClick={() => navigate('/vibe-partner')}
              className="w-full transition-opacity"
            >
              <VibePartner
                points={rewardSystem.points}
                level={rewardSystem.level}
                name={partnerName}
                type={partnerType}
                mood={moodHistory[moodHistory.length - 1]?.mood}
                onCustomize={() => {
                  setPartnerName(localStorage.getItem('vibePartnerName') || 'Vibe Buddy');
                  setPartnerType((localStorage.getItem('vibePartnerType') as 'cat' | 'dog' | 'panda') || 'cat');
                }}
              />
            </button>

            <Card className="p-4 bg-card/75 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground">Quick Mood Check</h3>
                <Heart className="w-5 h-5 text-secondary" />
              </div>
              <div className="flex justify-between gap-2">
                {['😢', '😕', '😐', '🙂', '😊'].map((emoji, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleMoodSelect(idx)}
                    className={`w-12 h-12 rounded-full transition-all text-2xl flex items-center justify-center ${
                      selectedMood === idx 
                        ? 'bg-primary text-primary-foreground shadow-lg scale-110' 
                        : 'bg-muted hover:bg-primary/10 hover:scale-105'
                    }`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">How are you feeling right now?</p>
            </Card>

            {/* Calendar Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-2">
                <Button
                  variant={calendarView === 'week' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewChange('week')}
                >
                  <CalendarDays className="w-4 h-4 mr-2" />
                  Week
                </Button>
                <Button
                  variant={calendarView === 'month' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleViewChange('month')}
                >
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Month
                </Button>
              </div>
              <Button variant="default" size="sm" onClick={() => setIsAddEventOpen(true)}>
                <Calendar className="w-4 h-4 mr-2" />
                Add Event
              </Button>
            </div>

            {/* Calendar View */}
            {calendarView === 'week' ? (
              <CalendarWeekView
                events={filteredEvents}
                moods={moodHistory}
                currentDate={calendarDate}
                onDateChange={setCalendarDate}
                onEventClick={handleEventClick}
                onTimeSlotClick={handleTimeSlotClick}
              />
            ) : (
              <CalendarMonthView
                events={filteredEvents}
                moods={moodHistory}
                currentDate={calendarDate}
                onDateChange={setCalendarDate}
                onDateClick={handleDateClick}
              />
            )}
          </div>

          {/* Mobile Notes Overlay */}
          {(selectedEvent || isNotesOpen) && (
            <div className="fixed inset-0 z-40 bg-card/75 backdrop-blur-sm">
              <NotesEditorSidebar
                event={selectedEvent}
                isOpen={true}
                onClose={() => {
                  setIsNotesOpen(false);
                  setSelectedEvent(null);
                }}
                onSave={handleSaveNotes}
                onUpdate={(eventId: string, updates: Partial<CalendarEvent>) => {
                  setEvents(prev => prev.map(e => 
                    e.id === eventId ? { ...e, ...updates } : e
                  ));
                }}
                onDelete={handleDeleteEvent}
              />
            </div>
          )}
        </main>
      </div>

      {/* Dialogs */}
      <AddEventDialog
        open={isAddEventOpen}
        onOpenChange={setIsAddEventOpen}
        onAddEvent={handleAddEvent}
        initialDate={addEventInitialDate}
      />
    </div>
  );
};

export default Dashboard;

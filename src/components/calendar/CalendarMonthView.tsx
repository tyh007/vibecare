import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, isSameMonth, isSameDay, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface MoodEntry {
  date: string;
  mood: number;
  events: string[];
}

interface CalendarMonthViewProps {
  events: CalendarEvent[];
  moods: MoodEntry[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onDateClick: (date: Date) => void;
}

const moodColors = [
  'bg-destructive/10',
  'bg-warning/10',
  'bg-muted/10',
  'bg-secondary/10',
  'bg-success/10'
];

const categoryColors: Record<string, string> = {
  class: 'text-[#8b5cf6]',
  study: 'text-[#ec4899]',
  wellness: 'text-[#10b981]',
  social: 'text-[#f59e0b]',
  other: 'text-[#6b7280]',
};

export const CalendarMonthView = ({
  events,
  moods,
  currentDate,
  onDateChange,
  onDateClick,
}: CalendarMonthViewProps) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const getEventsForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateStr);
  };
  
  const getMoodForDay = (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return moods.find(m => m.date === dateStr);
  };
  
  const hasNotes = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    return dayEvents.some(e => e.notes);
  };
  
  const getDays = () => {
    const days = [];
    let day = calendarStart;
    
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    
    return days;
  };
  
  const getStudyIntensity = (date: Date) => {
    const dayEvents = getEventsForDay(date);
    const studyEvents = dayEvents.filter(e => e.category === 'study' || e.category === 'class');
    
    if (studyEvents.length === 0) return 'bg-card';
    if (studyEvents.length === 1) return 'bg-primary/5';
    if (studyEvents.length === 2) return 'bg-primary/10';
    return 'bg-primary/20';
  };

  const goToPreviousMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    onDateChange(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    onDateChange(newDate);
  };

  return (
    <Card className="p-6 bg-card shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => onDateChange(new Date())}>
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <h3 className="font-semibold text-lg">
          {format(currentDate, 'MMMM yyyy')}
        </h3>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 gap-px bg-border mb-px">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="bg-card p-2 text-center text-sm font-medium">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-border">
        <TooltipProvider>
          {getDays().map(day => {
            const dayEvents = getEventsForDay(day);
            const mood = getMoodForDay(day);
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isToday = isSameDay(day, new Date());
            const intensity = getStudyIntensity(day);
            const moodBg = mood ? moodColors[mood.mood - 1] : '';
            
            return (
              <Tooltip key={day.toString()}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onDateClick(day)}
                    className={`
                      min-h-[100px] p-2 text-left relative
                      ${intensity}
                      ${moodBg}
                      ${!isCurrentMonth ? 'opacity-40' : ''}
                      ${isToday ? 'ring-2 ring-primary ring-inset' : ''}
                      hover:bg-muted/50 transition-colors
                    `}
                  >
                    {/* Date number */}
                    <div className={`
                      text-sm font-medium mb-1
                      ${isToday ? 'text-primary font-bold' : ''}
                    `}>
                      {format(day, 'd')}
                    </div>
                    
                    {/* Events */}
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 2).map(event => {
                        const timeStr = event.start.includes(':') && !event.start.includes('T')
                          ? event.start.substring(0, 5)
                          : format(parseISO(event.start), 'HH:mm');
                        
                        return (
                          <div
                            key={event.id}
                            className={`text-[10px] font-medium truncate ${categoryColors[event.category] || categoryColors.other}`}
                          >
                            {timeStr} {event.title}
                          </div>
                        );
                      })}
                      {dayEvents.length > 2 && (
                        <div className="text-[10px] text-muted-foreground">
                          +{dayEvents.length - 2} more
                        </div>
                      )}
                    </div>
                    
                    {/* Indicators */}
                    <div className="absolute bottom-1 right-1 flex gap-1">
                      {hasNotes(day) && (
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      )}
                    </div>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs">
                  <div className="space-y-1">
                    <p className="font-semibold">{format(day, 'EEEE, MMM d')}</p>
                    {dayEvents.length > 0 ? (
                      <ul className="text-xs space-y-0.5">
                        {dayEvents.map(event => (
                          <li key={event.id}>• {event.title}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-muted-foreground">No events</p>
                    )}
                    {mood && (
                      <p className="text-xs">Mood: {['😢', '😕', '😐', '🙂', '😊'][mood.mood - 1]}</p>
                    )}
                  </div>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </TooltipProvider>
      </div>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-primary/20" />
          <span className="text-muted-foreground">High study intensity</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-primary" />
          <span className="text-muted-foreground">Has notes</span>
        </div>
      </div>
    </Card>
  );
};

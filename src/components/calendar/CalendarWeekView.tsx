import { useState, useEffect } from "react";
import { format, startOfWeek, addDays, addMinutes, parseISO } from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

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

interface CalendarWeekViewProps {
  events: CalendarEvent[];
  moods: MoodEntry[];
  currentDate: Date;
  onDateChange: (date: Date) => void;
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick: (date: Date, time: string) => void;
}

const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 10 PM
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const moodEmojis = ['😢', '😕', '😐', '🙂', '😊'];

const categoryColors: Record<string, string> = {
  class: '#8b5cf6',
  study: '#ec4899',
  wellness: '#10b981',
  social: '#f59e0b',
  other: '#6b7280',
};

export const CalendarWeekView = ({
  events,
  moods,
  currentDate,
  onDateChange,
  onEventClick,
  onTimeSlotClick,
}: CalendarWeekViewProps) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const weekStart = startOfWeek(currentDate);
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);
  
  const getEventsForDay = (dayDate: Date) => {
    const dateStr = format(dayDate, 'yyyy-MM-dd');
    return events.filter(event => event.date === dateStr);
  };
  
  const getMoodForDay = (dayDate: Date) => {
    const dateStr = format(dayDate, 'yyyy-MM-dd');
    return moods.find(m => m.date === dateStr);
  };
  
  const getEventPosition = (event: CalendarEvent) => {
    let startTime: { hour: number; minute: number };
    let endTime: { hour: number; minute: number };
    
    if (event.start.includes(':') && !event.start.includes('T')) {
      const [startHour, startMin] = event.start.split(':').map(Number);
      const [endHour, endMin] = event.end.split(':').map(Number);
      startTime = { hour: startHour, minute: startMin };
      endTime = { hour: endHour, minute: endMin };
    } else {
      const startDate = parseISO(event.start);
      const endDate = parseISO(event.end);
      startTime = { hour: startDate.getHours(), minute: startDate.getMinutes() };
      endTime = { hour: endDate.getHours(), minute: endDate.getMinutes() };
    }
    
    const startMinutes = (startTime.hour - 7) * 60 + startTime.minute;
    const endMinutes = (endTime.hour - 7) * 60 + endTime.minute;
    const duration = endMinutes - startMinutes;
    
    return {
      top: `${(startMinutes / 60) * 60}px`,
      height: `${(duration / 60) * 60}px`,
    };
  };
  
  const getCurrentTimePosition = () => {
    const hour = currentTime.getHours();
    const minute = currentTime.getMinutes();
    if (hour < 7 || hour >= 22) return null;
    const totalMinutes = (hour - 7) * 60 + minute;
    return (totalMinutes / 60) * 60;
  };
  
  const isToday = (date: Date) => {
    return format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  };

  return (
    <Card className="p-6 bg-card shadow-soft overflow-hidden">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDateChange(addDays(weekStart, -7))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDateChange(new Date())}
          >
            Today
          </Button>
          <Button
            variant="outline"
            size="icon"
            onClick={() => onDateChange(addDays(weekStart, 7))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <h3 className="font-semibold text-lg">
          Week of {format(weekStart, 'MMM d, yyyy')}
        </h3>
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Day headers */}
          <div className="grid grid-cols-8 gap-px bg-border mb-px">
            <div className="bg-card p-2" /> {/* Time column header */}
            {DAYS.map((day, idx) => {
              const dayDate = addDays(weekStart, idx);
              const mood = getMoodForDay(dayDate);
              const today = isToday(dayDate);
              
              return (
                <div
                  key={day}
                  className={`bg-card p-2 text-center ${
                    today ? 'bg-primary/10 font-bold' : ''
                  }`}
                >
                  <div className="text-sm font-medium">{day}</div>
                  <div className={`text-lg ${today ? 'text-primary' : ''}`}>
                    {format(dayDate, 'd')}
                  </div>
                  {mood && (
                    <div className="text-xl mt-1">{moodEmojis[mood.mood - 1]}</div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Time slots */}
          <div className="relative">
            <div className="grid grid-cols-8 gap-px bg-border">
              {/* Time labels column */}
              <div className="bg-card">
                {HOURS.map(hour => (
                  <div
                    key={hour}
                    className="h-[60px] border-b border-border flex items-start justify-end pr-2 text-xs text-muted-foreground"
                  >
                    {format(new Date().setHours(hour, 0), 'h a')}
                  </div>
                ))}
              </div>

              {/* Day columns */}
              {DAYS.map((day, dayIdx) => {
                const dayDate = addDays(weekStart, dayIdx);
                const dayEvents = getEventsForDay(dayDate);
                
                return (
                  <div key={day} className="relative bg-card">
                    {/* Hour slots */}
                    {HOURS.map(hour => (
                      <button
                        key={hour}
                        onClick={() => onTimeSlotClick(dayDate, `${hour.toString().padStart(2, '0')}:00`)}
                        className="w-full h-[60px] border-b border-border hover:bg-muted/50 transition-colors text-left"
                      />
                    ))}

                    {/* Events */}
                    {dayEvents.map(event => {
                      const position = getEventPosition(event);
                      const color = event.color || categoryColors[event.category] || categoryColors.other;
                      
                      return (
                        <button
                          key={event.id}
                          onClick={() => onEventClick(event)}
                          className="absolute left-1 right-1 rounded px-2 py-1 text-xs font-medium overflow-hidden hover:opacity-90 transition-opacity text-white text-left"
                          style={{
                            top: position.top,
                            height: position.height,
                            backgroundColor: color,
                            minHeight: '24px',
                          }}
                        >
                          <div className="font-semibold truncate">{event.title}</div>
                          {event.notes && (
                            <div className="text-[10px] opacity-90 truncate mt-0.5">
                              📝 {event.notes}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>

            {/* Current time indicator */}
            {getCurrentTimePosition() !== null && (
              <div
                className="absolute left-0 right-0 h-0.5 bg-destructive z-10 pointer-events-none"
                style={{ top: `${getCurrentTimePosition()}px` }}
              >
                <div className="absolute -left-1 -top-1.5 w-3 h-3 rounded-full bg-destructive" />
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Calendar, Plus, Sparkles } from "lucide-react";
import { useState } from "react";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  category: string;
  notes?: string;
}

interface FreeSlot {
  start: string;
  end: string;
  duration: number;
}

interface CalendarDropZoneProps {
  events: CalendarEvent[];
  onDropSuggestion: (suggestionData: any, slotStart: string) => void;
}

// Detect free time slots
const detectFreeSlots = (events: CalendarEvent[]): FreeSlot[] => {
  const freeSlots: FreeSlot[] = [];
  const sortedEvents = [...events].sort((a, b) => 
    a.start.localeCompare(b.start)
  );
  
  // Define work hours (8 AM to 8 PM)
  const workStart = "08:00";
  const workEnd = "20:00";
  
  if (sortedEvents.length === 0) {
    freeSlots.push({
      start: workStart,
      end: workEnd,
      duration: 720 // 12 hours
    });
    return freeSlots;
  }
  
  // Check before first event
  if (sortedEvents[0].start > workStart) {
    freeSlots.push({
      start: workStart,
      end: sortedEvents[0].start,
      duration: getMinutesBetween(workStart, sortedEvents[0].start)
    });
  }
  
  // Check gaps between events
  for (let i = 0; i < sortedEvents.length - 1; i++) {
    const currentEnd = sortedEvents[i].end;
    const nextStart = sortedEvents[i + 1].start;
    
    if (currentEnd < nextStart) {
      const duration = getMinutesBetween(currentEnd, nextStart);
      if (duration >= 15) { // Only show slots 15+ minutes
        freeSlots.push({
          start: currentEnd,
          end: nextStart,
          duration
        });
      }
    }
  }
  
  // Check after last event
  const lastEvent = sortedEvents[sortedEvents.length - 1];
  if (lastEvent.end < workEnd) {
    freeSlots.push({
      start: lastEvent.end,
      end: workEnd,
      duration: getMinutesBetween(lastEvent.end, workEnd)
    });
  }
  
  return freeSlots;
};

const getMinutesBetween = (start: string, end: string): number => {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
};

export const CalendarDropZone = ({ events, onDropSuggestion }: CalendarDropZoneProps) => {
  const [dragOverSlot, setDragOverSlot] = useState<string | null>(null);
  const freeSlots = detectFreeSlots(events);
  
  const handleDragOver = (e: React.DragEvent, slotStart: string) => {
    e.preventDefault();
    setDragOverSlot(slotStart);
  };
  
  const handleDragLeave = () => {
    setDragOverSlot(null);
  };
  
  const handleDrop = (e: React.DragEvent, slotStart: string) => {
    e.preventDefault();
    setDragOverSlot(null);
    
    // Get suggestion data from drag event
    // In a real implementation, this would be passed through dataTransfer
    // For now, we'll emit the event and let parent handle it
    onDropSuggestion(null, slotStart);
  };
  
  const categoryColors: Record<string, string> = {
    class: 'bg-primary',
    study: 'bg-secondary',
    wellness: 'bg-success',
    social: 'bg-accent',
    other: 'bg-muted-foreground',
  };
  
  return (
    <Card className="p-6 bg-card shadow-soft">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Calendar className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold text-card-foreground">Today's Schedule</h2>
        </div>
      </div>

      <div className="space-y-4">
        {events.length === 0 && freeSlots.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No events scheduled yet.</p>
          </div>
        ) : (
          <>
            {/* Render events with free slots in between */}
            {events.map((event, idx) => {
              // Find if there's a free slot before this event
              const freeSlotBefore = freeSlots.find(slot => 
                slot.end === event.start
              );
              
              return (
                <div key={event.id}>
                  {/* Free slot before event */}
                  {freeSlotBefore && (
                    <div
                      onDragOver={(e) => handleDragOver(e, freeSlotBefore.start)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, freeSlotBefore.start)}
                      className={`flex gap-4 p-4 rounded-lg border-2 border-dashed transition-all ${
                        dragOverSlot === freeSlotBefore.start
                          ? 'border-primary bg-primary/10 scale-105'
                          : 'border-success/30 bg-success/5 hover:border-success/50'
                      }`}
                    >
                      <div className="text-center min-w-[60px]">
                        <p className="text-sm font-semibold text-foreground">
                          {freeSlotBefore.start}
                        </p>
                        <p className="text-xs text-muted-foreground">to</p>
                        <p className="text-sm font-semibold text-foreground">
                          {freeSlotBefore.end}
                        </p>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                          <div className="flex items-center justify-center gap-2 mb-1">
                            <Sparkles className="w-4 h-4 text-success" />
                            <p className="font-medium text-success">Free Time</p>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {dragOverSlot === freeSlotBefore.start 
                              ? 'Drop suggestion here!' 
                              : `${freeSlotBefore.duration} min available`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Actual event */}
                  <div className="flex gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="text-center min-w-[60px]">
                      <p className="text-sm font-semibold text-foreground">{event.start}</p>
                      <p className="text-xs text-muted-foreground">to</p>
                      <p className="text-sm font-semibold text-foreground">{event.end}</p>
                    </div>
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${categoryColors[event.category]}`} />
                        <p className="font-medium text-foreground">{event.title}</p>
                      </div>
                      {event.notes && (
                        <p className="text-sm text-muted-foreground italic">Notes: {event.notes}</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Free slot after all events */}
            {freeSlots.length > 0 && freeSlots[freeSlots.length - 1].start > events[events.length - 1]?.end && (
              <div
                onDragOver={(e) => handleDragOver(e, freeSlots[freeSlots.length - 1].start)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, freeSlots[freeSlots.length - 1].start)}
                className={`flex gap-4 p-4 rounded-lg border-2 border-dashed transition-all ${
                  dragOverSlot === freeSlots[freeSlots.length - 1].start
                    ? 'border-primary bg-primary/10 scale-105'
                    : 'border-success/30 bg-success/5 hover:border-success/50'
                }`}
              >
                <div className="text-center min-w-[60px]">
                  <p className="text-sm font-semibold text-foreground">
                    {freeSlots[freeSlots.length - 1].start}
                  </p>
                  <p className="text-xs text-muted-foreground">to</p>
                  <p className="text-sm font-semibold text-foreground">
                    {freeSlots[freeSlots.length - 1].end}
                  </p>
                </div>
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-success" />
                      <p className="font-medium text-success">Free Time</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dragOverSlot === freeSlots[freeSlots.length - 1].start 
                        ? 'Drop suggestion here!' 
                        : `${freeSlots[freeSlots.length - 1].duration} min available`}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Card>
  );
};

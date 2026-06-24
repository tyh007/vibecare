import { Card } from "@/components/ui/card";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { format } from "date-fns";

interface MoodEntry {
  date: string;
  mood: number;
  events: string[];
}

interface MoodTimelineProps {
  data: MoodEntry[];
}

const moodEmojis = ['😢', '😕', '😐', '🙂', '😊'];
const moodLabels = ['Very Low', 'Low', 'Neutral', 'Good', 'Great'];
const moodColors = [
  'bg-destructive',
  'bg-warning',
  'bg-muted',
  'bg-secondary',
  'bg-success'
];

export const MoodTimeline = ({ data }: MoodTimelineProps) => {
  const maxMood = 5;
  
  return (
    <Card className="p-6 space-y-4 bg-card shadow-soft">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-lg text-card-foreground">Mood Timeline</h3>
        <span className="text-sm text-muted-foreground">
          {data.length > 0 && `Last ${data.length} days`}
        </span>
      </div>
      
      <div className="space-y-4">
        {/* Timeline visualization */}
        <div className="h-40 flex items-end justify-between gap-3 px-2">
          <TooltipProvider>
            {data.map((entry, idx) => {
              const heightPercent = (entry.mood / maxMood) * 100;
              const dateObj = new Date(entry.date);
              const dayLabel = format(dateObj, 'EEE');
              const fullDate = format(dateObj, 'MMM d, yyyy');
              
              return (
                <Tooltip key={idx}>
                  <TooltipTrigger asChild>
                    <div className="flex-1 flex flex-col items-center gap-2 cursor-pointer group">
                      <div className="w-full relative">
                        <div 
                          className={`w-full ${moodColors[entry.mood - 1]} rounded-t-lg transition-all group-hover:opacity-80 group-hover:scale-105 relative`}
                          style={{ height: `${Math.max(heightPercent, 15)}px` }}
                        >
                          <span className="absolute inset-0 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity">
                            {moodEmojis[entry.mood - 1]}
                          </span>
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground font-medium">
                        {dayLabel}
                      </span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{moodEmojis[entry.mood - 1]}</span>
                        <div>
                          <p className="font-semibold">{moodLabels[entry.mood - 1]}</p>
                          <p className="text-xs text-muted-foreground">{fullDate}</p>
                        </div>
                      </div>
                      {entry.events.length > 0 && (
                        <div className="pt-2 border-t">
                          <p className="text-xs font-medium mb-1">Events that day:</p>
                          <ul className="text-xs space-y-1">
                            {entry.events.map((event, eventIdx) => (
                              <li key={eventIdx} className="flex items-start gap-1">
                                <span className="text-primary">•</span>
                                <span>{event}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </div>
        
        {/* Trend indicator */}
        {data.length > 1 && (
          <div className="text-center text-sm text-muted-foreground">
            {data[data.length - 1].mood > data[0].mood ? (
              <span className="text-success">📈 Trending upward!</span>
            ) : data[data.length - 1].mood < data[0].mood ? (
              <span className="text-warning">📉 Trending downward</span>
            ) : (
              <span>📊 Staying steady</span>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Brain, Check, Clock, Heart, Sparkles, Wind, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { SuggestionGuideDialog } from "./SuggestionGuideDialog";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  category: string;
  notes?: string;
}

interface Suggestion {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  category: string;
  icon: typeof Wind;
  reason: string;
  guide?: string[];
  videoUrl?: string;
}

interface SuggestionEngineProps {
  events: CalendarEvent[];
  onAcceptSuggestion: (suggestion: Suggestion) => void;
}

// Helper function to calculate time difference in minutes
const getMinutesBetween = (start: string, end: string): number => {
  const [startHour, startMin] = start.split(':').map(Number);
  const [endHour, endMin] = end.split(':').map(Number);
  return (endHour * 60 + endMin) - (startHour * 60 + startMin);
};

// Rule-based suggestion generator
const generateSuggestions = (events: CalendarEvent[]): Suggestion[] => {
  const suggestions: Suggestion[] = [];
  
  // Rule 1: If 3+ hours of study detected, suggest a break
  const studyEvents = events.filter(e => 
    e.category === 'study' || e.category === 'class'
  );
  
  let totalStudyMinutes = 0;
  studyEvents.forEach(event => {
    totalStudyMinutes += getMinutesBetween(event.start, event.end);
  });
  
  if (totalStudyMinutes >= 180) { // 3+ hours
    suggestions.push({
      id: 'break-suggestion',
      title: '15-Minute Movement Break',
      description: 'Take a short walk or do gentle stretches',
      duration: 15,
      category: 'wellness',
      icon: Wind,
      reason: 'You have 3+ hours of study time scheduled. Taking breaks improves focus and retention.',
      guide: [
        'Step away from your desk',
        'Walk outside for 5-10 minutes',
        'Do 5 minutes of gentle stretching',
        'Focus on neck, shoulders, and back',
        'Take deep breaths while moving'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=g_tea8ZNk5A' // 10-min desk stretches
    });
  }
  
  // Rule 2: Morning routine suggestion
  const morningEvents = events.filter(e => {
    const [hour] = e.start.split(':').map(Number);
    return hour < 10;
  });
  
  if (morningEvents.length === 0) {
    suggestions.push({
      id: 'morning-routine',
      title: '5-Minute Breathing Exercise',
      description: 'Start your day with mindful breathing',
      duration: 5,
      category: 'wellness',
      icon: Wind,
      reason: 'Starting your day with mindfulness can reduce anxiety and improve focus.',
      guide: [
        'Find a comfortable seated position',
        'Close your eyes or soften your gaze',
        'Breathe in slowly through your nose for 4 counts',
        'Hold your breath for 4 counts',
        'Exhale slowly through your mouth for 6 counts',
        'Repeat for 5 minutes'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=tybOi4hjZFQ' // 5-min breathing exercise
    });
  }
  
  // Rule 3: No wellness activities detected
  const wellnessEvents = events.filter(e => e.category === 'wellness');
  
  if (wellnessEvents.length === 0) {
    suggestions.push({
      id: 'gratitude-journal',
      title: 'Gratitude Journaling',
      description: 'Write down 3 things you\'re grateful for',
      duration: 10,
      category: 'wellness',
      icon: Heart,
      reason: 'Gratitude practice is proven to reduce symptoms of depression and improve well-being.',
      guide: [
        'Get a notebook or open your notes app',
        'Find a quiet, comfortable spot',
        'Write down 3 things you\'re grateful for today',
        'Be specific - instead of "family," try "my sister\'s encouraging text"',
        'Reflect on why each thing matters to you',
        'Notice how you feel after writing'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=WPPPFqsECz0' // Gratitude journaling guide
    });
  }
  
  // Rule 4: Always suggest a quick mindfulness check
  if (suggestions.length < 3) {
    suggestions.push({
      id: 'body-scan',
      title: 'Quick Body Scan',
      description: '5-minute progressive muscle relaxation',
      duration: 5,
      category: 'wellness',
      icon: Sparkles,
      reason: 'Regular body awareness reduces stress and improves emotional regulation.',
      guide: [
        'Lie down or sit comfortably',
        'Close your eyes and take 3 deep breaths',
        'Starting at your toes, notice any tension',
        'Slowly move attention up: feet → legs → stomach → chest',
        'Continue to shoulders → arms → neck → face',
        'Breathe into any areas of tension',
        'End by wiggling fingers and toes'
      ],
      videoUrl: 'https://www.youtube.com/watch?v=QS2yDmWk0vs' // 5-min body scan meditation
    });
  }
  
  return suggestions.slice(0, 3); // Return max 3 suggestions
};

export const SuggestionEngine = ({ events, onAcceptSuggestion }: SuggestionEngineProps) => {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [acceptedIds, setAcceptedIds] = useState<Set<string>>(new Set());
  const [draggedSuggestion, setDraggedSuggestion] = useState<Suggestion | null>(null);
  const [guideDialogOpen, setGuideDialogOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  
  useEffect(() => {
    const newSuggestions = generateSuggestions(events);
    setSuggestions(newSuggestions);
  }, [events]);
  
  const handleAccept = (suggestion: Suggestion) => {
    onAcceptSuggestion(suggestion);
    setAcceptedIds(new Set(acceptedIds).add(suggestion.id));
    
    setTimeout(() => {
      setAcceptedIds(prev => {
        const next = new Set(prev);
        next.delete(suggestion.id);
        return next;
      });
    }, 2000);
  };
  
  const handleDragStart = (suggestion: Suggestion) => {
    setDraggedSuggestion(suggestion);
  };
  
  const handleDragEnd = () => {
    setDraggedSuggestion(null);
  };
  
  const handleViewGuide = (suggestion: Suggestion) => {
    setSelectedSuggestion(suggestion);
    setGuideDialogOpen(true);
  };
  
  const handleCompleteFromGuide = () => {
    if (selectedSuggestion) {
      handleAccept(selectedSuggestion);
    }
  };
  
  if (suggestions.length === 0) {
    return null;
  }
  
  return (
    <Card className="p-6 space-y-4 bg-card shadow-soft">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          <h3 className="font-semibold text-lg text-card-foreground">
            Smart Suggestions
          </h3>
        </div>
        <span className="text-xs text-muted-foreground">
          CBT-based recommendations
        </span>
      </div>
      
      <div className="space-y-3">
        {suggestions.map((suggestion) => {
          const Icon = suggestion.icon;
          const isAccepted = acceptedIds.has(suggestion.id);
          const isDragging = draggedSuggestion?.id === suggestion.id;
          
          return (
            <div
              key={suggestion.id}
              draggable
              onDragStart={() => handleDragStart(suggestion)}
              onDragEnd={handleDragEnd}
              className={`p-4 rounded-lg border transition-all ${
                isDragging 
                  ? 'opacity-50 scale-95' 
                  : 'hover:border-primary/50 hover:shadow-md cursor-move'
              } ${
                isAccepted 
                  ? 'bg-success/10 border-success' 
                  : 'bg-primary/5 border-primary/20'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-full bg-primary/10">
                  <Icon className="w-4 h-4 text-primary" />
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-foreground">{suggestion.title}</p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{suggestion.duration} min</span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {suggestion.description}
                  </p>
                  
                  <div className="pt-2">
                    <p className="text-xs text-muted-foreground italic">
                      💡 {suggestion.reason}
                    </p>
                  </div>
                  
                  <div className="pt-2 flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewGuide(suggestion)}
                      className="h-8"
                    >
                      <BookOpen className="w-3 h-3 mr-1" />
                      How To
                    </Button>
                    <Button
                      size="sm"
                      variant={isAccepted ? "outline" : "default"}
                      onClick={() => handleAccept(suggestion)}
                      disabled={isAccepted}
                      className="h-8"
                    >
                      {isAccepted ? (
                        <>
                          <Check className="w-3 h-3 mr-1" />
                          Added
                        </>
                      ) : (
                        'Quick Add'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      <p className="text-xs text-center text-muted-foreground pt-2">
        Suggestions update based on your schedule
      </p>
      
      {selectedSuggestion && (
        <SuggestionGuideDialog
          open={guideDialogOpen}
          onOpenChange={setGuideDialogOpen}
          title={selectedSuggestion.title}
          description={selectedSuggestion.description}
          guide={selectedSuggestion.guide}
          videoUrl={selectedSuggestion.videoUrl}
          onComplete={handleCompleteFromGuide}
        />
      )}
    </Card>
  );
};

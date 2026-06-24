import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MoodSelector } from "@/components/MoodSelector";
import { format } from "date-fns";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, Moon, Activity, Smartphone, Droplet, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface MoodEntry {
  id?: string;
  mood: number;
  reasons?: string[];
  note?: string;
  notes?: string;
  timestamp?: string;
  created_at?: string;
  sleep_hours?: number;
  physical_activity_minutes?: number;
  screen_time_minutes?: number;
  hydration_ml?: number;
  location?: string;
}

const moodEmojis: { [key: number]: string } = {
  5: "😊",
  4: "🙂",
  3: "😐",
  2: "😔",
  1: "😢",
};

const MoodTracker = () => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<MoodEntry[]>([]);

  useEffect(() => {
    const loadEntries = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Load from database if logged in
        const { data, error } = await supabase
          .from("mood_entries")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20);

        if (data && !error) {
          // If no database entries, show localStorage as fallback
          if (data.length === 0) {
            const savedEntries = JSON.parse(localStorage.getItem("moodEntries") || "[]");
            setEntries(savedEntries);
          } else {
            setEntries(data);
          }
        }
      } else {
        // Fallback to localStorage if not logged in
        const savedEntries = JSON.parse(localStorage.getItem("moodEntries") || "[]");
        setEntries(savedEntries);
      }
    };

    loadEntries();
    
    // Set up realtime subscription
    const channel = supabase
      .channel('mood_entries_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'mood_entries'
        },
        () => loadEntries()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <div className="min-h-screen bg-forest">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 bg-card/75 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <div className="flex items-center gap-2">
              <Heart className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-bold text-foreground">Mood Tracker</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div>
          <p className="text-lg text-muted-foreground animate-fade-in">
            Track your emotional journey and patterns
          </p>
        </div>

        <MoodSelector />

        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Entries</h2>
          <div className="space-y-3">
            {entries.length === 0 ? (
              <Card className="p-8 text-center glass border border-border/50">
                <p className="text-muted-foreground">No wellness check-ins yet. Start tracking!</p>
              </Card>
            ) : (
              entries.map((entry, index) => {
                const timestamp = entry.created_at || entry.timestamp || new Date().toISOString();
                const noteText = entry.notes || entry.note || "";
                
                return (
                  <Card
                    key={entry.id || index}
                    className="p-6 animate-fade-in hover-lift glass border border-border/50"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="text-5xl">{moodEmojis[entry.mood]}</div>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-lg">
                            {format(new Date(timestamp), "MMM d, yyyy")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(timestamp), "h:mm a")}
                          </span>
                        </div>

                        {/* Wellness Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          {entry.sleep_hours !== undefined && entry.sleep_hours !== null && (
                            <div className="flex items-center gap-2 text-sm">
                              <Moon className="w-4 h-4 text-blue-500" />
                              <span>{entry.sleep_hours}h sleep</span>
                            </div>
                          )}
                          {entry.physical_activity_minutes !== undefined && entry.physical_activity_minutes !== null && (
                            <div className="flex items-center gap-2 text-sm">
                              <Activity className="w-4 h-4 text-green-500" />
                              <span>{entry.physical_activity_minutes} min active</span>
                            </div>
                          )}
                          {entry.screen_time_minutes !== undefined && entry.screen_time_minutes !== null && (
                            <div className="flex items-center gap-2 text-sm">
                              <Smartphone className="w-4 h-4 text-orange-500" />
                              <span>{(entry.screen_time_minutes / 60).toFixed(1)}h screen</span>
                            </div>
                          )}
                          {entry.hydration_ml !== undefined && entry.hydration_ml !== null && (
                            <div className="flex items-center gap-2 text-sm">
                              <Droplet className="w-4 h-4 text-cyan-500" />
                              <span>{(entry.hydration_ml / 1000).toFixed(1)}L water</span>
                            </div>
                          )}
                          {entry.location && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="w-4 h-4 text-purple-500" />
                              <span>{entry.location}</span>
                            </div>
                          )}
                        </div>

                        {entry.reasons && entry.reasons.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {entry.reasons.map((reason, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {reason}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {noteText && (
                          <p className="text-sm text-muted-foreground border-l-2 border-primary/30 pl-3">
                            {noteText}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;

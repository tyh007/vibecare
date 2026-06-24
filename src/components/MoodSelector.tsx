import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

const moods = [
  { 
    emoji: "😊", 
    label: "Great", 
    value: 5, 
    color: "bg-green-500",
    prompts: [
      "I accomplished something today",
      "I spent time with loved ones",
      "I took care of myself",
      "Something positive happened",
      "I feel energized and motivated"
    ]
  },
  { 
    emoji: "🙂", 
    label: "Good", 
    value: 4, 
    color: "bg-green-400",
    prompts: [
      "Things are going well",
      "I had a productive day",
      "I'm feeling content",
      "I made progress on my goals",
      "I had pleasant interactions"
    ]
  },
  { 
    emoji: "😐", 
    label: "Okay", 
    value: 3, 
    color: "bg-yellow-400",
    prompts: [
      "It's just another day",
      "Nothing special happened",
      "Feeling neutral about things",
      "Some ups and downs",
      "Just going through the motions"
    ]
  },
  { 
    emoji: "😔", 
    label: "Down", 
    value: 2, 
    color: "bg-orange-400",
    prompts: [
      "Feeling a bit overwhelmed",
      "Something didn't go as planned",
      "I'm tired or stressed",
      "Missing someone or something",
      "Feeling uncertain about things"
    ]
  },
  { 
    emoji: "😢", 
    label: "Sad", 
    value: 1, 
    color: "bg-red-400",
    prompts: [
      "I'm going through a difficult time",
      "Feeling lonely or isolated",
      "Something painful happened",
      "I'm worried about something",
      "Struggling with negative thoughts"
    ]
  },
];

export const MoodSelector = () => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [physicalActivity, setPhysicalActivity] = useState<number>(30);
  const [screenTime, setScreenTime] = useState<number>(120);
  const [hydration, setHydration] = useState<number>(2000);
  const [location, setLocation] = useState<string>("");
  const { toast } = useToast();

  const selectedMoodData = moods.find(m => m.value === selectedMood);

  const toggleReason = (reason: string) => {
    setSelectedReasons(prev => 
      prev.includes(reason) 
        ? prev.filter(r => r !== reason)
        : [...prev, reason]
    );
  };

  const handleSave = async () => {
    if (selectedMood === null) {
      toast({
        title: "Please select a mood",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast({
          title: "Please sign in",
          description: "You need to be signed in to track your mood.",
          variant: "destructive",
        });
        return;
      }

      // Save to database
      const { error: insertError } = await supabase
        .from("mood_entries")
        .insert({
          user_id: user.id,
          mood: selectedMood,
          sleep_hours: sleepHours,
          physical_activity_minutes: physicalActivity,
          screen_time_minutes: screenTime,
          hydration_ml: hydration,
          location: location || null,
          notes: note || null,
        });

      if (insertError) throw insertError;

      // Also save to localStorage for backwards compatibility
      const moodEntry = {
        mood: selectedMood,
        reasons: selectedReasons,
        note,
        timestamp: new Date().toISOString(),
        location,
      };
      const existingEntries = JSON.parse(localStorage.getItem("moodEntries") || "[]");
      localStorage.setItem("moodEntries", JSON.stringify([moodEntry, ...existingEntries]));

      // Award coins and update streak
      const { data: profile } = await supabase
        .from("profiles")
        .select("coins, last_check_in, current_streak, longest_streak, total_check_ins")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profile) {
        const today = new Date().toDateString();
        const lastCheckIn = profile.last_check_in ? new Date(profile.last_check_in).toDateString() : null;
        
        let coinsEarned = 10; // Base reward
        let newStreak = profile.current_streak || 0;
        
        // Check if this is a new day
        if (lastCheckIn !== today) {
          // Update streak
          if (lastCheckIn === new Date(Date.now() - 86400000).toDateString()) {
            newStreak += 1;
          } else if (lastCheckIn !== null) {
            newStreak = 1;
          } else {
            newStreak = 1;
          }
          
          // Bonus coins for streak
          coinsEarned += Math.floor(newStreak / 7) * 5;

          await supabase
            .from("profiles")
            .update({
              coins: (profile.coins || 0) + coinsEarned,
              last_check_in: new Date().toISOString().split('T')[0],
              current_streak: newStreak,
              longest_streak: Math.max(newStreak, profile.longest_streak || 0),
              total_check_ins: (profile.total_check_ins || 0) + 1
            })
            .eq("user_id", user.id);

          toast({
            title: "Wellness check-in saved! 🎉",
            description: `You earned ${coinsEarned} coins! Streak: ${newStreak} days`,
          });
        } else {
          toast({
            title: "Check-in updated!",
            description: "You've already checked in today.",
          });
        }
      }

      // Reset form
      setSelectedMood(null);
      setSelectedReasons([]);
      setNote("");
      setSleepHours(7);
      setPhysicalActivity(30);
      setScreenTime(120);
      setHydration(2000);
      setLocation("");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="p-8 animate-fade-in glass border-2 border-border/50 shadow-medium hover-lift">
      <h3 className="text-2xl font-display font-bold mb-6 gradient-text">How are you feeling?</h3>
      
      <div className="grid grid-cols-5 gap-3 mb-8">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => setSelectedMood(mood.value)}
            className={`
              flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-spring
              ${
                selectedMood === mood.value
                  ? "border-primary bg-gradient-primary/10 scale-110 shadow-medium"
                  : "border-border/50 hover:border-primary/50 hover:scale-105 hover:shadow-soft"
              }
            `}
          >
            <span className="text-5xl">{mood.emoji}</span>
            <span className="text-sm font-semibold">{mood.label}</span>
          </button>
        ))}
      </div>

      {selectedMoodData && (
        <div className="mb-6 animate-fade-in p-5 rounded-xl glass border border-border/50">
          <h4 className="font-display font-bold text-lg mb-4">Why are you feeling {selectedMoodData.label.toLowerCase()}?</h4>
          <div className="flex flex-wrap gap-2">
            {selectedMoodData.prompts.map((prompt) => (
              <Badge
                key={prompt}
                variant={selectedReasons.includes(prompt) ? "default" : "outline"}
                className="cursor-pointer transition-spring hover:scale-105 text-sm py-1.5 px-3"
                onClick={() => toggleReason(prompt)}
              >
                {prompt}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Wellness Metrics */}
      <div className="space-y-6 mb-6 p-5 rounded-xl glass border border-border/50">
        <h4 className="font-display font-bold text-lg mb-4">Daily Wellness Metrics</h4>
        
        {/* Sleep */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Sleep (hours)</label>
            <span className="text-sm text-muted-foreground">{sleepHours}h</span>
          </div>
          <input
            type="range"
            min="0"
            max="12"
            step="0.5"
            value={sleepHours}
            onChange={(e) => setSleepHours(parseFloat(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-border/50"
          />
        </div>

        {/* Physical Activity */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Physical Activity (minutes)</label>
            <span className="text-sm text-muted-foreground">{physicalActivity} min</span>
          </div>
          <input
            type="range"
            min="0"
            max="180"
            step="5"
            value={physicalActivity}
            onChange={(e) => setPhysicalActivity(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-border/50"
          />
        </div>

        {/* Screen Time */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Screen Time (minutes)</label>
            <span className="text-sm text-muted-foreground">{screenTime} min ({(screenTime / 60).toFixed(1)}h)</span>
          </div>
          <input
            type="range"
            min="0"
            max="720"
            step="15"
            value={screenTime}
            onChange={(e) => setScreenTime(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-border/50"
          />
        </div>

        {/* Hydration */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Hydration (ml)</label>
            <span className="text-sm text-muted-foreground">{hydration} ml ({(hydration / 1000).toFixed(1)}L)</span>
          </div>
          <input
            type="range"
            min="0"
            max="4000"
            step="100"
            value={hydration}
            onChange={(e) => setHydration(parseInt(e.target.value))}
            className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-border/50"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Location (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g., Home, Office, Gym, Park..."
            className="w-full px-4 py-2 rounded-lg border border-border/50 bg-background/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </div>

      <Textarea
        placeholder="Add any additional notes (optional)"
        value={note}
        onChange={(e) => setNote(e.target.value)}
        className="mb-6 min-h-[120px] rounded-xl"
      />

      <Button onClick={handleSave} className="w-full" size="lg">
        Save Mood Entry
      </Button>
    </Card>
  );
};

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { moodService } from "@/services/moods";
import { ApiError } from "@/services/http";

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
      "I feel energized and motivated",
    ],
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
      "I had pleasant interactions",
    ],
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
      "Just going through the motions",
    ],
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
      "Feeling uncertain about things",
    ],
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
      "Struggling with negative thoughts",
    ],
  },
];

interface MoodSelectorProps {
  /** Optional callback fired after a successful save. Parents can use this to
   *  invalidate React Query caches (e.g. MoodDashboard wiring). */
  onSaved?: () => void;
}

export const MoodSelector = ({ onSaved }: MoodSelectorProps = {}) => {
  const [selectedMood, setSelectedMood] = useState<number | null>(null);
  const [selectedReasons, setSelectedReasons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [sleepHours, setSleepHours] = useState<number>(7);
  const [physicalActivity, setPhysicalActivity] = useState<number>(30);
  const [screenTime, setScreenTime] = useState<number>(120);
  const [hydration, setHydration] = useState<number>(2000);
  const [location, setLocation] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const selectedMoodData = moods.find((m) => m.value === selectedMood);

  const toggleReason = (reason: string) => {
    setSelectedReasons((prev) =>
      prev.includes(reason) ? prev.filter((r) => r !== reason) : [...prev, reason],
    );
  };

  const handleSave = async () => {
    if (selectedMood === null) {
      toast({ title: "Please select a mood", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      await moodService.create({
        mood: selectedMood,
        sleep_hours: sleepHours,
        physical_activity_minutes: physicalActivity,
        screen_time_minutes: screenTime,
        hydration_ml: hydration,
        location: location || null,
        notes: note || null,
      });

      // Keep a localStorage mirror for components that haven't migrated yet.
      const moodEntry = {
        mood: selectedMood,
        reasons: selectedReasons,
        note,
        timestamp: new Date().toISOString(),
        location,
      };
      try {
        const existing = JSON.parse(localStorage.getItem("moodEntries") || "[]");
        localStorage.setItem(
          "moodEntries",
          JSON.stringify([moodEntry, ...existing]),
        );
      } catch {
        /* localStorage unavailable — server has the truth */
      }

      toast({
        title: "Wellness check-in saved! 🎉",
        description: "Coins and streak have been updated on your profile.",
      });

      onSaved?.();

      setSelectedMood(null);
      setSelectedReasons([]);
      setNote("");
      setSleepHours(7);
      setPhysicalActivity(30);
      setScreenTime(120);
      setHydration(2000);
      setLocation("");
    } catch (error: unknown) {
      const message = error instanceof ApiError ? error.message : "Please try again.";
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="p-8 animate-fade-in glass border-2 border-border/50 shadow-medium hover-lift">
      <h3 className="text-2xl font-display font-bold mb-6 gradient-text">
        How are you feeling?
      </h3>

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
          <h4 className="font-display font-bold text-lg mb-4">
            Why are you feeling {selectedMoodData.label.toLowerCase()}?
          </h4>
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

      <div className="space-y-6 mb-6 p-5 rounded-xl glass border border-border/50">
        <h4 className="font-display font-bold text-lg mb-4">Daily Wellness Metrics</h4>

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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Screen Time (minutes)</label>
            <span className="text-sm text-muted-foreground">
              {screenTime} min ({(screenTime / 60).toFixed(1)}h)
            </span>
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

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Hydration (ml)</label>
            <span className="text-sm text-muted-foreground">
              {hydration} ml ({(hydration / 1000).toFixed(1)}L)
            </span>
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

      <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
        {saving ? "Saving..." : "Save Mood Entry"}
      </Button>
    </Card>
  );
};
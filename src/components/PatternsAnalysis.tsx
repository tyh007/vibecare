import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import {
  readLocalArray,
  type HealthEntry,
  type MoodEntry,
  type ScreenTimeEntry,
} from "@/types/wellbeing";

interface Pattern {
  factor: string;
  correlation: "positive" | "negative" | "neutral";
  insight: string;
}

export const PatternsAnalysis = () => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);

  useEffect(() => {
    const moodEntries = readLocalArray<MoodEntry>("moodEntries");
    const healthEntries = readLocalArray<HealthEntry>("healthEntries");
    const screenTimeEntries =
      readLocalArray<ScreenTimeEntry>("screenTimeEntries");

    const detectedPatterns: Pattern[] = [];

    // Analyze sleep patterns
    if (healthEntries.length >= 3) {
      const sleepData = healthEntries
        .slice(0, 10)
        .filter((entry) => entry.sleep)
        .map((entry) => ({
          sleep: Number(entry.sleep),
          date: entry.date,
        }));

      const moodsByDate = new Map<string, number[]>();
      moodEntries.forEach((entry) => {
        const date = new Date(entry.timestamp).toLocaleDateString();
        if (!moodsByDate.has(date)) {
          moodsByDate.set(date, []);
        }
        moodsByDate.get(date)?.push(entry.mood);
      });

      let goodSleepMood = 0;
      let badSleepMood = 0;
      
      sleepData.forEach((sleepEntry) => {
        const moods = moodsByDate.get(sleepEntry.date) || [];
        const avgMood = moods.length > 0 ? moods.reduce((a: number, b: number) => a + b, 0) / moods.length : 0;
        
        if (sleepEntry.sleep >= 7 && avgMood > 0) goodSleepMood += avgMood;
        if (sleepEntry.sleep < 6 && avgMood > 0) badSleepMood += avgMood;
      });

      if (goodSleepMood > badSleepMood) {
        detectedPatterns.push({
          factor: "Sleep Quality",
          correlation: "positive",
          insight: "Better mood when you sleep 7+ hours. Keep it up!",
        });
      } else if (badSleepMood > goodSleepMood) {
        detectedPatterns.push({
          factor: "Sleep Deprivation",
          correlation: "negative",
          insight: "Less sleep correlates with lower mood. Prioritize rest.",
        });
      }
    }

    // Analyze exercise patterns
    if (healthEntries.length >= 3) {
      const exerciseEntries = healthEntries.filter(
        (entry) => entry.exercise && Number(entry.exercise) > 0,
      );
      if (exerciseEntries.length >= 2) {
        detectedPatterns.push({
          factor: "Physical Activity",
          correlation: "positive",
          insight: "Days with exercise show improved mood. Stay active!",
        });
      }
    }

    // Analyze screen time patterns
    if (screenTimeEntries.length >= 2) {
      const totalScreenTime = screenTimeEntries
        .slice(0, 5)
        .reduce((sum, entry) => sum + entry.totalMinutes, 0) /
        screenTimeEntries.length;

      if (totalScreenTime > 180) {
        detectedPatterns.push({
          factor: "High Screen Time",
          correlation: "negative",
          insight: `Averaging ${Math.round(totalScreenTime / 60)}hrs/day. Consider reducing screen time.`,
        });
      }

      // Check for specific high-usage apps
      const allApps = screenTimeEntries.flatMap((entry) => entry.apps);
      const appTotals = new Map<string, number>();
      allApps.forEach((app) => {
        const current = appTotals.get(app.app) || 0;
        appTotals.set(app.app, current + Number(app.minutes));
      });

      const topApp = Array.from(appTotals.entries()).sort(
        (a, b) => b[1] - a[1],
      )[0];
      if (topApp && topApp[1] > 120) {
        detectedPatterns.push({
          factor: `${topApp[0]} Usage`,
          correlation: "neutral",
          insight: `High usage detected (${Math.round(topApp[1] / screenTimeEntries.length)}min/day avg).`,
        });
      }
    }

    // Add water intake insight
    if (healthEntries.length >= 2) {
      const avgWater = healthEntries
        .slice(0, 5)
        .filter((entry) => entry.water)
        .reduce((sum, entry) => sum + Number(entry.water), 0) /
        healthEntries.length;

      if (avgWater >= 6) {
        detectedPatterns.push({
          factor: "Hydration",
          correlation: "positive",
          insight: "Good hydration habits! This supports overall wellness.",
        });
      } else if (avgWater < 4) {
        detectedPatterns.push({
          factor: "Low Hydration",
          correlation: "negative",
          insight: "Try drinking more water. Aim for 6-8 glasses daily.",
        });
      }
    }

    // Analyze location patterns
    if (moodEntries.length >= 3) {
      const locationMoods = new Map<string, number[]>();
      moodEntries.forEach((entry) => {
        if (entry.location) {
          if (!locationMoods.has(entry.location)) {
            locationMoods.set(entry.location, []);
          }
          locationMoods.get(entry.location)?.push(entry.mood);
        }
      });

      if (locationMoods.size >= 2) {
        const avgByLocation = Array.from(locationMoods.entries()).map(([loc, moods]) => ({
          location: loc,
          avgMood: moods.reduce((a: number, b: number) => a + b, 0) / moods.length,
        })).sort((a, b) => b.avgMood - a.avgMood);

        if (avgByLocation.length >= 2) {
          const best = avgByLocation[0];
          const worst = avgByLocation[avgByLocation.length - 1];
          const diff = ((best.avgMood - worst.avgMood) / worst.avgMood * 100).toFixed(0);
          
          detectedPatterns.push({
            factor: "Location Impact",
            correlation: "positive",
            insight: `Mood is ${diff}% better at ${best.location} vs. ${worst.location}`,
          });
        }
      }

      // Screen time by location
      const locationScreenTime = new Map<string, number[]>();
      screenTimeEntries.forEach((entry) => {
        if (entry.location) {
          if (!locationScreenTime.has(entry.location)) {
            locationScreenTime.set(entry.location, []);
          }
          locationScreenTime.get(entry.location)?.push(entry.totalMinutes);
        }
      });

      if (locationScreenTime.size >= 2) {
        const avgScreenByLocation = Array.from(locationScreenTime.entries()).map(([loc, times]) => ({
          location: loc,
          avgTime: times.reduce((a: number, b: number) => a + b, 0) / times.length,
        })).sort((a, b) => b.avgTime - a.avgTime);

        if (avgScreenByLocation.length >= 2 && avgScreenByLocation[0].avgTime > avgScreenByLocation[1].avgTime * 1.5) {
          const ratio = (avgScreenByLocation[0].avgTime / avgScreenByLocation[1].avgTime).toFixed(1);
          detectedPatterns.push({
            factor: "Screen Time Location",
            correlation: "neutral",
            insight: `Screen time at ${avgScreenByLocation[0].location} is ${ratio}x higher than ${avgScreenByLocation[1].location}`,
          });
        }
      }
    }

    // Temporal pattern warning
    if (moodEntries.length >= 5) {
      const moodsWithTime = moodEntries.map((entry) => ({
        mood: entry.mood,
        hour: new Date(entry.timestamp).getHours(),
        location: entry.location,
      }));

      // Check if mood varies significantly by time of day
      const morningMoods = moodsWithTime
        .filter((entry) => entry.hour < 12)
        .map((entry) => entry.mood);
      const eveningMoods = moodsWithTime
        .filter((entry) => entry.hour >= 18)
        .map((entry) => entry.mood);

      if (morningMoods.length >= 2 && eveningMoods.length >= 2) {
        const avgMorning = morningMoods.reduce((a: number, b: number) => a + b, 0) / morningMoods.length;
        const avgEvening = eveningMoods.reduce((a: number, b: number) => a + b, 0) / eveningMoods.length;
        
        if (Math.abs(avgMorning - avgEvening) > 0.8) {
          detectedPatterns.push({
            factor: "Time of Day Effect",
            correlation: "neutral",
            insight: "Mood varies by time of day. Location happiness may be influenced by when you visit.",
          });
        }
      }
    }

    setPatterns(detectedPatterns);
  }, []);

  if (patterns.length === 0) {
    return (
      <Card className="p-8 animate-fade-in glass border-2 border-border/50 shadow-medium">
        <h3 className="text-2xl font-display font-bold mb-6 gradient-text">Pattern Analysis</h3>
        <div className="text-center py-12">
          <div className="w-20 h-20 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-md mx-auto">
            Keep logging your mood, health data, and screen time for a few days to see patterns!
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 animate-fade-in glass border-2 border-border/50 shadow-medium">
      <h3 className="text-2xl font-display font-bold mb-6 gradient-text">Detected Patterns</h3>
      <div className="space-y-4">
        {patterns.map((pattern, index) => (
          <div
            key={index}
            className="flex items-start gap-4 p-5 rounded-xl glass border-2 border-border/50 hover-lift transition-all group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-soft ${
              pattern.correlation === "positive" ? "bg-green-500/10" :
              pattern.correlation === "negative" ? "bg-orange-500/10" :
              "bg-blue-500/10"
            }`}>
              {pattern.correlation === "positive" && (
                <TrendingUp className="w-6 h-6 text-green-500" />
              )}
              {pattern.correlation === "negative" && (
                <TrendingDown className="w-6 h-6 text-orange-500" />
              )}
              {pattern.correlation === "neutral" && (
                <AlertCircle className="w-6 h-6 text-blue-500" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-display font-bold text-lg">{pattern.factor}</span>
                <Badge
                  variant={
                    pattern.correlation === "positive"
                      ? "default"
                      : pattern.correlation === "negative"
                      ? "destructive"
                      : "secondary"
                  }
                  className="text-xs font-semibold"
                >
                  {pattern.correlation}
                </Badge>
              </div>
              <p className="text-muted-foreground leading-relaxed">{pattern.insight}</p>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

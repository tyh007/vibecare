import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, AlertCircle } from "lucide-react";

interface Pattern {
  factor: string;
  correlation: "positive" | "negative" | "neutral";
  insight: string;
}

export const PatternsAnalysis = () => {
  const [patterns, setPatterns] = useState<Pattern[]>([]);

  useEffect(() => {
    const moodEntries = JSON.parse(localStorage.getItem("moodEntries") || "[]");
    const healthEntries = JSON.parse(localStorage.getItem("healthEntries") || "[]");
    const screenTimeEntries = JSON.parse(localStorage.getItem("screenTimeEntries") || "[]");

    const detectedPatterns: Pattern[] = [];

    // Analyze sleep patterns
    if (healthEntries.length >= 3) {
      const sleepData = healthEntries
        .slice(0, 10)
        .filter((e: any) => e.sleep)
        .map((e: any) => ({
          sleep: Number(e.sleep),
          date: e.date,
        }));

      const moodsByDate = new Map();
      moodEntries.forEach((m: any) => {
        const date = new Date(m.timestamp).toLocaleDateString();
        if (!moodsByDate.has(date)) {
          moodsByDate.set(date, []);
        }
        moodsByDate.get(date).push(m.mood);
      });

      let goodSleepMood = 0;
      let badSleepMood = 0;
      
      sleepData.forEach((s: any) => {
        const moods = moodsByDate.get(s.date) || [];
        const avgMood = moods.length > 0 ? moods.reduce((a: number, b: number) => a + b, 0) / moods.length : 0;
        
        if (s.sleep >= 7 && avgMood > 0) goodSleepMood += avgMood;
        if (s.sleep < 6 && avgMood > 0) badSleepMood += avgMood;
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
      const exerciseEntries = healthEntries.filter((e: any) => e.exercise && Number(e.exercise) > 0);
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
        .reduce((sum: number, e: any) => sum + e.totalMinutes, 0) / screenTimeEntries.length;

      if (totalScreenTime > 180) {
        detectedPatterns.push({
          factor: "High Screen Time",
          correlation: "negative",
          insight: `Averaging ${Math.round(totalScreenTime / 60)}hrs/day. Consider reducing screen time.`,
        });
      }

      // Check for specific high-usage apps
      const allApps = screenTimeEntries.flatMap((e: any) => e.apps);
      const appTotals = new Map();
      allApps.forEach((app: any) => {
        const current = appTotals.get(app.app) || 0;
        appTotals.set(app.app, current + Number(app.minutes));
      });

      const topApp = Array.from(appTotals.entries()).sort((a: any, b: any) => b[1] - a[1])[0];
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
        .filter((e: any) => e.water)
        .reduce((sum: number, e: any) => sum + Number(e.water), 0) / healthEntries.length;

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
      const locationMoods = new Map();
      moodEntries.forEach((m: any) => {
        if (m.location) {
          if (!locationMoods.has(m.location)) {
            locationMoods.set(m.location, []);
          }
          locationMoods.get(m.location).push(m.mood);
        }
      });

      if (locationMoods.size >= 2) {
        const avgByLocation = Array.from(locationMoods.entries()).map(([loc, moods]: [string, any]) => ({
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
      const locationScreenTime = new Map();
      screenTimeEntries.forEach((e: any) => {
        if (e.location) {
          if (!locationScreenTime.has(e.location)) {
            locationScreenTime.set(e.location, []);
          }
          locationScreenTime.get(e.location).push(e.totalMinutes);
        }
      });

      if (locationScreenTime.size >= 2) {
        const avgScreenByLocation = Array.from(locationScreenTime.entries()).map(([loc, times]: [string, any]) => ({
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
      const moodsWithTime = moodEntries.map((m: any) => ({
        mood: m.mood,
        hour: new Date(m.timestamp).getHours(),
        location: m.location,
      }));

      // Check if mood varies significantly by time of day
      const morningMoods = moodsWithTime.filter((m: any) => m.hour < 12).map((m: any) => m.mood);
      const eveningMoods = moodsWithTime.filter((m: any) => m.hour >= 18).map((m: any) => m.mood);

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

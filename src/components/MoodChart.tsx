import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp } from "lucide-react";

export const MoodChart = () => {
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const entries = JSON.parse(localStorage.getItem("moodEntries") || "[]");
    
    // Get last 7 entries and reverse for chronological order
    const recentEntries = entries.slice(0, 7).reverse();
    
    const data = recentEntries.map((entry: any, index: number) => ({
      name: new Date(entry.timestamp).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      mood: entry.mood,
    }));

    setChartData(data);
  }, []);

  if (chartData.length === 0) {
    return (
      <Card className="p-8 animate-fade-in glass border-2 border-border/50 shadow-medium">
        <h3 className="text-2xl font-display font-bold mb-6 gradient-text">Mood Trends</h3>
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4">
            <TrendingUp className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground text-lg">
            Start tracking your mood to see trends here
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-8 animate-fade-in glass border-2 border-border/50 shadow-medium hover-lift">
      <h3 className="text-2xl font-display font-bold mb-6 gradient-text">Mood Trends</h3>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
          <XAxis 
            dataKey="name" 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px', fontWeight: 500 }}
          />
          <YAxis 
            domain={[0, 5]} 
            stroke="hsl(var(--muted-foreground))"
            style={{ fontSize: '12px', fontWeight: 500 }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "2px solid hsl(var(--primary) / 0.2)",
              borderRadius: "12px",
              boxShadow: "var(--shadow-medium)",
            }}
          />
          <Line
            type="monotone"
            dataKey="mood"
            stroke="hsl(var(--primary))"
            strokeWidth={4}
            dot={{ fill: "hsl(var(--primary))", r: 8, strokeWidth: 2, stroke: "hsl(var(--card))" }}
            activeDot={{ r: 10, strokeWidth: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
};

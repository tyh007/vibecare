import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { MapPin } from "lucide-react";

interface LocationData {
  location: string;
  timeSpent: number;
  avgMood: number;
  avgScreenTime: number;
}

interface LocationChartProps {
  data: LocationData[];
}

export const LocationChart = ({ data }: LocationChartProps) => {
  const formatLocation = (location: string) => {
    return location.charAt(0).toUpperCase() + location.slice(1);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Time Spent by Location
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis 
              dataKey="location" 
              tickFormatter={formatLocation}
              stroke="hsl(var(--muted-foreground))"
            />
            <YAxis 
              stroke="hsl(var(--muted-foreground))"
              label={{ value: 'Hours', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip 
              formatter={(value: number, name: string) => {
                if (name === "timeSpent") return [`${value} hours`, "Time Spent"];
                if (name === "avgMood") return [value.toFixed(1), "Avg Mood"];
                if (name === "avgScreenTime") return [`${value} hrs`, "Avg Screen Time"];
                return [value, name];
              }}
              labelFormatter={formatLocation}
              contentStyle={{
                backgroundColor: "hsl(var(--background))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey="timeSpent" fill="hsl(var(--primary))" name="Time Spent (hrs)" />
            <Bar dataKey="avgMood" fill="hsl(var(--accent))" name="Avg Mood" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

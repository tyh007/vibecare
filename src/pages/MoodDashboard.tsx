import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { StatsCards } from "@/components/StatsCards";
import { MoodSelector } from "@/components/MoodSelector";
import { MoodChart } from "@/components/MoodChart";
import { PatternsAnalysis } from "@/components/PatternsAnalysis";
import { DataControls } from "@/components/DataControls";
import { LocationChart } from "@/components/LocationChart";
import { MoodMap } from "@/components/MoodMap";
import { PixelAvatar } from "@/components/PixelAvatar";
import { initializeMockData } from "@/utils/mockData";

const MoodDashboard = () => {
  const navigate = useNavigate();
  const [locationData, setLocationData] = useState<any[]>([]);
  const [mapLocationData, setMapLocationData] = useState<any[]>([]);

  useEffect(() => {
    initializeMockData();

    // Calculate location statistics
    const moodEntries = JSON.parse(localStorage.getItem("moodEntries") || "[]");
    const screenTimeEntries = JSON.parse(localStorage.getItem("screenTimeEntries") || "[]");

    const locationStats = new Map();
    
    // Aggregate mood data by location
    moodEntries.forEach((entry: any) => {
      if (entry.location) {
        if (!locationStats.has(entry.location)) {
          locationStats.set(entry.location, { moods: [], screenTimes: [], count: 0 });
        }
        locationStats.get(entry.location).moods.push(entry.mood);
        locationStats.get(entry.location).count++;
      }
    });

    // Aggregate screen time by location
    screenTimeEntries.forEach((entry: any) => {
      if (entry.location && locationStats.has(entry.location)) {
        locationStats.get(entry.location).screenTimes.push(entry.totalMinutes);
      }
    });

    // Mock coordinates for locations (San Francisco area)
    const locationCoordinates: Record<string, [number, number]> = {
      home: [-122.4194, 37.7749],
      work: [-122.4000, 37.7849],
      gym: [-122.4100, 37.7700],
      school: [-122.3950, 37.7650],
      cafe_a: [-122.4250, 37.7800],
      cafe_b: [-122.4150, 37.7750],
      cafe_c: [-122.4050, 37.7820],
      park: [-122.4300, 37.7700],
      library: [-122.4080, 37.7780],
    };

    // Calculate averages for chart
    const chartData = Array.from(locationStats.entries()).map(([location, stats]: [string, any]) => {
      const avgMood = stats.moods.length > 0 
        ? stats.moods.reduce((a: number, b: number) => a + b, 0) / stats.moods.length 
        : 0;
      const avgScreenTime = stats.screenTimes.length > 0
        ? stats.screenTimes.reduce((a: number, b: number) => a + b, 0) / stats.screenTimes.length / 60
        : 0;
      
      const timeSpent = stats.count * 2;
      
      return {
        location,
        timeSpent: Math.round(timeSpent),
        avgMood: Number(avgMood.toFixed(1)),
        avgScreenTime: Number(avgScreenTime.toFixed(1)),
      };
    });

    // Calculate data for map
    const mapData = Array.from(locationStats.entries())
      .filter(([location]) => locationCoordinates[location])
      .map(([location, stats]: [string, any]) => {
        const avgMood = stats.moods.length > 0 
          ? stats.moods.reduce((a: number, b: number) => a + b, 0) / stats.moods.length 
          : 0;
        
        return {
          name: location.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          coordinates: locationCoordinates[location],
          avgMood: Number(avgMood.toFixed(1)),
          visits: stats.count,
        };
      });

    setLocationData(chartData);
    setMapLocationData(mapData);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header with Back Button */}
      <div className="sticky top-0 z-50 glass border-b border-border/50 shadow-soft">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-2 hover:bg-primary/10"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-medium">
                  <TrendingUp className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-3xl font-display font-bold gradient-text">Mood Analytics</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-6 py-10 space-y-12">
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto space-y-4 animate-fade-in">
          <p className="text-xl text-muted-foreground leading-relaxed">
            Track your wellness journey with detailed insights and patterns
          </p>
          <DataControls />
        </div>

        {/* Overview Section */}
        <section className="space-y-6 animate-slide-up">
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-gradient-primary rounded-full" />
            <h2 className="text-2xl font-display font-bold text-foreground">Your Overview</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="glass border-2 border-primary/20 p-8 hover-lift shadow-medium flex flex-col items-center justify-center gap-4">
              <PixelAvatar size="medium" showCoins={false} />
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground mb-1">Your Avatar</h3>
                <p className="text-sm text-muted-foreground">Level up through tracking</p>
              </div>
            </Card>
            <div className="lg:col-span-2">
              <StatsCards />
            </div>
          </div>
        </section>

        {/* Insights Section */}
        <section className="space-y-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-gradient-accent rounded-full" />
            <h2 className="text-2xl font-display font-bold text-foreground">Smart Insights</h2>
          </div>
          <PatternsAnalysis />
        </section>

        {/* Trends Section */}
        <section className="space-y-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center gap-3">
            <div className="h-1 w-12 bg-gradient-primary rounded-full" />
            <h2 className="text-2xl font-display font-bold text-foreground">Mood Trends</h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MoodChart />
            <MoodSelector />
          </div>
        </section>

        {/* Location Analytics Section */}
        {(mapLocationData.length > 0 || locationData.length > 0) && (
          <section className="space-y-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <div className="flex items-center gap-3">
              <div className="h-1 w-12 bg-gradient-accent rounded-full" />
              <h2 className="text-2xl font-display font-bold text-foreground">Location Analytics</h2>
            </div>
            <div className="space-y-6">
              {mapLocationData.length > 0 && <MoodMap locationData={mapLocationData} />}
              {locationData.length > 0 && <LocationChart data={locationData} />}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default MoodDashboard;

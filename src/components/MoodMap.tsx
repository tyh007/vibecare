import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LocationPoint {
  name: string;
  coordinates: [number, number];
  avgMood: number;
  visits: number;
}

interface MoodMapProps {
  locationData: LocationPoint[];
}

export const MoodMap = ({ locationData }: MoodMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    if (!mapContainer.current || locationData.length === 0) return;

    const mapboxToken = import.meta.env.VITE_MAPBOX_TOKEN?.trim();

    if (!mapboxToken) {
      setMapError(true);
      return;
    }

    try {
      mapboxgl.accessToken = mapboxToken;
      
      // Calculate center point from all locations
      const avgLng = locationData.reduce((sum, loc) => sum + loc.coordinates[0], 0) / locationData.length;
      const avgLat = locationData.reduce((sum, loc) => sum + loc.coordinates[1], 0) / locationData.length;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: 'mapbox://styles/mapbox/light-v11',
        center: [avgLng, avgLat],
        zoom: 12,
      });

      map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

      map.current.on('load', () => {
        if (!map.current) return;

        // Add markers for each location
        locationData.forEach((location) => {
          if (!map.current) return;

          // Color based on mood (1-5 scale)
          const moodColors = {
            1: '#ef4444', // red (sad)
            2: '#f97316', // orange
            3: '#eab308', // yellow (neutral)
            4: '#84cc16', // lime
            5: '#22c55e', // green (happy)
          };

          const moodScore = Math.round(location.avgMood);
          const color = moodColors[moodScore as keyof typeof moodColors] || '#eab308';

          // Create marker
          const el = document.createElement('div');
          el.className = 'mood-marker';
          el.style.width = '30px';
          el.style.height = '30px';
          el.style.borderRadius = '50%';
          el.style.backgroundColor = color;
          el.style.border = '3px solid white';
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';
          el.style.cursor = 'pointer';
          el.style.transition = 'transform 0.2s';

          el.addEventListener('mouseenter', () => {
            el.style.transform = 'scale(1.2)';
          });

          el.addEventListener('mouseleave', () => {
            el.style.transform = 'scale(1)';
          });

          // Create popup
          const popup = new mapboxgl.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong style="font-size: 14px;">${location.name}</strong><br/>
              <span style="color: #666;">Avg Mood: ${location.avgMood.toFixed(1)}/5</span><br/>
              <span style="color: #666;">Visits: ${location.visits}</span>
            </div>
          `);

          new mapboxgl.Marker(el)
            .setLngLat(location.coordinates)
            .setPopup(popup)
            .addTo(map.current);
        });
      });

    } catch (error) {
      console.error('Error initializing map:', error);
      setMapError(true);
    }

    return () => {
      map.current?.remove();
    };
  }, [locationData]);

  if (mapError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            Mood Heat Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              To enable the mood map, add your Mapbox token in <code>src/components/MoodMap.tsx</code>.
              Get a free token at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="underline">mapbox.com</a>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-primary" />
          Mood Heat Map
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">Mood Scale:</span>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#ef4444]" />
              <span className="text-xs">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#eab308]" />
              <span className="text-xs">Neutral</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded-full bg-[#22c55e]" />
              <span className="text-xs">High</span>
            </div>
          </div>
          <div ref={mapContainer} className="w-full h-[400px] rounded-lg" />
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Click on markers to see details. Note: Mood at a location may be influenced by events earlier in the day.
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};

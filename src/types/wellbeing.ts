export interface MoodEntry {
  mood: number;
  reasons?: string[];
  note?: string;
  timestamp: string;
  location?: string;
}

export interface HealthEntry {
  sleep?: string;
  exercise?: string;
  water?: string;
  caffeine?: string;
  meals?: string;
  timestamp: string;
  date: string;
}

export interface ScreenTimeApp {
  app: string;
  minutes: string;
}

export interface ScreenTimeEntry {
  apps: ScreenTimeApp[];
  totalMinutes: number;
  timestamp: string;
  date: string;
  location?: string;
}

export interface LocationChartDatum {
  location: string;
  timeSpent: number;
  avgMood: number;
  avgScreenTime: number;
}

export interface MapLocationDatum {
  name: string;
  coordinates: [number, number];
  avgMood: number;
  visits: number;
}

export const readLocalArray = <T,>(key: string): T[] => {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key) ?? "[]");
    return Array.isArray(value) ? (value as T[]) : [];
  } catch {
    return [];
  }
};

export const getErrorMessage = (
  error: unknown,
  fallback = "Something went wrong. Please try again.",
) => (error instanceof Error ? error.message : fallback);

export const initializeMockData = () => {
  // Check if data already exists (and has location data)
  const existingData = localStorage.getItem("moodEntries");
  if (existingData) {
    try {
      const parsed = JSON.parse(existingData);
      // If existing data doesn't have location field, clear and regenerate
      if (parsed.length > 0 && !parsed[0].location) {
        clearMockData();
      } else if (localStorage.getItem("dataInitialized")) {
        return;
      }
    } catch (e) {
      clearMockData();
    }
  }

  const now = new Date();
  const moodEntries = [];
  const healthEntries = [];
  const screenTimeEntries = [];

  // Realistic weekly pattern: 0=Sun, 6=Sat
  const getDayType = (date: Date) => {
    const day = date.getDay();
    return day === 0 || day === 6 ? 'weekend' : 'weekday';
  };

  // Generate data for the last 14 days for better pattern detection
  for (let i = 13; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString();
    const dayType = getDayType(date);
    const isWeekend = dayType === 'weekend';

    // Determine primary location for the day
    const locations = ["home", "work", "gym", "school", "cafe_a", "cafe_b", "cafe_c", "park", "library"];
    let primaryLocation = isWeekend ? "home" : "work";
    
    // Sometimes go to other places
    const rand = Math.random();
    if (rand > 0.7) {
      const otherLocations = ["gym", "school", "cafe_a", "cafe_b", "cafe_c", "park", "library"];
      primaryLocation = otherLocations[Math.floor(Math.random() * otherLocations.length)];
    }

    // Health data influences mood (generate first)
    const sleepHours = isWeekend 
      ? 6.5 + Math.random() * 2.5  // 6.5-9 hours on weekends
      : 5.5 + Math.random() * 2;   // 5.5-7.5 hours on weekdays
    
    const hadExercise = Math.random() > (isWeekend ? 0.3 : 0.6); // More likely on weekends
    const exerciseMinutes = hadExercise ? Math.floor(20 + Math.random() * 50) : 0;
    
    const waterGlasses = hadExercise 
      ? Math.floor(6 + Math.random() * 4)  // 6-10 if exercised
      : Math.floor(3 + Math.random() * 4); // 3-7 otherwise
    
    const caffeineCups = sleepHours < 6.5 
      ? Math.floor(2 + Math.random() * 3)  // 2-4 if tired
      : Math.floor(1 + Math.random() * 2); // 1-2 otherwise
    
    const meals = Math.floor(2 + Math.random() * 2); // 2-3 meals

    // Calculate base mood influenced by health factors
    let baseMoodScore = 3; // Start neutral
    
    // Sleep impact (strongest factor)
    if (sleepHours >= 7.5) baseMoodScore += 1.5;
    else if (sleepHours >= 6.5) baseMoodScore += 0.5;
    else if (sleepHours < 6) baseMoodScore -= 1;
    
    // Exercise impact
    if (hadExercise) baseMoodScore += 1;
    
    // Hydration impact (subtle)
    if (waterGlasses >= 7) baseMoodScore += 0.3;
    
    // Weekend boost
    if (isWeekend) baseMoodScore += 0.5;

    // Generate 2-4 mood entries per day
    const numMoodEntries = isWeekend ? 2 : Math.floor(Math.random() * 2) + 2;
    
    for (let j = 0; j < numMoodEntries; j++) {
      const entryTime = new Date(date);
      const hourOfDay = j === 0 ? 8 + Math.random() * 2 : 12 + j * 4 + Math.random() * 2;
      entryTime.setHours(Math.floor(hourOfDay), Math.floor(Math.random() * 60));
      
      // Add time-of-day variation
      let moodScore = baseMoodScore;
      if (hourOfDay < 10 && sleepHours < 6.5) moodScore -= 0.5; // Morning grogginess
      if (hourOfDay > 14 && hadExercise) moodScore += 0.3; // Post-exercise boost
      
      // Location-based mood modifiers
      const locationMoodBonus: Record<string, number> = {
        "gym": 0.8,
        "park": 0.6,
        "cafe_a": 0.4,
        "cafe_b": 0.7,
        "cafe_c": 0.3,
        "library": 0.2,
        "home": 0.3,
        "work": -0.2,
        "school": 0,
      };
      moodScore += (locationMoodBonus[primaryLocation] || 0);
      
      // Add random daily events
      const randomEvent = Math.random();
      if (randomEvent > 0.85) moodScore += 1; // Good thing happened
      else if (randomEvent < 0.15) moodScore -= 1; // Bad thing happened
      
      // Convert to 1-5 scale
      const mood = Math.max(1, Math.min(5, Math.round(moodScore)));

      // Realistic reasons based on actual mood and factors
      const moodReasons = {
        5: [
          hadExercise ? "I took care of myself" : "Something positive happened",
          sleepHours >= 7.5 ? "I feel energized and motivated" : "I accomplished something today",
          isWeekend ? "I spent time with loved ones" : "I had a productive day",
        ],
        4: [
          "Things are going well",
          hadExercise ? "I made progress on my goals" : "I'm feeling content",
          "I had pleasant interactions",
        ],
        3: [
          sleepHours < 6.5 ? "I'm tired or stressed" : "It's just another day",
          "Some ups and downs",
          "Nothing special happened",
        ],
        2: [
          sleepHours < 6 ? "I'm tired or stressed" : "Feeling a bit overwhelmed",
          "Something didn't go as planned",
          caffeineCups > 2 ? "Feeling uncertain about things" : "Missing someone or something",
        ],
        1: [
          "I'm going through a difficult time",
          sleepHours < 6 ? "Struggling with negative thoughts" : "Feeling lonely or isolated",
          "Something painful happened",
        ],
      };

      const availableReasons = moodReasons[mood as keyof typeof moodReasons];
      const numReasons = Math.floor(Math.random() * 2) + 1;
      const selectedReasons = availableReasons.slice(0, numReasons);

      // Realistic notes (only sometimes)
      let note = "";
      if (Math.random() > 0.6) {
        const notes = [
          mood > 3 ? "Had a good day overall" : "Rough day, but managing",
          hadExercise ? "Workout helped clear my mind" : "Need to move more",
          sleepHours < 6 ? "Really need better sleep" : "",
          isWeekend ? "Enjoying some downtime" : "Busy workday",
          mood === 5 ? "Feeling really grateful today" : "",
          mood === 1 ? "Taking it one step at a time" : "",
        ];
        note = notes[Math.floor(Math.random() * notes.length)];
      }

      // Calculate screen time for this entry (varies throughout the day)
      const entryScreenTime = isWeekend 
        ? Math.floor(120 + Math.random() * 90)  // 120-210 min on weekends
        : Math.floor(60 + Math.random() * 120);  // 60-180 min on weekdays
      
      moodEntries.push({
        mood,
        reasons: selectedReasons,
        note,
        timestamp: entryTime.toISOString(),
        location: primaryLocation,
        sleep_hours: parseFloat(sleepHours.toFixed(1)),
        physical_activity_minutes: exerciseMinutes,
        screen_time_minutes: entryScreenTime,
        hydration_ml: waterGlasses * 250, // Convert glasses to ml (1 glass = 250ml)
      });
    }

    // Save health entry
    healthEntries.push({
      sleep: sleepHours.toFixed(1),
      exercise: exerciseMinutes.toString(),
      water: waterGlasses.toString(),
      caffeine: caffeineCups.toString(),
      meals: meals.toString(),
      timestamp: date.toISOString(),
      date: dateStr,
    });

    // Screen time - higher when mood is lower or on weekends
    const baseScreenTime = isWeekend ? 180 : 120; // Base minutes
    const moodModifier = baseMoodScore < 3 ? 60 : 0; // More screen time when feeling down
    
    const socialMediaApps = [
      { 
        app: "Instagram", 
        minutes: Math.floor(baseScreenTime * 0.4 + Math.random() * 40 + moodModifier * 0.4)
      },
      { 
        app: "Twitter", 
        minutes: Math.floor(baseScreenTime * 0.25 + Math.random() * 30 + moodModifier * 0.3)
      },
      { 
        app: "TikTok", 
        minutes: Math.floor(baseScreenTime * 0.35 + Math.random() * 50 + moodModifier * 0.3)
      },
    ];

    // Weekend includes Netflix/YouTube
    if (isWeekend) {
      socialMediaApps.push({
        app: "YouTube",
        minutes: Math.floor(60 + Math.random() * 90),
      });
    }

    // Select 2-4 apps randomly
    const numApps = Math.floor(Math.random() * 2) + 2;
    const selectedApps = socialMediaApps
      .sort(() => Math.random() - 0.5)
      .slice(0, numApps)
      .map(app => ({
        ...app,
        minutes: app.minutes.toString()
      }));

    screenTimeEntries.push({
      apps: selectedApps,
      totalMinutes: selectedApps.reduce((sum, app) => sum + Number(app.minutes), 0),
      timestamp: date.toISOString(),
      date: dateStr,
      location: primaryLocation,
    });
  }

  // Save to localStorage
  localStorage.setItem("moodEntries", JSON.stringify(moodEntries));
  localStorage.setItem("healthEntries", JSON.stringify(healthEntries));
  localStorage.setItem("screenTimeEntries", JSON.stringify(screenTimeEntries));
  localStorage.setItem("dataInitialized", "true");

  console.log("Realistic mock data initialized:", {
    moodEntries: moodEntries.length,
    healthEntries: healthEntries.length,
    screenTimeEntries: screenTimeEntries.length,
    days: 14,
  });
};

export const clearMockData = () => {
  localStorage.removeItem("moodEntries");
  localStorage.removeItem("healthEntries");
  localStorage.removeItem("screenTimeEntries");
  localStorage.removeItem("dataInitialized");
  console.log("Mock data cleared");
};

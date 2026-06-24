import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface RewardState {
  points: number;
  level: number;
  streak: number;
  lastCheckIn: string | null;
  totalCheckIns: number;
  completedActivities: number;
}

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1700];

const REWARD_POINTS = {
  moodCheckIn: 5,
  addEvent: 3,
  completeActivity: 10,
  addNotes: 5,
  streakBonus: 15,
  weeklyGoal: 25,
};

export const useRewardSystem = () => {
  const { toast } = useToast();
  const [rewardState, setRewardState] = useState<RewardState>({
    points: 0,
    level: 0,
    streak: 0,
    lastCheckIn: null,
    totalCheckIns: 0,
    completedActivities: 0,
  });

  // Load from database on mount
  useEffect(() => {
    loadRewardState();
  }, []);

  const loadRewardState = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("coins, current_streak, total_check_ins, last_check_in, longest_streak")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile) {
      const points = profile.coins || 0;
      setRewardState({
        points,
        level: calculateLevel(points),
        streak: profile.current_streak || 0,
        lastCheckIn: profile.last_check_in,
        totalCheckIns: profile.total_check_ins || 0,
        completedActivities: 0,
      });
    }
  };

  // Sync points to database
  const syncToDatabase = useCallback(async (newPoints: number, updates: Partial<RewardState> = {}) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const dbUpdates: any = { coins: newPoints };
    
    if (updates.streak !== undefined) dbUpdates.current_streak = updates.streak;
    if (updates.totalCheckIns !== undefined) dbUpdates.total_check_ins = updates.totalCheckIns;
    if (updates.lastCheckIn !== undefined) dbUpdates.last_check_in = updates.lastCheckIn;

    await supabase
      .from("profiles")
      .update(dbUpdates)
      .eq("user_id", user.id);
  }, []);

  // Calculate level based on points
  const calculateLevel = useCallback((points: number) => {
    let level = 0;
    for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
      if (points >= LEVEL_THRESHOLDS[i]) {
        level = i;
      } else {
        break;
      }
    }
    return level;
  }, []);

  // Award points with toast notification
  const awardPoints = useCallback((amount: number, reason: string, emoji: string = "⭐") => {
    setRewardState(prev => {
      const newPoints = prev.points + amount;
      const newLevel = calculateLevel(newPoints);
      const leveledUp = newLevel > prev.level;

      // Show toast notification
      setTimeout(() => {
        toast({
          title: leveledUp ? "🎉 Level Up!" : `${emoji} +${amount} Vibe Energy!`,
          description: leveledUp 
            ? `You reached Level ${newLevel}! ${reason}` 
            : reason,
        });
      }, 100);

      // Sync to database after state update
      setTimeout(() => {
        syncToDatabase(newPoints);
      }, 0);

      return {
        ...prev,
        points: newPoints,
        level: newLevel,
      };
    });
  }, [calculateLevel, toast, syncToDatabase]);

  // Specific reward functions
  const rewardMoodCheckIn = useCallback(() => {
    const today = new Date().toDateString();
    
    setRewardState(prev => {
      const lastCheckIn = prev.lastCheckIn;
      const yesterday = new Date(Date.now() - 86400000).toDateString();
      
      // Check if already checked in today
      if (lastCheckIn === today) {
        return prev;
      }

      const newTotalCheckIns = prev.totalCheckIns + 1;
      let newStreak = prev.streak;
      let bonusPoints = REWARD_POINTS.moodCheckIn;
      
      // Update streak
      if (lastCheckIn === yesterday) {
        newStreak = prev.streak + 1;
        if (newStreak % 7 === 0) {
          bonusPoints += REWARD_POINTS.streakBonus;
        }
      } else if (lastCheckIn !== today) {
        newStreak = 1;
      }

      const newPoints = prev.points + bonusPoints;
      const newLevel = calculateLevel(newPoints);
      const leveledUp = newLevel > prev.level;

      // Show toast
      setTimeout(() => {
        toast({
          title: leveledUp ? "🎉 Level Up!" : `💙 +${bonusPoints} Vibe Energy!`,
          description: leveledUp 
            ? `You reached Level ${newLevel}! Keep checking in!`
            : newStreak > 1 
              ? `${newStreak} day streak! Keep going!` 
              : "Thanks for checking in!",
        });
      }, 100);

      // Sync to database after state update
      setTimeout(() => {
        syncToDatabase(newPoints, { 
          streak: newStreak, 
          totalCheckIns: newTotalCheckIns,
          lastCheckIn: today 
        });
      }, 0);

      return {
        ...prev,
        points: newPoints,
        level: newLevel,
        streak: newStreak,
        lastCheckIn: today,
        totalCheckIns: newTotalCheckIns,
      };
    });
  }, [calculateLevel, toast, syncToDatabase]);

  const rewardEventCreation = useCallback(() => {
    awardPoints(REWARD_POINTS.addEvent, "Great job planning ahead!", "📅");
  }, [awardPoints]);

  const rewardActivityCompletion = useCallback(() => {
    setRewardState(prev => {
      const newActivities = prev.completedActivities + 1;
      const newPoints = prev.points + REWARD_POINTS.completeActivity;
      const newLevel = calculateLevel(newPoints);
      const leveledUp = newLevel > prev.level;

      setTimeout(() => {
        toast({
          title: leveledUp ? "🎉 Level Up!" : "🌟 +10 Vibe Energy!",
          description: leveledUp 
            ? `You reached Level ${newLevel}! ${newActivities} activities completed!`
            : `${newActivities} wellness activities completed!`,
        });
      }, 100);

      // Sync to database after state update
      setTimeout(() => {
        syncToDatabase(newPoints);
      }, 0);

      return {
        ...prev,
        points: newPoints,
        level: newLevel,
        completedActivities: newActivities,
      };
    });
  }, [calculateLevel, toast, syncToDatabase]);

  const rewardNotesTaken = useCallback(() => {
    awardPoints(REWARD_POINTS.addNotes, "Reflection helps you grow!", "📝");
  }, [awardPoints]);

  return {
    ...rewardState,
    awardPoints,
    rewardMoodCheckIn,
    rewardEventCreation,
    rewardActivityCompletion,
    rewardNotesTaken,
  };
};

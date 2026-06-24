import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Star, Heart, Settings } from "lucide-react";
import { VibePartnerDialog } from "./VibePartnerDialog";

interface VibePartnerProps {
  points: number;
  level: number;
  name: string;
  mood?: number;
  type?: 'cat' | 'dog' | 'panda';
  onCustomize: () => void;
}

const LEVEL_THRESHOLDS = [0, 50, 150, 300, 500, 800, 1200, 1700];

const MASCOT_TYPES = {
  cat: {
    happy: "😺",
    excited: "😸",
    loving: "😻",
    calm: "😽",
    comforting: "😿",
    default: "😺"
  },
  dog: {
    happy: "🐕",
    excited: "🐶",
    loving: "🐕‍🦺",
    calm: "🐕",
    comforting: "🐶",
    default: "🐶"
  },
  panda: {
    happy: "🐼",
    excited: "🐼✨",
    loving: "🐼💝",
    calm: "🐼😌",
    comforting: "🐼🤗",
    default: "🐼"
  }
};

const getMascotExpression = (mood?: number, level?: number, type: 'cat' | 'dog' | 'panda' = 'cat') => {
  const mascot = MASCOT_TYPES[type];
  
  if (!mood) return mascot.default;
  if (mood === 1) return mascot.comforting;
  if (mood === 2) return mascot.calm;
  if (mood === 3) return mascot.happy;
  if (mood === 4) return mascot.loving;
  if (mood === 5) return mascot.excited;
  return mascot.default;
};

const getMoodMessage = (mood?: number, name?: string, type: 'cat' | 'dog' | 'panda' = 'cat') => {
  const defaultName = name || `your ${type} friend`;
  const greetings = {
    cat: `Meow~ I'm ${defaultName}! Let's take care of ourselves together! 💙`,
    dog: `Woof! I'm ${defaultName}! So happy to see you! Let's have a great day! 💙`,
    panda: `*munch munch* Hi! I'm ${defaultName}! Let's grow stronger together! 💙`
  };
  
  const messages = {
    cat: {
      1: "*soft purr* I see you're struggling. That's okay - even cats have rough days. I'm here with you. 🤗",
      2: "*gentle headbump* Some days are harder. Let's take it one paw step at a time, together. 💙",
      3: "*content purr* You're doing okay! Every little step forward counts. 😌",
      4: "*happy tail wiggle* You're feeling good today! Your positive energy is purr-fect! 🌟",
      5: "*excited zoom* Wow, you're absolutely glowing! I'm so proud of your progress! ✨"
    },
    dog: {
      1: "*gentle nuzzle* I see you're having a tough time. That's okay - I'm right here beside you. 🤗",
      2: "*sits close* Some days are ruff. Let's take it slow, one paw at a time. 💙",
      3: "*happy tail wag* You're doing great! Keep going, I believe in you! 😌",
      4: "*playful bounce* You're feeling wonderful! Let's keep this pawsitive energy! 🌟",
      5: "*excited zoomies* Amazing! You're doing pawsitively incredible today! ✨"
    },
    panda: {
      1: "*offers bamboo* I see you're having a tough time. That's okay - even pandas need rest days. I'm here. 🤗",
      2: "*sits beside you* Some days are harder. Let's take it slow and steady, together. 💙",
      3: "*munches happily* You're doing great! Progress takes time, just like growing bamboo. 😌",
      4: "*playful roll* You're feeling wonderful! Let's keep this peaceful energy flowing! 🌟",
      5: "*celebrates with bamboo dance* Amazing! You're shining so bright today! I'm so proud! ✨"
    }
  };
  
  if (!mood) return greetings[type];
  return messages[type][mood as keyof typeof messages.cat] || "Every small step counts. You've got this! 💪";
};

export const VibePartner = ({ points, level, name, mood, type = 'cat', onCustomize }: VibePartnerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progressInLevel = points - currentThreshold;
  const pointsNeededForNext = nextThreshold - currentThreshold;
  const progressPercent = (progressInLevel / pointsNeededForNext) * 100;
  
  const expression = getMascotExpression(mood, level, type);
  const message = getMoodMessage(mood, name, type);
  
  useEffect(() => {
    // Check if level just increased
    const lastLevel = parseInt(localStorage.getItem('lastVibeLevel') || '0');
    if (level > lastLevel) {
      setShowCelebration(true);
      localStorage.setItem('lastVibeLevel', level.toString());
      setTimeout(() => setShowCelebration(false), 3000);
    }
  }, [level]);

  return (
    <>
      <Card className="p-6 space-y-4 bg-gradient-to-br from-primary/5 via-secondary/5 to-success/5 border-primary/20 shadow-soft relative overflow-hidden">
        {/* Celebration effect */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 animate-fade-in z-10">
            <div className="text-center space-y-2">
              <div className="text-4xl animate-scale-in">🎉</div>
              <p className="font-bold text-lg text-primary">Level Up!</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-foreground">{name || `Your ${type.charAt(0).toUpperCase() + type.slice(1)} Friend`}</h3>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDialogOpen(true)}
            className="h-8 w-8"
          >
            <Settings className="w-4 h-4" />
          </Button>
        </div>

        {/* Mascot Display */}
        <div className="flex flex-col items-center py-4">
          <div className="relative">
            {/* Cute mascot with floating animation */}
            <div className="relative">
              <div className="text-7xl mb-2 animate-bounce-slow filter drop-shadow-lg">
                {expression}
              </div>
              {/* Sparkle effects for higher levels */}
              {level >= 3 && (
                <div className="absolute -top-2 -right-2 text-2xl animate-pulse">
                  ✨
                </div>
              )}
              {level >= 5 && (
                <div className="absolute -bottom-2 -left-2 text-2xl animate-pulse delay-75">
                  💫
                </div>
              )}
            </div>
            <div className="absolute -top-2 -right-2">
              <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1 shadow-md">
                <Star className="w-3 h-3" />
                <span>Lv {level}</span>
              </div>
            </div>
          </div>
          
          {/* Cute message bubble */}
          <div className="relative bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 rounded-2xl p-3 max-w-[250px] shadow-md mt-2">
            <p className="text-xs text-foreground text-center leading-relaxed font-medium">
              {message}
            </p>
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-card drop-shadow-sm" />
            {/* Cute decorations */}
            <div className="absolute -top-1 -right-1 text-sm">
              {type === 'cat' ? '🐾' : '🎋'}
            </div>
          </div>
        </div>

        {/* Energy Progress */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-primary" />
              Vibe Energy
            </span>
            <span className="font-medium text-foreground">
              {progressInLevel} / {pointsNeededForNext}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">{points} total points</span>
            {level < LEVEL_THRESHOLDS.length - 1 && (
              <span className="text-primary font-medium">
                {pointsNeededForNext - progressInLevel} to next level
              </span>
            )}
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-2 border border-primary/10">
            <div className="text-xl mb-1">🏆</div>
            <div className="text-xs text-muted-foreground font-medium">Level {level}</div>
          </div>
          <div className="bg-gradient-to-br from-secondary/5 to-secondary/10 rounded-lg p-2 border border-secondary/10">
            <div className="text-xl mb-1">⭐</div>
            <div className="text-xs text-muted-foreground font-medium">{points} pts</div>
          </div>
          <div className="bg-gradient-to-br from-success/5 to-success/10 rounded-lg p-2 border border-success/10">
            <div className="text-xl mb-1">{type === 'cat' ? '🐱' : '🐼'}</div>
            <div className="text-xs text-muted-foreground font-medium">
              {type === 'cat' ? 'Purr-fect' : 'Pawsome'}
            </div>
          </div>
        </div>
      </Card>

      <VibePartnerDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        currentName={name}
        currentType={type}
        level={level}
        points={points}
        onCustomize={onCustomize}
      />
    </>
  );
};

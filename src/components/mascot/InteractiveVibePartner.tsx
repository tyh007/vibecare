import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Star, Heart, Settings, Mic, MessageSquare } from "lucide-react";
import { VibePartnerDialog } from "./VibePartnerDialog";
import { VoiceChat } from "./VoiceChat";
import { TextChat } from "./TextChat";

interface InteractiveVibePartnerProps {
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
    default: "😺",
    voice: "meow"
  },
  dog: {
    happy: "🐕",
    excited: "🐶",
    loving: "🐕‍🦺",
    calm: "🐕",
    comforting: "🐶",
    default: "🐶",
    voice: "woof"
  },
  panda: {
    happy: "🐼",
    excited: "🐼✨",
    loving: "🐼💝",
    calm: "🐼😌",
    comforting: "🐼🤗",
    default: "🐼",
    voice: "bamboo"
  }
};

const getMascotExpression = (mood?: number, type: 'cat' | 'dog' | 'panda' = 'cat', isSpeakingOrListening?: boolean) => {
  const mascot = MASCOT_TYPES[type];
  
  if (isSpeakingOrListening) return mascot.excited;
  if (!mood) return mascot.default;
  if (mood === 1) return mascot.comforting;
  if (mood === 2) return mascot.calm;
  if (mood === 3) return mascot.happy;
  if (mood === 4) return mascot.loving;
  if (mood === 5) return mascot.excited;
  return mascot.default;
};

const getGreeting = (type: 'cat' | 'dog' | 'panda', name: string) => {
  const greetings = {
    cat: `*purr* Hi! I'm ${name}! Let's chat about how you're feeling today~ 💙`,
    dog: `*wag wag* Hey there! I'm ${name}! I'm so excited to support you today! 💙`,
    panda: `*munch munch* Hello! I'm ${name}! Let's talk and grow together! 💙`
  };
  return greetings[type];
};

export const InteractiveVibePartner = ({ 
  points, 
  level, 
  name, 
  mood, 
  type = 'cat', 
  onCustomize 
}: InteractiveVibePartnerProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [isSpeakingOrListening, setIsSpeakingOrListening] = useState(false);
  
  const currentThreshold = LEVEL_THRESHOLDS[level] || 0;
  const nextThreshold = LEVEL_THRESHOLDS[level + 1] || LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1];
  const progressInLevel = points - currentThreshold;
  const pointsNeededForNext = nextThreshold - currentThreshold;
  const progressPercent = (progressInLevel / pointsNeededForNext) * 100;
  
  const expression = getMascotExpression(mood, type, isSpeakingOrListening);
  const greeting = getGreeting(type, name);

  return (
    <>
      <Card className="relative overflow-hidden bg-gradient-to-br from-primary/5 via-secondary/5 to-success/5 border-primary/20 shadow-xl">
        {/* Celebration effect */}
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/10 animate-fade-in z-10">
            <div className="text-center space-y-2">
              <div className="text-6xl animate-scale-in">🎉</div>
              <p className="font-bold text-2xl text-primary">Level Up!</p>
            </div>
          </div>
        )}

        <div className="p-8 space-y-6">
          {/* Header with settings */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Heart className="w-6 h-6 text-primary" />
                <h2 className="font-bold text-2xl text-foreground">{name || `Your ${type.charAt(0).toUpperCase() + type.slice(1)} Friend`}</h2>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsDialogOpen(true)}
            >
              <Settings className="w-5 h-5" />
            </Button>
          </div>

            {/* Large mascot display */}
          <div className="flex flex-col items-center py-8">
            <div className="relative mb-6">
              {/* Main mascot with animations */}
              <div className="relative">
                <div className={`text-9xl transition-all duration-300 ${
                  isSpeakingOrListening ? 'animate-pulse scale-110' : 'animate-bounce-slow'
                }`}>
                  {expression}
                </div>
                
                {/* Speaking/Listening indicator */}
                {isSpeakingOrListening && (
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex gap-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                
                {/* Level badge */}
                <div className="absolute -top-4 -right-4">
                  <div className="bg-gradient-to-r from-primary to-secondary text-primary-foreground text-sm font-bold px-3 py-1 rounded-full flex items-center gap-2 shadow-lg">
                    <Star className="w-4 h-4" />
                    <span>Lv {level}</span>
                  </div>
                </div>
                
                {/* Sparkle effects */}
                {level >= 3 && (
                  <>
                    <div className="absolute -top-6 -left-6 text-3xl animate-pulse">✨</div>
                    <div className="absolute -bottom-6 -right-6 text-3xl animate-pulse delay-75">💫</div>
                  </>
                )}
              </div>
            </div>
            
            {/* Message bubble */}
            <div className="relative bg-gradient-to-br from-card via-card to-primary/5 border-2 border-primary/20 rounded-3xl p-6 max-w-md shadow-lg">
              <p className="text-center leading-relaxed font-medium text-foreground">
                {greeting}
              </p>
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-12 border-r-12 border-t-12 border-l-transparent border-r-transparent border-t-card drop-shadow-md" />
            </div>
          </div>

          {/* Chat Interface */}
          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="text" className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Text Chat
              </TabsTrigger>
              <TabsTrigger value="voice" className="flex items-center gap-2">
                <Mic className="w-4 h-4" />
                Voice Chat
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="text" className="mt-4">
              <TextChat
                partnerName={name}
                partnerType={type}
                mood={mood}
              />
            </TabsContent>
            
            <TabsContent value="voice" className="mt-4">
              <VoiceChat
                partnerName={name}
                partnerType={type}
                mood={mood}
                onSpeakingChange={setIsSpeakingOrListening}
              />
            </TabsContent>
          </Tabs>

          {/* Energy Progress */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                Vibe Energy
              </span>
              <span className="font-bold text-foreground">
                {progressInLevel} / {pointsNeededForNext}
              </span>
            </div>
            <Progress value={progressPercent} className="h-3" />
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{points} total points</span>
              {level < LEVEL_THRESHOLDS.length - 1 && (
                <span className="text-primary font-semibold">
                  {pointsNeededForNext - progressInLevel} to next level
                </span>
              )}
            </div>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-4 border border-primary/20 text-center">
              <div className="text-3xl mb-2">🏆</div>
              <div className="text-xs text-muted-foreground font-medium">Level {level}</div>
            </div>
            <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl p-4 border border-secondary/20 text-center">
              <div className="text-3xl mb-2">⭐</div>
              <div className="text-xs text-muted-foreground font-medium">{points} pts</div>
            </div>
            <div className="bg-gradient-to-br from-success/10 to-success/5 rounded-xl p-4 border border-success/20 text-center">
              <div className="text-3xl mb-2">{type === 'cat' ? '🐱' : type === 'dog' ? '🐶' : '🐼'}</div>
              <div className="text-xs text-muted-foreground font-medium">
                {type === 'cat' ? 'Purr-fect' : type === 'dog' ? 'Paw-some' : 'Bam-amazing'}
              </div>
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

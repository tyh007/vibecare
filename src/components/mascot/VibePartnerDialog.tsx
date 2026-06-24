import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Trophy, Star, Heart, Sparkles } from "lucide-react";
import { MascotSelector } from "./MascotSelector";

interface VibePartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentName: string;
  currentType: 'cat' | 'dog' | 'panda';
  level: number;
  points: number;
  onCustomize: () => void;
}

const ACHIEVEMENTS = [
  { id: 1, title: "First Check-in", desc: "Complete your first mood check", icon: "🌟", requiredPoints: 5, unlocked: true },
  { id: 2, title: "Week Warrior", desc: "Log 7 consecutive days", icon: "🔥", requiredPoints: 50, unlocked: false },
  { id: 3, title: "Wellness Champion", desc: "Complete 10 wellness activities", icon: "💪", requiredPoints: 100, unlocked: false },
  { id: 4, title: "Self-Care Star", desc: "Reach level 5", icon: "✨", requiredPoints: 500, unlocked: false },
  { id: 5, title: "Mindful Master", desc: "Complete 20 guided exercises", icon: "🧘", requiredPoints: 200, unlocked: false },
  { id: 6, title: "Progress Pro", desc: "Track mood for 30 days", icon: "📈", requiredPoints: 300, unlocked: false },
];

const UNLOCKABLES = [
  { level: 0, items: ["Classic Smile 😊", "Basic Support 💙"] },
  { level: 1, items: ["Happy Dance ✨", "Celebration 🎉"] },
  { level: 2, items: ["Comforting Hug 🤗", "Warm Heart ❤️"] },
  { level: 3, items: ["Power Up ⚡", "Growth Sprout 🌱"] },
  { level: 4, items: ["Zen Mode 🧘", "Peaceful Aura ☮️"] },
  { level: 5, items: ["Champion Crown 👑", "Victory Shine 🌟"] },
];

export const VibePartnerDialog = ({
  open,
  onOpenChange,
  currentName,
  currentType,
  level,
  points,
  onCustomize,
}: VibePartnerDialogProps) => {
  const [newName, setNewName] = useState(currentName);
  const [selectedType, setSelectedType] = useState<'cat' | 'dog' | 'panda'>(currentType);
  
  const handleSave = () => {
    localStorage.setItem('vibePartnerName', newName);
    localStorage.setItem('vibePartnerType', selectedType);
    onCustomize();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="w-5 h-5 text-primary" />
            {currentName || `Your ${currentType.charAt(0).toUpperCase() + currentType.slice(1)} Friend`}
          </DialogTitle>
          <DialogDescription>
            Customize your companion and view your progress
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="customize" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="customize">Customize</TabsTrigger>
            <TabsTrigger value="achievements">Rewards</TabsTrigger>
            <TabsTrigger value="unlocks">Unlocks</TabsTrigger>
          </TabsList>

          {/* Customize Tab */}
          <TabsContent value="customize" className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-3 block">Choose Your Partner</Label>
                <MascotSelector selected={selectedType} onSelect={setSelectedType} />
              </div>

              <Card className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
                <div className="text-center space-y-3">
                  <div className="text-6xl">
                    {selectedType === 'cat' ? '😺' : selectedType === 'dog' ? '🐶' : '🐼'}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="partner-name">Partner Name</Label>
                    <Input
                      id="partner-name"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder={
                        selectedType === 'cat' ? 'e.g., Whiskers' : 
                        selectedType === 'dog' ? 'e.g., Buddy' : 
                        'e.g., Bamboo'
                      }
                      maxLength={20}
                    />
                  </div>
                </div>
              </Card>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-sm">About Your Partner</h4>
              <Card className="p-4 bg-muted/50">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your companion is here to support you on your wellness journey. 
                  They grow stronger as you take care of yourself, celebrating your wins 
                  and offering comfort during tough times. Think of them as your personal 
                  cheerleader and CBT coach combined! 💙
                </p>
              </Card>
            </div>

            <Button onClick={handleSave} className="w-full">
              Save Changes
            </Button>
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="space-y-3">
              {ACHIEVEMENTS.map((achievement) => {
                const unlocked = points >= achievement.requiredPoints;
                return (
                  <Card
                    key={achievement.id}
                    className={`p-4 ${
                      unlocked 
                        ? 'bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/30' 
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`text-3xl ${!unlocked && 'grayscale opacity-50'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{achievement.title}</h4>
                          {unlocked && <Trophy className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {achievement.desc}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span className="text-xs font-medium">
                            {achievement.requiredPoints} points
                          </span>
                          {unlocked && (
                            <span className="text-xs text-success ml-auto">✓ Unlocked</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          {/* Unlocks Tab */}
          <TabsContent value="unlocks" className="space-y-4">
            <div className="space-y-3">
              {UNLOCKABLES.map((unlock, idx) => {
                const unlocked = level >= unlock.level;
                return (
                  <Card
                    key={idx}
                    className={`p-4 ${
                      unlocked 
                        ? 'bg-gradient-to-r from-success/10 to-primary/10 border-success/30' 
                        : 'bg-muted/30'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                        <Star className={`w-5 h-5 ${unlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">Level {unlock.level}</h4>
                          {unlocked ? (
                            <span className="text-xs text-success font-medium">✓ Unlocked</span>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              Locked
                            </span>
                          )}
                        </div>
                        <div className="mt-2 space-y-1">
                          {unlock.items.map((item, itemIdx) => (
                            <div
                              key={itemIdx}
                              className={`text-xs ${
                                unlocked ? 'text-foreground' : 'text-muted-foreground'
                              }`}
                            >
                              • {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-4 bg-primary/5">
              <p className="text-xs text-center text-muted-foreground">
                Keep taking care of yourself to unlock more expressions and rewards! 💫
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

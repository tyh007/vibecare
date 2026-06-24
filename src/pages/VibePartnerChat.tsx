import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Brain } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { InteractiveVibePartner } from "@/components/mascot/InteractiveVibePartner";
import { useRewardSystem } from "@/hooks/useRewardSystem";
import { useState, useEffect } from "react";

const VibePartnerChat = () => {
  const navigate = useNavigate();
  const rewardSystem = useRewardSystem();
  
  const [partnerName, setPartnerName] = useState(() => 
    localStorage.getItem('vibePartnerName') || 'Vibe Buddy'
  );
  const [partnerType, setPartnerType] = useState<'cat' | 'dog' | 'panda'>(() => 
    (localStorage.getItem('vibePartnerType') as 'cat' | 'dog' | 'panda') || 'cat'
  );
  
  // Get latest mood from localStorage
  const [currentMood, setCurrentMood] = useState<number | undefined>(() => {
    const moods = localStorage.getItem('vc_moods');
    if (moods) {
      try {
        const parsed = JSON.parse(moods);
        return parsed[parsed.length - 1]?.mood;
      } catch {}
    }
    return undefined;
  });

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8 space-y-2">
            <h1 className="text-4xl font-bold text-foreground">Talk with {partnerName || `Your ${partnerType.charAt(0).toUpperCase() + partnerType.slice(1)} Friend`}</h1>
            <p className="text-lg text-muted-foreground">
              Share your feelings, get support, and receive personalized wellness guidance
            </p>
          </div>

          {/* Professional Help Banner */}
          <Card 
            className="mb-6 p-4 bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => navigate('/cbt-therapist')}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground">Need deeper support?</h3>
                <p className="text-sm text-muted-foreground">
                  Talk to our professional CBT therapist for evidence-based mental health guidance
                </p>
              </div>
              <Button size="sm" variant="outline">
                Start Session
              </Button>
            </div>
          </Card>

          <InteractiveVibePartner
            points={rewardSystem.points}
            level={rewardSystem.level}
            name={partnerName}
            mood={currentMood}
            type={partnerType}
            onCustomize={() => {
              setPartnerName(localStorage.getItem('vibePartnerName') || 'Vibe Buddy');
              setPartnerType((localStorage.getItem('vibePartnerType') as 'cat' | 'dog' | 'panda') || 'cat');
            }}
          />

          {/* Help text */}
          <div className="mt-8 text-center space-y-4">
            <p className="text-sm text-muted-foreground">
              💡 {partnerName || `Your ${partnerType} friend`} uses AI to provide empathetic support and CBT-based guidance
            </p>
            <div className="flex flex-wrap justify-center gap-4 text-xs text-muted-foreground">
              <div>✨ Trained in CBT techniques</div>
              <div>🤗 Non-judgmental listening</div>
              <div>🎯 Personalized suggestions</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VibePartnerChat;

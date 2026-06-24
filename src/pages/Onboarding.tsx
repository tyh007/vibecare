import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Heart, ArrowRight, Shield, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

const Onboarding = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const totalSteps = 3;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      toast({
        title: "You're all set! 🎉",
        description: "Welcome to your VibeCare dashboard",
      });
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-foreground">Step {step} of {totalSteps}</span>
            <span className="text-sm text-muted-foreground">{Math.round((step / totalSteps) * 100)}% complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-primary transition-all duration-500"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        <Card className="p-8 shadow-medium bg-card">
          {/* Step 1: Consent & Privacy */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Your Privacy Matters</h2>
                <p className="text-muted-foreground">
                  VibeCare is built with privacy-first principles. Let's set your preferences.
                </p>
              </div>

              <div className="space-y-4 py-4">
                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="consent-data" className="mt-1" defaultChecked />
                    <div>
                      <Label htmlFor="consent-data" className="font-medium cursor-pointer">
                        Store my calendar and mood data securely
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Encrypted and accessible only to you. Required for core features.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="consent-browsing" className="mt-1" />
                    <div>
                      <Label htmlFor="consent-browsing" className="font-medium cursor-pointer">
                        Enable browsing supervision (optional)
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        On-device content analysis with gentle warnings. You control what's tracked.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                  <div className="flex items-start gap-3">
                    <input type="checkbox" id="consent-anonymous" className="mt-1" />
                    <div>
                      <Label htmlFor="consent-anonymous" className="font-medium cursor-pointer">
                        Share anonymous usage data to improve VibeCare
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Help us make the app better. No personal information shared.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                You can change these preferences anytime in Settings
              </p>
            </div>
          )}

          {/* Step 2: Emergency Contact */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                  <Heart className="w-8 h-8 text-secondary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Safety First</h2>
                <p className="text-muted-foreground">
                  Add an emergency contact who we can notify if you're in crisis (optional but recommended).
                </p>
              </div>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="emergency-name">Emergency Contact Name</Label>
                  <Input 
                    id="emergency-name" 
                    placeholder="e.g., Mom, Best Friend, Campus Counselor" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency-phone">Phone Number</Label>
                  <Input 
                    id="emergency-phone" 
                    type="tel" 
                    placeholder="+1 (555) 000-0000" 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="emergency-email">Email (optional)</Label>
                  <Input 
                    id="emergency-email" 
                    type="email" 
                    placeholder="contact@example.com" 
                  />
                </div>

                <div className="p-4 rounded-lg bg-accent/5 border border-accent/20">
                  <p className="text-sm text-foreground font-medium mb-2">When will they be contacted?</p>
                  <p className="text-sm text-muted-foreground">
                    Only if you explicitly trigger an alert or if VibeCare detects serious crisis indicators. 
                    You stay in control.
                  </p>
                </div>
              </div>

              <div className="text-center">
                <button 
                  className="text-sm text-primary hover:underline"
                  onClick={handleNext}
                >
                  Skip for now
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Initial Mood Baseline */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                  <Calendar className="w-8 h-8 text-success" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">Let's Start Your Journey</h2>
                <p className="text-muted-foreground">
                  Help us understand where you're starting from. How have you been feeling lately?
                </p>
              </div>

              <div className="space-y-6 py-4">
                {/* Mood Scale */}
                <div className="space-y-3">
                  <Label className="text-base">Overall mood this week</Label>
                  <div className="flex justify-between gap-2">
                    {[
                      { emoji: '😢', label: 'Struggling' },
                      { emoji: '😕', label: 'Not great' },
                      { emoji: '😐', label: 'Okay' },
                      { emoji: '🙂', label: 'Good' },
                      { emoji: '😊', label: 'Great' }
                    ].map((mood, idx) => (
                      <button
                        key={idx}
                        className="flex-1 flex flex-col items-center gap-2 p-3 rounded-lg bg-muted hover:bg-primary/10 hover:scale-105 transition-all"
                      >
                        <span className="text-3xl">{mood.emoji}</span>
                        <span className="text-xs text-muted-foreground">{mood.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Anxiety Level */}
                <div className="space-y-3">
                  <Label className="text-base">Anxiety level</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {['Very Low', 'Low', 'Moderate', 'High', 'Very High'].map((level, idx) => (
                      <button
                        key={idx}
                        className="p-3 rounded-lg bg-muted hover:bg-secondary/10 transition-colors text-sm"
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sleep Quality */}
                <div className="space-y-3">
                  <Label className="text-base">Sleep quality</Label>
                  <div className="grid grid-cols-3 gap-2">
                    {['Poor', 'Fair', 'Good'].map((quality, idx) => (
                      <button
                        key={idx}
                        className="p-3 rounded-lg bg-muted hover:bg-success/10 transition-colors"
                      >
                        {quality}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-sm text-muted-foreground">
                    💡 This baseline helps VibeCare track your progress and personalize suggestions. 
                    Your responses are private and encrypted.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex gap-3 mt-8">
            {step > 1 && (
              <Button 
                variant="outline" 
                onClick={() => setStep(step - 1)}
                className="flex-1"
              >
                Back
              </Button>
            )}
            <Button 
              variant="hero" 
              onClick={handleNext}
              className="flex-1"
            >
              {step === totalSteps ? 'Start Using VibeCare' : 'Continue'}
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Onboarding;

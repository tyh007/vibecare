import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Calendar, Heart, Shield, Sparkles, BookOpen, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-image.jpg";
import calendarIcon from "@/assets/calendar-icon.png";
import moodIcon from "@/assets/mood-icon.png";
import privacyIcon from "@/assets/privacy-icon.png";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left: Hero Content */}
            <div className="space-y-8 text-center lg:text-left animate-fade-in">
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full glass border-2 border-primary/20 shadow-medium animate-slide-in-right">
                <Sparkles className="w-5 h-5 text-primary" />
                <span className="text-sm font-bold text-primary">Your Personal Wellness Partner</span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-display font-bold text-foreground leading-tight">
                Balance your schedule,{" "}
                <span className="gradient-text animate-glow-pulse">
                  nurture your mind
                </span>
              </h1>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-xl mx-auto lg:mx-0 leading-relaxed">
                VibeCare helps college students reduce anxiety and boost well-being through calendar-first planning, gentle mood tracking, and personalized micro-interventions.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-4">
                <Button 
                  size="xl" 
                  variant="hero"
                  onClick={() => navigate('/auth')}
                  className="group"
                >
                  Get Started Free
                  <Sparkles className="ml-2 h-5 w-5 group-hover:rotate-12 transition-transform" />
                </Button>
                <Button 
                  size="xl" 
                  variant="outline"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Learn More
                </Button>
              </div>
              
              <div className="flex items-center gap-8 justify-center lg:justify-start text-base text-muted-foreground pt-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Shield className="w-4 h-4 text-primary" />
                  </div>
                  <span className="font-medium">Privacy-first</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary/10 flex items-center justify-center">
                    <Heart className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="font-medium">Student-focused</span>
                </div>
              </div>
            </div>
            
            {/* Right: Hero Image */}
            <div className="relative animate-slide-up">
              <div className="relative rounded-3xl overflow-hidden shadow-large hover-lift transition-all border-4 border-border/20">
                <img 
                  src={heroImage} 
                  alt="Student peacefully organizing their day" 
                  className="w-full h-auto"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
              </div>
              <div className="absolute -bottom-8 -right-8 w-40 h-40 bg-primary/20 rounded-full blur-3xl animate-glow-pulse" />
              <div className="absolute -top-8 -left-8 w-40 h-40 bg-secondary/20 rounded-full blur-3xl animate-glow-pulse" />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-muted/20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 space-y-6 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-display font-bold gradient-text">
              Everything you need to thrive
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              VibeCare combines powerful tools in one privacy-first platform designed specifically for college students.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1: Calendar-First Planning */}
            <Card className="p-8 space-y-5 hover-lift hover-glow transition-all animate-fade-in glass border-2 border-border/50 shadow-medium">
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-medium">
                <img src={calendarIcon} alt="Calendar" className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-display font-bold text-card-foreground">Calendar-First Planning</h3>
              <p className="text-muted-foreground leading-relaxed">
                Organize your academic life with an intuitive timetable. Add rich notes to every event for continuous, context-aware learning.
              </p>
            </Card>

            {/* Feature 2: Mood Tracking */}
            <Card className="p-8 space-y-5 hover-lift hover-glow transition-all animate-fade-in glass border-2 border-border/50 shadow-medium" style={{ animationDelay: '0.1s' }}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-medium">
                <img src={moodIcon} alt="Mood tracking" className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-display font-bold text-card-foreground">Gentle Mood Tracking</h3>
              <p className="text-muted-foreground leading-relaxed">
                Quick check-ins aligned with your calendar help you understand patterns without feeling overwhelming or intrusive.
              </p>
            </Card>

            {/* Feature 3: Smart Suggestions */}
            <Card className="p-8 space-y-5 hover-lift hover-glow transition-all animate-fade-in glass border-2 border-border/50 shadow-medium" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 rounded-2xl bg-success/20 border-2 border-success/30 flex items-center justify-center shadow-medium">
                <Sparkles className="w-12 h-12 text-success" />
              </div>
              <h3 className="text-2xl font-display font-bold text-card-foreground">Micro-Interventions</h3>
              <p className="text-muted-foreground leading-relaxed">
                CBT-informed suggestions fit perfectly into your free calendar slots, making wellness practical and achievable.
              </p>
            </Card>

            {/* Feature 4: Privacy First */}
            <Card className="p-8 space-y-5 hover-lift hover-glow transition-all animate-fade-in glass border-2 border-border/50 shadow-medium" style={{ animationDelay: '0.3s' }}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-medium">
                <img src={privacyIcon} alt="Privacy" className="w-12 h-12" />
              </div>
              <h3 className="text-2xl font-display font-bold text-card-foreground">Privacy-First Design</h3>
              <p className="text-muted-foreground leading-relaxed">
                Your data is yours. Granular consent controls, encrypted storage, and optional browsing supervision with on-device processing.
              </p>
            </Card>

            {/* Feature 5: Unified Exports */}
            <Card className="p-8 space-y-5 hover-lift hover-glow transition-all animate-fade-in glass border-2 border-border/50 shadow-medium" style={{ animationDelay: '0.4s' }}>
              <div className="w-20 h-20 rounded-2xl bg-accent/20 border-2 border-accent/30 flex items-center justify-center shadow-medium">
                <BookOpen className="w-12 h-12 text-accent" />
              </div>
              <h3 className="text-2xl font-display font-bold text-card-foreground">Unified Exports</h3>
              <p className="text-muted-foreground leading-relaxed">
                Generate comprehensive PDF exports of your semester—schedule, notes, mood trends—perfect for sharing with counselors.
              </p>
            </Card>

            {/* Feature 6: Progress Tracking */}
            <Card className="p-8 space-y-5 hover-lift hover-glow transition-all animate-fade-in glass border-2 border-border/50 shadow-medium" style={{ animationDelay: '0.5s' }}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-accent flex items-center justify-center shadow-medium">
                <TrendingUp className="w-12 h-12 text-white" />
              </div>
              <h3 className="text-2xl font-display font-bold text-card-foreground">Track Your Growth</h3>
              <p className="text-muted-foreground leading-relaxed">
                Visualize your progress with mood timelines, task completion rates, and balanced scheduling insights that motivate you.
              </p>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 bg-gradient-hero relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent" />
        <div className="container mx-auto px-4 relative">
          <div className="text-center mb-20 space-y-6 animate-fade-in">
            <h2 className="text-4xl md:text-5xl font-display font-bold gradient-text">
              Simple daily routine
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              VibeCare fits seamlessly into your student life with minimal effort
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary text-white font-display font-bold text-3xl flex items-center justify-center mx-auto shadow-large hover-lift">
                1
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground">Start Your Day</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Get a morning digest with your schedule and 1-3 suggested micro-tasks tailored to your free time.
              </p>
            </div>

            <div className="text-center space-y-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary text-white font-display font-bold text-3xl flex items-center justify-center mx-auto shadow-large hover-lift">
                2
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground">Throughout the Day</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Quick mood check-ins and embedded notes in your calendar keep you organized and aware.
              </p>
            </div>

            <div className="text-center space-y-6 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <div className="w-20 h-20 rounded-2xl bg-gradient-primary text-white font-display font-bold text-3xl flex items-center justify-center mx-auto shadow-large hover-lift">
                3
              </div>
              <h3 className="text-2xl font-display font-bold text-foreground">Track Progress</h3>
              <p className="text-muted-foreground leading-relaxed text-lg">
                Review your mood timeline and see how small changes lead to meaningful improvements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero">
        <div className="container mx-auto px-4">
          <Card className="max-w-4xl mx-auto p-8 md:p-12 text-center space-y-6 bg-card/80 backdrop-blur-sm shadow-medium border-primary/20">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground">
              Ready to find your balance?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join students who are taking control of their mental wellness with calendar-first planning and gentle support.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Button 
                size="xl" 
                variant="hero"
                onClick={() => navigate('/auth')}
                className="group"
              >
                Start Your Journey
                <Heart className="ml-2 h-5 w-5 group-hover:scale-110 transition-transform" />
              </Button>
            </div>
            <p className="text-sm text-muted-foreground pt-4">
              Free to start • Privacy-first • No credit card required
            </p>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-border bg-background">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Heart className="w-6 h-6 text-primary" />
                <span className="font-bold text-xl text-foreground">VibeCare</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Your calendar-first mental wellness companion for college life.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">FAQ</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Resources</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Crisis Resources</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">Connect</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
              </ul>
            </div>
          </div>
          
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2025 VibeCare. A wellness companion, not a replacement for professional mental health care.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;

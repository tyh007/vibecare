import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Volume2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface VoiceChatProps {
  partnerName: string;
  partnerType: 'cat' | 'dog' | 'panda';
  mood?: number;
  onSpeakingChange: (isSpeaking: boolean) => void;
}

export const VoiceChat = ({ partnerName, partnerType, mood, onSpeakingChange }: VoiceChatProps) => {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // Initialize Web Speech API
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = async (event: any) => {
        const transcript = event.results[0][0].transcript;
        console.log('Recognized:', transcript);
        await handleUserSpeech(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
        toast({
          title: "Microphone Error",
          description: "Could not access microphone. Please check permissions.",
          variant: "destructive"
        });
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }

    synthRef.current = window.speechSynthesis;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  const handleUserSpeech = async (text: string) => {
    try {
      console.log('Sending message to AI:', text);
      
      const { data, error } = await supabase.functions.invoke('vibe-partner-chat', {
        body: { 
          message: text,
          partnerName,
          partnerType,
          mood
        }
      });

      if (error) throw error;

      if (data?.response) {
        console.log('AI response:', data.response);
        await speak(data.response);

        // Show professional help suggestion if needed
        if (data.suggestProfessionalHelp) {
          toast({
            title: "Professional Support Available",
            description: "Consider talking to our CBT therapist for deeper support.",
            action: (
              <Button 
                size="sm" 
                onClick={() => navigate('/cbt-therapist')}
              >
                Talk to CBT Therapist
              </Button>
            ),
            duration: 10000,
          });
        }
      }
    } catch (error: any) {
      console.error('Error getting AI response:', error);
      toast({
        title: "Chat Error",
        description: error.message || "Could not get response. Please try again.",
        variant: "destructive"
      });
    }
  };

  const speak = async (text: string) => {
    if (!synthRef.current) return;

    return new Promise<void>((resolve, reject) => {
      // Cancel any ongoing speech
      synthRef.current!.cancel();

      // Small delay to ensure cancel completes
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1.0;
        utterance.volume = 1.0;
        utterance.lang = 'en-US';

        // Load voices and try to use a natural one
        const voices = synthRef.current!.getVoices();
        if (voices.length === 0) {
          // If voices not loaded yet, wait for them
          synthRef.current!.addEventListener('voiceschanged', () => {
            const newVoices = synthRef.current!.getVoices();
            const preferredVoice = newVoices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha'))) 
              || newVoices.find(v => v.lang.startsWith('en'));
            if (preferredVoice) {
              utterance.voice = preferredVoice;
            }
          }, { once: true });
        } else {
          const preferredVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Female') || v.name.includes('Samantha'))) 
            || voices.find(v => v.lang.startsWith('en'));
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }

        utterance.onstart = () => {
          setIsSpeaking(true);
          onSpeakingChange(true);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          onSpeakingChange(false);
          resolve();
        };

        utterance.onerror = (event) => {
          console.error('Speech synthesis error:', event);
          // Don't show error to user, just silently fail
          setIsSpeaking(false);
          onSpeakingChange(false);
          reject(event);
        };

        try {
          synthRef.current!.speak(utterance);
        } catch (error) {
          console.error('Error speaking:', error);
          setIsSpeaking(false);
          onSpeakingChange(false);
          reject(error);
        }
      }, 100);
    });
  };

  const startListening = async () => {
    if (!recognitionRef.current) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in your browser. Please use Chrome or Edge.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Request microphone permission
      await navigator.mediaDevices.getUserMedia({ audio: true });
      
      setIsListening(true);
      recognitionRef.current.start();
      
      toast({
        title: "Listening...",
        description: "Speak now and I'll respond!",
      });
    } catch (error) {
      console.error('Microphone access error:', error);
      toast({
        title: "Microphone Access Denied",
        description: "Please allow microphone access to use voice chat.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const stopSpeaking = () => {
    if (synthRef.current) {
      synthRef.current.cancel();
      setIsSpeaking(false);
      onSpeakingChange(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-center gap-4">
        {!isListening && !isSpeaking ? (
          <Button
            size="lg"
            onClick={startListening}
            className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
          >
            <Mic className="w-6 h-6 mr-3" />
            Start Talking
          </Button>
        ) : isListening ? (
          <Button
            size="lg"
            variant="destructive"
            onClick={stopListening}
            className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
          >
            <MicOff className="w-6 h-6 mr-3" />
            Stop Listening
          </Button>
        ) : (
          <Button
            size="lg"
            variant="secondary"
            onClick={stopSpeaking}
            className="text-lg px-8 py-6 shadow-lg hover:shadow-xl transition-all"
          >
            <Volume2 className="w-6 h-6 mr-3" />
            Stop Speaking
          </Button>
        )}
      </div>
      
      {isListening && (
        <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Mic className="w-4 h-4 text-primary animate-pulse" />
          <span>Listening... speak now!</span>
        </div>
      )}
      
      {isSpeaking && (
        <div className="text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
          <Volume2 className="w-4 h-4 text-primary animate-pulse" />
          <span>Speaking...</span>
        </div>
      )}
    </div>
  );
};

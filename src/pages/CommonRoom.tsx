import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, AlertTriangle, Shield } from "lucide-react";
import { format } from "date-fns";

interface Message {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  flagged: boolean;
  flag_severity: string | null;
  profiles: {
    display_name: string;
  };
}

const CommonRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // Check authentication and get current user
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }
      
      setCurrentUserId(session.user.id);
      setIsCheckingAuth(false);
      
      // Load initial messages only after auth is confirmed
      loadMessages();
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        navigate('/auth');
      } else if (session) {
        setCurrentUserId(session.user.id);
      }
    });

    // Subscribe to new messages
    const channel = supabase
      .channel('community-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_messages'
        },
        () => {
          loadMessages();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const loadMessages = async () => {
    const { data, error } = await supabase
      .from('community_messages')
      .select(`
        id,
        content,
        created_at,
        user_id,
        flagged,
        flag_severity
      `)
      .order('created_at', { ascending: true })
      .limit(100);

    if (error) {
      console.error('Error loading messages:', error);
      toast({
        title: "Error loading messages",
        description: error.message,
        variant: "destructive"
      });
      return;
    }

    // Fetch display names using the security definer function
    const messagesWithProfiles = await Promise.all(
      (data || []).map(async (msg) => {
        const { data: profileData } = await supabase.rpc('get_public_profile', {
          profile_user_id: msg.user_id
        });
        return {
          ...msg,
          profiles: {
            display_name: profileData?.[0]?.display_name || 'Anonymous'
          }
        };
      })
    );

    setMessages(messagesWithProfiles as Message[]);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;

    setIsLoading(true);

    try {
      // Insert message
      const { data: insertedMessage, error: insertError } = await supabase
        .from('community_messages')
        .insert({
          content: newMessage,
          user_id: currentUserId
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Moderate the message in background
      const { data: moderation } = await supabase.functions.invoke('moderate-message', {
        body: { 
          message: newMessage,
          userId: currentUserId
        }
      });

      console.log('Moderation result:', moderation);

      // If flagged as critical, show alert to user
      if (moderation?.requiresIntervention) {
        toast({
          title: "We're here for you",
          description: "Your message indicates you may be in distress. Please consider reaching out to our professional CBT therapist or a crisis hotline.",
          variant: "destructive",
          action: (
            <Button variant="outline" size="sm" onClick={() => navigate('/cbt-therapist')}>
              Talk to Therapist
            </Button>
          ),
        });
      }

      setNewMessage("");
    } catch (error) {
      console.error('Error sending message:', error);
      toast({
        title: "Error sending message",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case 'critical': return 'border-red-500 bg-red-50 dark:bg-red-950';
      case 'high': return 'border-orange-500 bg-orange-50 dark:bg-orange-950';
      case 'medium': return 'border-yellow-500 bg-yellow-50 dark:bg-yellow-950';
      case 'low': return 'border-blue-500 bg-blue-50 dark:bg-blue-950';
      default: return '';
    }
  };

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-forest">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-forest">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/75 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate('/dashboard')}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Community Room</h1>
            </div>
            <div className="w-32" /> {/* Spacer for centering */}
          </div>
        </div>
      </header>

      {/* Safety Notice */}
      <div className="container mx-auto px-4 py-4">
        <Card className="p-4 bg-primary/10 border-primary/20">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                AI-Monitored Safe Space
              </p>
              <p className="text-xs text-muted-foreground">
                This community is monitored by AI to detect concerning content. If you're in crisis, please reach out to our CBT therapist or call a crisis hotline.
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Messages Container */}
      <div className="flex-1 container mx-auto px-4 pb-4 overflow-hidden flex flex-col">
        <Card className="flex-1 bg-card/75 backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.user_id === currentUserId ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%] ${message.user_id === currentUserId ? 'text-right' : 'text-left'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-xs text-muted-foreground">
                      {message.profiles?.display_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(message.created_at), 'HH:mm')}
                    </p>
                    {message.flagged && (
                      <AlertTriangle className="w-3 h-3 text-orange-500" />
                    )}
                  </div>
                  <div
                    className={`inline-block rounded-lg px-4 py-2 ${
                      message.user_id === currentUserId
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    } ${message.flagged ? `border-2 ${getSeverityColor(message.flag_severity)}` : ''}`}
                  >
                    <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 border-t border-border bg-card/50">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex gap-2"
            >
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Share your thoughts..."
                disabled={isLoading}
                maxLength={500}
                className="flex-1 bg-background"
              />
              <Button
                type="submit"
                disabled={!newMessage.trim() || isLoading}
                size="icon"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              Be kind and supportive. Messages are monitored for safety.
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CommonRoom;
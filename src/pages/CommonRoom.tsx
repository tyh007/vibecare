import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, AlertTriangle, Shield } from "lucide-react";
import { format } from "date-fns";

import { useAuth } from "@/auth/useAuth";
import {
  communityService,
  type VibecareCommunityMessage,
} from "@/services/community";
import { useEventSource } from "@/hooks/useEventSource";
import { ApiError } from "@/services/http";

const CommonRoom = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const currentUserId = user?.id ?? null;

  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messagesQuery = useQuery({
    queryKey: ["community", "messages"],
    queryFn: () => communityService.list({ limit: 100 }),
  });

  const messages = useMemo(
    () => (messagesQuery.data ?? []).slice().reverse(),
    [messagesQuery.data],
  );

  // Subscribe to the SSE stream; when a "message" event lands, invalidate
  // the messages query so the next render shows the new row.
  const { last: streamEvent, status: streamStatus } = useEventSource<{
    op: "create" | "update" | "delete";
    message?: VibecareCommunityMessage;
    id?: string;
  }>("/api/community/stream", Boolean(currentUserId));

  useEffect(() => {
    if (streamEvent) {
      void queryClient.invalidateQueries({ queryKey: ["community", "messages"] });
    }
  }, [streamEvent, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const content = newMessage.trim();
    if (!content) return;
    setIsLoading(true);
    try {
      const result = await communityService.send(content);
      if (result.moderation.requiresIntervention) {
        toast({
          title: "We're here for you",
          description:
            "Automated moderation marked this message as potentially concerning. Consider contacting someone you trust or a qualified crisis service.",
          variant: "destructive",
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/cbt-therapist")}
            >
              Open Reflection Tool
            </Button>
          ),
        });
      } else if (result.moderation.moderationUnavailable) {
        toast({
          title: "Posted without review",
          description:
            "Moderation is temporarily unavailable — your message went through without automated review.",
        });
      }
      setNewMessage("");
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Could not send your message.";
      toast({
        title: "Error sending message",
        description: message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getSeverityColor = (severity: string | null) => {
    switch (severity) {
      case "critical":
        return "border-red-500 bg-red-50 dark:bg-red-950";
      case "high":
        return "border-orange-500 bg-orange-50 dark:bg-orange-950";
      case "medium":
        return "border-yellow-500 bg-yellow-50 dark:bg-yellow-950";
      case "low":
        return "border-blue-500 bg-blue-50 dark:bg-blue-950";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-forest">
      <header className="sticky top-0 z-50 bg-card/75 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => navigate("/dashboard")}
              className="gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Dashboard
            </Button>
            <div className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              <h1 className="text-xl font-bold text-foreground">Community Room</h1>
              <span
                aria-hidden
                title={`stream ${streamStatus}`}
                className={`ml-2 inline-block w-2 h-2 rounded-full ${
                  streamStatus === "open"
                    ? "bg-success"
                    : streamStatus === "connecting"
                    ? "bg-yellow-400"
                    : "bg-destructive"
                }`}
              />
            </div>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4">
        <Card className="p-4 bg-primary/10 border-primary/20">
          <div className="flex gap-3">
            <AlertTriangle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                AI-Assisted Moderation
              </p>
              <p className="text-xs text-muted-foreground">
                Automated moderation can make mistakes and is not a crisis
                response service. In the U.S., call or text 988 for crisis
                support; contact local emergency services for immediate danger.
              </p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex-1 container mx-auto px-4 pb-4 overflow-hidden flex flex-col">
        <Card className="flex-1 bg-card/75 backdrop-blur-sm overflow-hidden flex flex-col">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messagesQuery.isLoading ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Loading messages…
              </p>
            ) : messages.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                Be the first to share something.
              </p>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.user_id === currentUserId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[70%] ${
                      message.user_id === currentUserId ? "text-right" : "text-left"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs text-muted-foreground">
                        {message.display_name || "Anonymous"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(message.created_at), "HH:mm")}
                      </p>
                      {message.flagged ? (
                        <AlertTriangle className="w-3 h-3 text-orange-500" />
                      ) : null}
                    </div>
                    <div
                      className={`inline-block rounded-lg px-4 py-2 ${
                        message.user_id === currentUserId
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted"
                      } ${
                        message.flagged
                          ? `border-2 ${getSeverityColor(message.flag_severity)}`
                          : ""
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="p-4 border-t border-border bg-card/50">
            <form onSubmit={handleSendMessage} className="flex gap-2">
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
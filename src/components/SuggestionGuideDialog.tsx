import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, CheckCircle } from "lucide-react";

interface SuggestionGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  guide?: string[];
  videoUrl?: string;
  onComplete?: () => void;
}

export const SuggestionGuideDialog = ({
  open,
  onOpenChange,
  title,
  description,
  guide,
  videoUrl,
  onComplete
}: SuggestionGuideDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-xl">{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {guide && guide.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-semibold text-sm text-foreground">How to do it:</h4>
              <ol className="space-y-2">
                {guide.map((step, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary text-sm font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-sm text-foreground pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          
          {videoUrl && (
            <div className="space-y-2">
              <h4 className="font-semibold text-sm text-foreground">Need visual guidance?</h4>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => window.open(videoUrl, '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Watch Video Guide
              </Button>
              <p className="text-xs text-muted-foreground text-center">
                Opens in new tab • YouTube
              </p>
            </div>
          )}
          
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Close
            </Button>
            {onComplete && (
              <Button
                onClick={() => {
                  onComplete();
                  onOpenChange(false);
                }}
                className="flex-1"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

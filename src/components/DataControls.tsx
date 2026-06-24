import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RefreshCw, Trash2 } from "lucide-react";
import { clearMockData, initializeMockData } from "@/utils/mockData";
import { useToast } from "@/hooks/use-toast";

export const DataControls = () => {
  const { toast } = useToast();

  const handleRefresh = () => {
    clearMockData();
    initializeMockData();
    window.location.reload();
  };

  const handleClear = () => {
    clearMockData();
    toast({
      title: "Data cleared",
      description: "All mock data has been removed. Refresh to regenerate.",
    });
    setTimeout(() => window.location.reload(), 1000);
  };

  return (
    <Card className="p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 glass border-2 border-border/50 shadow-medium">
      <div>
        <p className="text-base font-display font-bold text-foreground">Demo Mode</p>
        <p className="text-sm text-muted-foreground">
          Sample data is loaded for testing and exploration
        </p>
      </div>
      <div className="flex gap-3">
        <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2">
          <RefreshCw className="w-4 h-4" />
          Regenerate
        </Button>
        <Button variant="outline" size="sm" onClick={handleClear} className="gap-2">
          <Trash2 className="w-4 h-4" />
          Clear All
        </Button>
      </div>
    </Card>
  );
};

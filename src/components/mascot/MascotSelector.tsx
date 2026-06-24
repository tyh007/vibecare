import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

interface MascotSelectorProps {
  selected: 'cat' | 'dog' | 'panda';
  onSelect: (type: 'cat' | 'dog' | 'panda') => void;
}

export const MascotSelector = ({ selected, onSelect }: MascotSelectorProps) => {
  return (
    <div className="grid grid-cols-3 gap-3">
      <button
        onClick={() => onSelect('cat')}
        className={`relative transition-all ${
          selected === 'cat' ? 'scale-105' : 'hover:scale-102'
        }`}
      >
        <Card className={`p-4 text-center space-y-2 ${
          selected === 'cat' 
            ? 'bg-gradient-to-br from-primary/10 to-secondary/10 border-primary shadow-lg' 
            : 'bg-card hover:bg-muted/50'
        }`}>
          <div className="text-4xl">😺</div>
          <p className="font-semibold text-xs">Kitty</p>
          <p className="text-[10px] text-muted-foreground">Purr-sistent</p>
          {selected === 'cat' && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </Card>
      </button>

      <button
        onClick={() => onSelect('dog')}
        className={`relative transition-all ${
          selected === 'dog' ? 'scale-105' : 'hover:scale-102'
        }`}
      >
        <Card className={`p-4 text-center space-y-2 ${
          selected === 'dog' 
            ? 'bg-gradient-to-br from-primary/10 to-secondary/10 border-primary shadow-lg' 
            : 'bg-card hover:bg-muted/50'
        }`}>
          <div className="text-4xl">🐶</div>
          <p className="font-semibold text-xs">Doggo</p>
          <p className="text-[10px] text-muted-foreground">Loyal & Loving</p>
          {selected === 'dog' && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </Card>
      </button>

      <button
        onClick={() => onSelect('panda')}
        className={`relative transition-all ${
          selected === 'panda' ? 'scale-105' : 'hover:scale-102'
        }`}
      >
        <Card className={`p-4 text-center space-y-2 ${
          selected === 'panda' 
            ? 'bg-gradient-to-br from-primary/10 to-secondary/10 border-primary shadow-lg' 
            : 'bg-card hover:bg-muted/50'
        }`}>
          <div className="text-4xl">🐼</div>
          <p className="font-semibold text-xs">Panda</p>
          <p className="text-[10px] text-muted-foreground">Calm & Caring</p>
          {selected === 'panda' && (
            <div className="absolute top-2 right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
        </Card>
      </button>
    </div>
  );
};

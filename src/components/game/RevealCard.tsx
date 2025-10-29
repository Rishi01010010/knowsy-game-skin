import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { CheckCircle2, XCircle } from 'lucide-react';

interface RevealCardProps {
  position: number;
  itemName?: string;
  isCorrect?: boolean | null;
  isRevealed: boolean;
  isVIP?: boolean;
}

export const RevealCard = ({ 
  position, 
  itemName, 
  isCorrect, 
  isRevealed,
  isVIP = false 
}: RevealCardProps) => {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    if (isRevealed && !flipped) {
      // Delay the flip slightly for animation effect
      const timer = setTimeout(() => setFlipped(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isRevealed, flipped]);

  return (
    <div className="perspective-1000 w-full">
      <div
        className={cn(
          'relative w-full h-24 transition-transform duration-500 transform-style-3d',
          flipped && 'rotate-y-180'
        )}
      >
        {/* Back of card (shown initially) */}
        <div
          className={cn(
            'absolute inset-0 backface-hidden rounded-xl flex items-center justify-center',
            'bg-gradient-to-br from-primary/20 to-secondary/20 border-2 border-primary/30'
          )}
        >
          <span className="text-4xl font-bold text-muted-foreground">?</span>
        </div>

        {/* Front of card (shown after flip) */}
        <div
          className={cn(
            'absolute inset-0 backface-hidden rotate-y-180 rounded-xl p-4',
            'flex items-center justify-between gap-3',
            isCorrect === true && 'bg-green-500/20 border-2 border-green-500',
            isCorrect === false && 'bg-red-500/20 border-2 border-red-500',
            isCorrect === null && 'bg-gradient-to-br from-primary to-secondary'
          )}
        >
          <div className="flex items-center gap-3 flex-1">
            <span className="text-2xl font-bold text-white">{position}</span>
            <span className="text-lg font-semibold text-white truncate">{itemName || '???'}</span>
          </div>
          
          {isCorrect === true && (
            <CheckCircle2 className="w-6 h-6 text-green-400 flex-shrink-0" />
          )}
          {isCorrect === false && (
            <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
          )}
          {isVIP && isCorrect === null && (
            <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">VIP</span>
          )}
        </div>
      </div>
    </div>
  );
};

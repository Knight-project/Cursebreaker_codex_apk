
// src/components/shared/RankDisplay.tsx
'use client';

import React from 'react';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { RANK_NAMES_LIST } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface RankDisplayProps {
  rankName: string;
  subRank: number;
  className?: string;
  isRival?: boolean;
}

const toRoman = (num: number): string => {
  const romanMap: { [key: number]: string } = {
    1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V',
    6: 'VI', 7: 'VII', 8: 'VIII', 9: 'IX', 10: 'X',
  };
  return romanMap[num] || num.toString();
};

const RankDisplay: React.FC<RankDisplayProps> = ({ rankName, subRank, className, isRival = false }) => {
  const romanSubRank = toRoman(subRank);
  const currentRankText = `${rankName} - ${romanSubRank}`;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <span
          className={cn(
            'cursor-pointer hover:opacity-80 transition-opacity',
            isRival ? 'text-destructive' : 'text-primary',
            className
          )}
          title="Click to see all ranks"
        >
          {currentRankText}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0 bg-popover/95 backdrop-blur-sm border-border">
        <ScrollArea className="h-72">
          <div className="p-4">
            <h4 className="mb-3 text-sm font-medium leading-none text-center text-accent font-headline uppercase">
              Codex Ranks
            </h4>
            <ol className="list-decimal list-inside space-y-1.5 text-sm">
              {RANK_NAMES_LIST.map((rn, index) => (
                <li
                  key={index}
                  className={cn(
                    'py-1 px-2 rounded-sm',
                    rn === rankName
                      ? 'font-semibold bg-primary/20 text-primary'
                      : 'text-foreground/80 hover:bg-muted/50'
                  )}
                >
                  {rn} {/* Removed explicit "{index + 1}." */}
                </li>
              ))}
            </ol>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default RankDisplay;


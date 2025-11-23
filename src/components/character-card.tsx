
'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import type { Character, CharacterState } from '@/lib/types';
import { useGameState } from '@/contexts/game-state';
import { Lock, Sparkles, LoaderCircle } from 'lucide-react';
import { useState } from 'react';

type CharacterCardProps = {
  character: Character;
  characterState: CharacterState;
  onTalk: () => void;
};

export default function CharacterCard({ character, characterState, onTalk }: CharacterCardProps) {
  const { user, charm, unlockCharacter } = useGameState();
  const [isUnlocking, setIsUnlocking] = useState(false);
  
  const isCharacterLockedForUser = character.isLocked && !character.unlockedBy?.includes(user?.uid ?? '');

  const handleUnlock = async () => {
    if (!character.id) return;
    setIsUnlocking(true);
    await unlockCharacter(character.id);
    setIsUnlocking(false);
  }

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex-row gap-4 items-start p-4">
        <div className="relative w-24 h-24 flex-shrink-0">
          {character.imagePath && (
            <Image
              src={character.imagePath}
              alt={character.name}
              width={96}
              height={96}
              className={`rounded-lg object-cover ${isCharacterLockedForUser ? 'filter grayscale' : ''}`}
            />
          )}
           {isCharacterLockedForUser && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg">
              <Lock className="text-white w-8 h-8" />
            </div>
          )}
        </div>
        <div className="flex-grow">
          <CardTitle className="font-headline text-2xl">{character.name}</CardTitle>
          <CardDescription className="mt-1">{character.introduction}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 py-2">
        <div className="space-y-2">
            <Label htmlFor={`affection-${character.id}`} className="text-sm font-medium">好感度</Label>
            <Progress id={`affection-${character.id}`} value={isCharacterLockedForUser ? 0 : characterState.affection} className="w-full" />
            <p className="text-right text-sm text-muted-foreground">{isCharacterLockedForUser ? '??' : characterState.affection} / 100</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        {isCharacterLockedForUser ? (
            <Button onClick={handleUnlock} className="w-full" disabled={isUnlocking || charm < (character.unlockCost ?? 0)}>
                {isUnlocking ? (
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                    <Sparkles className="mr-2 h-4 w-4" />
                )}
                {character.unlockCost}Pで解放
            </Button>
        ) : (
            <Button onClick={onTalk} className="w-full">
              話す
            </Button>
        )}
      </CardFooter>
    </Card>
  );
}


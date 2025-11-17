'use client';

import Image from 'next/image';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';
import type { Character, CharacterState } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

type CharacterCardProps = {
  character: Character;
  characterState: CharacterState;
  onTalk: () => void;
};

export default function CharacterCard({ character, characterState, onTalk }: CharacterCardProps) {
  const placeholder = PlaceHolderImages.find(p => p.id === character.imageId);

  return (
    <Card className="flex flex-col overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1">
      <CardHeader className="flex-row gap-4 items-start p-4">
        {placeholder && (
          <div className="relative w-24 h-24 flex-shrink-0">
            <Image
              src={placeholder.imageUrl}
              alt={character.name}
              data-ai-hint={placeholder.imageHint}
              width={96}
              height={96}
              className="rounded-lg object-cover"
            />
          </div>
        )}
        <div className="flex-grow">
          <CardTitle className="font-headline text-2xl">{character.name}</CardTitle>
          <CardDescription className="mt-1">{character.introduction}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow p-4 py-2">
        <div className="space-y-2">
            <Label htmlFor={`mood-${character.name}`} className="text-sm font-medium">機嫌</Label>
            <Progress id={`mood-${character.name}`} value={characterState.mood} className="w-full" />
            <p className="text-right text-sm text-muted-foreground">{characterState.mood} / 100</p>
        </div>
      </CardContent>
      <CardFooter className="p-4 pt-0">
        <Button onClick={onTalk} className="w-full">
          話す
        </Button>
      </CardFooter>
    </Card>
  );
}

'use client';

import { useGameState } from '@/contexts/game-state';
import CharacterCard from './character-card';
import { CharacterId } from '@/lib/types';

export default function CharacterGrid() {
  const { characters, characterStates, startConversation } = useGameState();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {(Object.keys(characters) as CharacterId[]).map((id) => (
        <CharacterCard
          key={id}
          character={characters[id]}
          characterState={characterStates[id]}
          onTalk={() => startConversation(id)}
        />
      ))}
    </div>
  );
}

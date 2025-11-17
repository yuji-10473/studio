'use client';

import { useGameState } from '@/contexts/game-state';
import CharacterCard from './character-card';
import { CharacterId } from '@/lib/types';

export default function CharacterGrid() {
  const { characters, characterStates, startConversation } = useGameState();

  if (!characters || !characterStates) {
    return null; // Or a loading indicator
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {characters.map((character) => {
        if (!character.id || !characterStates[character.id]) {
          return null;
        }
        return (
          <CharacterCard
            key={character.id}
            character={character}
            characterState={characterStates[character.id]}
            onTalk={() => startConversation(character.id!)}
          />
        );
      })}
    </div>
  );
}


'use client';

import { useGameState } from '@/contexts/game-state';
import CharacterCard from './character-card';
import { CharacterId } from '@/lib/types';
import { useMemo } from 'react';

export default function CharacterGrid() {
  const { characters, characterStates, startConversation, startPersonaEdit, user } = useGameState();

  const sortedCharacters = useMemo(() => {
    if (!characters) return [];
    
    return [...characters].sort((a, b) => {
      const aIsLocked = a.isLocked && !a.unlockedBy?.includes(user?.uid ?? '');
      const bIsLocked = b.isLocked && !b.unlockedBy?.includes(user?.uid ?? '');
      
      if (aIsLocked && !bIsLocked) {
        return 1; // a (locked) comes after b (unlocked)
      }
      if (!aIsLocked && bIsLocked) {
        return -1; // a (unlocked) comes before b (locked)
      }
      return 0; // maintain original order if both are same status
    });
  }, [characters, user]);


  if (!characters || !characterStates) {
    return null; // Or a loading indicator
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
      {sortedCharacters.map((character) => {
        if (!character.id || !characterStates[character.id]) {
          return null;
        }
        return (
          <CharacterCard
            key={character.id}
            character={character}
            characterState={characterStates[character.id]}
            onTalk={() => startConversation(character.id!)}
            onEditPersona={() => startPersonaEdit(character.id!)}
          />
        );
      })}
    </div>
  );
}

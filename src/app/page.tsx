'use client';

import { GameStateProvider, useGameState } from '@/contexts/game-state';
import GameHeader from '@/components/game-header';
import CharacterGrid from '@/components/character-grid';
import ConversationModal from '@/components/conversation-modal';

function TownfolkTalesApp() {
  const { activeConversation, characters, characterStates, endConversation } = useGameState();

  const activeCharacter = activeConversation ? characters[activeConversation] : null;
  const activeCharacterState = activeConversation ? characterStates[activeConversation] : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GameHeader />
      <main className="container mx-auto p-4 md:p-8">
        <CharacterGrid />
      </main>
      {activeConversation && activeCharacter && activeCharacterState && (
        <ConversationModal
          isOpen={!!activeConversation}
          onClose={endConversation}
          character={activeCharacter}
          characterState={activeCharacterState}
          characterId={activeConversation}
        />
      )}
    </div>
  );
}

export default function Home() {
  return (
    <GameStateProvider>
      <TownfolkTalesApp />
    </GameStateProvider>
  );
}

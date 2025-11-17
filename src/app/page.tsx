'use client';

import { useState } from 'react';
import { GameStateProvider, useGameState } from '@/contexts/game-state';
import GameHeader from '@/components/game-header';
import CharacterGrid from '@/components/character-grid';
import ConversationModal from '@/components/conversation-modal';
import DebugError from '@/components/debug-error';
import CreateCharacterModal from '@/components/create-character-modal';
import { LoaderCircle } from 'lucide-react';
import Login from '@/components/login';

function TownfolkTalesApp() {
  const { 
    user,
    activeConversation, 
    characters, 
    characterStates, 
    endConversation,
    errorMessage,
    setErrorMessage,
    loading: gameStateLoading,
  } = useGameState();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const activeCharacter = activeConversation && characters && characters.find(c => c.id === activeConversation);
  const activeCharacterState = activeConversation && characterStates ? characterStates[activeConversation] : null;

  if (gameStateLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
       <div className="min-h-screen bg-background flex items-center justify-center">
        <Login />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <GameHeader onCreateCharacter={() => setCreateModalOpen(true)} />
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
      <CreateCharacterModal 
        isOpen={isCreateModalOpen}
        onClose={() => setCreateModalOpen(false)}
      />
      <DebugError message={errorMessage} onClose={() => setErrorMessage('')} />
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

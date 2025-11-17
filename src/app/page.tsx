'use client';

import { useState } from 'react';
import { GameStateProvider, useGameState } from '@/contexts/game-state';
import GameHeader from '@/components/game-header';
import CharacterGrid from '@/components/character-grid';
import ConversationModal from '@/components/conversation-modal';
import DebugError from '@/components/debug-error';
import CreateCharacterModal from '@/components/create-character-modal';
import { Button } from '@/components/ui/button';

function TownfolkTalesApp() {
  const { 
    user,
    activeConversation, 
    characters, 
    characterStates, 
    endConversation,
    errorMessage,
    setErrorMessage
  } = useGameState();
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);

  const activeCharacter = activeConversation && characters.find(c => c.id === activeConversation);
  const activeCharacterState = activeConversation ? characterStates[activeConversation] : null;

  if (!user) {
    return (
       <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center p-8">
            <h2 className="text-2xl font-bold mb-4">Townfolk Talesへようこそ</h2>
            <p className="text-muted-foreground mb-6">ログインして、AIキャラクターとの会話を始めましょう。</p>
            {/* ここに将来的にログインボタンなどを配置できます */}
        </div>
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

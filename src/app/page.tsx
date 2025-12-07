'use client';

import { useState } from 'react';
import { useGameState } from '@/contexts/game-state';
import GameHeader from '@/components/game-header';
import CharacterGrid from '@/components/character-grid';
import ConversationModal from '@/components/conversation-modal';
import DebugError from '@/components/debug-error';
import CreateCharacterModal from '@/components/create-character-modal';
import { LoaderCircle } from 'lucide-react';
import Login from '@/components/login';
import GuideCharacter from '@/components/app-guide';
import GuideConversationModal from '@/components/guide-conversation-modal';

function MotivateTalesApp() {
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
  const [isGuideModalOpen, setGuideModalOpen] = useState(false);

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
        <GuideCharacter onTalk={() => setGuideModalOpen(true)} />
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
      <GuideConversationModal 
        isOpen={isGuideModalOpen}
        onClose={() => setGuideModalOpen(false)}
      />
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
      <MotivateTalesApp />
  );
}

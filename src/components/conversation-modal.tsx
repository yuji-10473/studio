'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import Image from 'next/image';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, Bot, User, LoaderCircle, Volume2, PlayCircle } from 'lucide-react';
import PersonaEditor from './persona-editor';
import { useGameState } from '@/contexts/game-state';
import type { Character, CharacterState, CharacterId, Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase';

type ConversationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  characterState: CharacterState;
  characterId: CharacterId;
};

function ConversationHistory({ characterId, character }: { characterId: CharacterId; character: Character; }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const { setErrorMessage, activeAudio, playAudio, stopAudio } = useGameState();
  const { user } = useUser();
  const placeholder = PlaceHolderImages.find(p => p.id === character.imageId);
  
  const conversationPath = useMemo(() => user ? `users/${user.uid}/conversationHistory` : null, [user]);
  // The query is simplified to avoid needing a composite index.
  // We will filter by characterId on the client side.
  const { data: conversationHistory, loading, error } = useCollection<Message>(
    conversationPath, 
    { 
      sort: 'timestamp', 
      sortDirection: 'asc',
    }
  );

  useEffect(() => {
    if (error) {
      setErrorMessage(error.message);
    }
  }, [error, setErrorMessage]);

  // Client-side filtering
  const sortedHistory = useMemo(() => {
    if (!conversationHistory) return [];
    return conversationHistory.filter(msg => msg.characterId === characterId);
  }, [conversationHistory, characterId]);


  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [sortedHistory]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>
  }

  return (
    <ScrollArea className="flex-grow" viewportRef={viewportRef}>
        <div className="p-4 space-y-4">
        {sortedHistory.map((msg, index) => (
          <div
            key={msg.id || index}
            className={cn(
              'flex items-end gap-2 max-w-[80%]',
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <Avatar className="h-8 w-8">
              {msg.sender !== 'user' && placeholder && (
                <AvatarImage src={placeholder.imageUrl} data-ai-hint={placeholder.imageHint} />
              )}
              {msg.sender === 'user' ? 
                <AvatarFallback><User className="w-4 h-4" /></AvatarFallback> :
                <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
              }
            </Avatar>
            <div
              className={cn(
                'p-3 rounded-lg text-sm whitespace-pre-wrap relative group',
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted rounded-bl-none'
              )}
            >
              {msg.text}
              {msg.audio && msg.id && (
                 <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -top-4 -right-4 h-8 w-8 text-muted-foreground opacity-20 group-hover:opacity-100 transition-opacity"
                    onClick={() => activeAudio === msg.id ? stopAudio() : playAudio(msg.id!, msg.audio!)}
                  >
                    {activeAudio === msg.id ? <PlayCircle className="w-5 h-5 text-primary animate-pulse" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
              )}
            </div>
          </div>
        ))}
        </div>
    </ScrollArea>
  );
}


export default function ConversationModal({
  isOpen,
  onClose,
  character,
  characterState,
  characterId,
}: ConversationModalProps) {
  const { sendMessage, isAiResponding, userRole, activeAudio } = useGameState();
  const [message, setMessage] = useState('');
  
  const placeholder = PlaceHolderImages.find(p => p.id === character.imageId);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isResponding = isAiResponding || !!activeAudio;

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message.trim()) {
      sendMessage(message);
      setMessage('');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-row items-center space-y-0 gap-4">
          <Avatar className="h-12 w-12">
             {placeholder && <AvatarImage src={placeholder.imageUrl} alt={character.name} data-ai-hint={placeholder.imageHint} />}
            <AvatarFallback>{character.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <DialogTitle className="font-headline text-2xl">{character.name}と会話中</DialogTitle>
        </DialogHeader>
        
        <ConversationHistory characterId={characterId} character={character} />
        
        {isAiResponding && (
             <div className="p-4 flex items-center gap-2 border-t">
                 <Avatar className="h-8 w-8">
                    {placeholder && <AvatarImage src={placeholder.imageUrl} data-ai-hint={placeholder.imageHint} />}
                     <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
                 </Avatar>
                 <div className="p-3 rounded-lg bg-muted rounded-bl-none">
                     <LoaderCircle className="w-5 h-5 animate-spin text-muted-foreground" />
                 </div>
             </div>
        )}
        
        {userRole === 'admin' && (
          <div className="p-4 border-t">
            <PersonaEditor character={character} characterId={characterId} />
          </div>
        )}

        <DialogFooter className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`${character.name}にメッセージを送信...`}
              className="min-h-0 h-12 resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e as unknown as React.FormEvent<HTMLFormElement>);
                }
              }}
              disabled={isResponding}
            />
            <Button type="submit" size="icon" disabled={!message.trim() || isResponding}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

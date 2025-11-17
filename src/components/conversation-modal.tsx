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
import { Send, Bot, User, LoaderCircle } from 'lucide-react';
import PersonaEditor from './persona-editor';
import { useGameState } from '@/contexts/game-state';
import type { Character, CharacterState, CharacterId, Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { useCollection } from '@/firebase/firestore/use-collection';


type ConversationModalProps = {
  isOpen: boolean;
  onClose: () => void;
  character: Character;
  characterState: CharacterState;
  characterId: CharacterId;
};

function ConversationHistory({ characterId, character }: { characterId: CharacterId; character: Character; }) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { setErrorMessage } = useGameState();
  const placeholder = PlaceHolderImages.find(p => p.id === character.imageId);
  const { data: conversationHistory, loading, error } = useCollection<Message>(`characters/${characterId}/conversationHistory`, { sort: 'timestamp', sortDirection: 'asc' });

  useEffect(() => {
    if (error) {
      setErrorMessage(error.message);
    }
  }, [error, setErrorMessage]);

  const sortedHistory = useMemo(() => {
    if (!conversationHistory) return [];
    // Ensure timestamp is a Date object for correct sorting
    return [...conversationHistory].sort((a, b) => {
        const dateA = a.timestamp?.toDate() ?? new Date(0);
        const dateB = b.timestamp?.toDate() ?? new Date(0);
        return dateA.getTime() - dateB.getTime();
    });
  }, [conversationHistory]);


  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({
        top: scrollAreaRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [sortedHistory]);

  if (loading) {
    return <div className="flex justify-center items-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>
  }

  return (
    <ScrollArea className="flex-grow" ref={scrollAreaRef}>
        <div className="p-4 space-y-4">
        {sortedHistory.map((msg, index) => (
          <div
            key={index}
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
                'p-3 rounded-lg text-sm whitespace-pre-wrap',
                msg.sender === 'user'
                  ? 'bg-primary text-primary-foreground rounded-br-none'
                  : 'bg-muted rounded-bl-none'
              )}
            >
              {msg.text}
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
  const { sendMessage, isAiResponding } = useGameState();
  const [message, setMessage] = useState('');
  
  const placeholder = PlaceHolderImages.find(p => p.id === character.imageId);

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
        
        <div className="p-4 border-t">
          <PersonaEditor character={character} characterId={characterId} />
        </div>

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
              disabled={isAiResponding}
            />
            <Button type="submit" size="icon" disabled={!message.trim() || isAiResponding}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

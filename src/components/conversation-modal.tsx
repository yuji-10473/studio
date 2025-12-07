
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
import { Send, Bot, User, LoaderCircle, Heart, MessageSquarePlus } from 'lucide-react';
import PersonaEditor from './persona-editor';
import { useGameState } from '@/contexts/game-state';
import type { Character, CharacterState, CharacterId, Message } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser, useFirestore, useMemoFirebase } from '@/firebase';
import { query, where, orderBy, limit, collection } from 'firebase/firestore';


function ConversationHistory({ characterId, character }: { characterId: CharacterId; character: Character; }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const scrollHeightBeforeLoad = useRef<number>(0);
  const { setErrorMessage } = useGameState();
  const { user } = useUser();
  const firestore = useFirestore();

  const conversationCollectionRef = useMemoFirebase(() => 
    (user && firestore) ? collection(firestore, 'users', user.uid, 'conversationHistory') : null,
    [user, firestore]
  );
  
  const conversationQuery = useMemoFirebase(() => 
    conversationCollectionRef ? query(
      conversationCollectionRef,
      where('characterId', '==', characterId),
      orderBy('timestamp', 'desc'),
      limit(10)
    ) : null,
    [conversationCollectionRef, characterId]
  );
  
  const { 
    data: messages, 
    isLoading: initialLoading, 
    error,
    // Note: useCollection doesn't natively support pagination, so loadMore/hasMore are stubs.
    // A more advanced hook would be needed for infinite scroll.
  } = useCollection<Message>(conversationQuery);

  useEffect(() => {
    if (error) {
      setErrorMessage(error.message);
    }
  }, [error, setErrorMessage]);

  useEffect(() => {
    // Basic scroll to bottom for new messages
    const viewport = viewportRef.current;
    if (viewport) {
        viewport.scrollTo({ top: viewport.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);
  

  if (initialLoading && !messages) {
    return <div className="flex justify-center items-center h-full"><LoaderCircle className="w-8 h-8 animate-spin" /></div>
  }

  // Messages from useCollection are desc, reverse for display
  const displayedMessages = messages ? [...messages].reverse() : [];

  return (
    <ScrollArea className="flex-grow" viewportRef={viewportRef}>
        <div className="p-4 space-y-4">
        {/* Placeholder for future "Load More" functionality */}
        {displayedMessages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={cn(
              'flex items-end gap-2 max-w-[80%]',
              msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
            )}
          >
            <Avatar className="h-8 w-8">
              {msg.sender !== 'user' && (
                <AvatarImage src={character.imagePath} />
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
  const { sendMessage, isAiResponding, userRole, isSpeaking, affectionEvent, clearAffectionEvent } = useGameState();
  const [message, setMessage] = useState('');
  const [showHeart, setShowHeart] = useState(false);
  
  const isResponding = isAiResponding || isSpeaking;

  useEffect(() => {
    if (affectionEvent && affectionEvent.characterId === characterId) {
      setShowHeart(true);
      const timer = setTimeout(() => {
        setShowHeart(false);
        clearAffectionEvent();
      }, 1500); // Animation is 1.5s
      return () => clearTimeout(timer);
    }
  }, [affectionEvent, characterId, clearAffectionEvent]);

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
          <div className="relative">
            <Avatar className="h-12 w-12">
              <AvatarImage src={character.imagePath} alt={character.name} />
              <AvatarFallback>{character.name.slice(0, 2)}</AvatarFallback>
            </Avatar>
            {showHeart && (
              <Heart className="w-8 h-8 text-pink-500 absolute -top-4 -right-4 animate-float-heart" />
            )}
          </div>
          <DialogTitle className="font-headline text-2xl">{character.name}と会話中</DialogTitle>
        </DialogHeader>
        
        <ConversationHistory characterId={characterId} character={character} />
        
        {isAiResponding && (
             <div className="p-4 flex items-center gap-2 border-t">
                 <Avatar className="h-8 w-8">
                    <AvatarImage src={character.imagePath} />
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
              placeholder={isSpeaking ? "キャラクターが話しています..." : `${character.name}にメッセージを送信...`}
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

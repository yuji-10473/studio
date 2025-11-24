'use client';

import { useState, useRef, useEffect } from 'react';
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
import { cn } from '@/lib/utils';
import { guideCharacterData } from './app-guide';
import { getGuideResponse } from '@/actions/chat';

type GuideConversationModalProps = {
  isOpen: boolean;
  onClose: () => void;
};

type TempMessage = {
  role: 'user' | 'model';
  content: string;
};

export default function GuideConversationModal({
  isOpen,
  onClose,
}: GuideConversationModalProps) {
  const [history, setHistory] = useState<TempMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [error, setError] = useState('');
  const viewportRef = useRef<HTMLDivElement>(null);

  const character = guideCharacterData;

  useEffect(() => {
    if (isOpen) {
      setHistory([
          { role: 'model', content: `こんにちは！ 私は案内役の${character.name}です。ゲームのことで分からないことがあれば、何でも聞いてくださいね。` }
      ]);
      setMessage('');
      setError('');
    }
  }, [isOpen, character.name]);

  useEffect(() => {
    if (viewportRef.current) {
        viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [history]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!message.trim() || isAiResponding) return;

    const newUserMessage: TempMessage = { role: 'user', content: message };
    const newHistory = [...history, newUserMessage];
    setHistory(newHistory);
    setMessage('');
    setIsAiResponding(true);
    setError('');

    const result = await getGuideResponse(
      message,
      newHistory.slice(-10) // Send last 10 messages for context
    );
    
    setIsAiResponding(false);

    if (result.success) {
      setHistory(prev => [...prev, { role: 'model', content: result.message }]);
    } else {
      setError(result.message);
      // Optional: remove the user's message if the AI fails
      setHistory(prev => prev.slice(0, -1));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="max-w-xl h-[80vh] flex flex-col p-0 gap-0">
        <DialogHeader className="p-4 border-b flex-row items-center space-y-0 gap-4">
          <Avatar className="h-12 w-12">
             <AvatarImage src={character.imagePath} alt={character.name} />
            <AvatarFallback>{character.name.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <DialogTitle className="font-headline text-2xl">{character.name}と会話中</DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="flex-grow" viewportRef={viewportRef}>
            <div className="p-4 space-y-4">
            {history.map((msg, index) => (
              <div
                key={index}
                className={cn(
                  'flex items-end gap-2 max-w-[80%]',
                  msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                )}
              >
                <Avatar className="h-8 w-8">
                  {msg.role === 'model' && (
                    <AvatarImage src={character.imagePath} />
                  )}
                  {msg.role === 'user' ? 
                    <AvatarFallback><User className="w-4 h-4" /></AvatarFallback> :
                    <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
                  }
                </Avatar>
                <div
                  className={cn(
                    'p-3 rounded-lg text-sm whitespace-pre-wrap relative group',
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-none'
                      : 'bg-muted rounded-bl-none'
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}
             {isAiResponding && (
                <div className="p-4 flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                        <AvatarImage src={character.imagePath} />
                        <AvatarFallback><Bot className="w-4 h-4" /></AvatarFallback>
                    </Avatar>
                    <div className="p-3 rounded-lg bg-muted rounded-bl-none">
                        <LoaderCircle className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                </div>
            )}
             {error && (
                <div className="text-destructive text-sm p-4 bg-destructive/10 rounded-md">
                    <p className="font-bold">エラー</p>
                    <p className="whitespace-pre-wrap">{error}</p>
                </div>
             )}
            </div>
        </ScrollArea>
        
        <DialogFooter className="p-4 border-t">
          <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={`${character.name}に質問する...`}
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

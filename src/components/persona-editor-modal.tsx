
'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import PersonaEditor from './persona-editor';
import { useGameState } from '@/contexts/game-state';
import { Button } from './ui/button';

export default function PersonaEditorModal() {
  const { editingPersonaCharacterId, characters, endPersonaEdit } = useGameState();

  const isOpen = !!editingPersonaCharacterId;
  const character = characters?.find(c => c.id === editingPersonaCharacterId);

  const handleClose = () => {
    endPersonaEdit();
  };
  
  if (!character || !character.id) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{character.name} のペルソナを編集</DialogTitle>
          <DialogDescription>
            このキャラクターのAIとしての役割、性格、口調などを設定します。
          </DialogDescription>
        </DialogHeader>
        
        <PersonaEditor 
          character={character} 
          characterId={character.id} 
          onSave={handleClose} 
        />
        
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              閉じる
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useGameState } from '@/contexts/game-state';
import type { Character, CharacterId } from '@/lib/types';
import { Bot } from 'lucide-react';

type PersonaEditorProps = {
  character: Character;
  characterId: CharacterId;
};

export default function PersonaEditor({ character, characterId }: PersonaEditorProps) {
  const { updateCharacterPersona } = useGameState();
  const [description, setDescription] = useState(character.description);

  const handleSave = () => {
    updateCharacterPersona(characterId, description);
  };

  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex items-center gap-2 text-sm">
            <Bot className="h-4 w-4" />
            <span>ペルソナを編集</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="persona-description">AIペルソナ (役割設定)</Label>
              <Textarea
                id="persona-description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={6}
                className="text-xs"
              />
              <p className="text-xs text-muted-foreground">
                この内容に基づいてAIがキャラクターとして応答します。
              </p>
            </div>
            <Button onClick={handleSave} size="sm">
              ペルソナを保存
            </Button>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}

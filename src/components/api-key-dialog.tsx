'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useGameState } from '@/contexts/game-state';

export default function ApiKeyDialog() {
  const { apiKey, setApiKey, isApiKeyDialogOpen, closeApiKeyDialog } = useGameState();
  const [key, setKey] = useState(apiKey || '');

  const handleSave = () => {
    setApiKey(key);
  };

  return (
    <Dialog open={isApiKeyDialogOpen} onOpenChange={closeApiKeyDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Gemini APIキーを設定</DialogTitle>
          <DialogDescription>
            AIとの会話にはGoogle Gemini APIキーが必要です。キーはブラウザのローカルストレージに保存されます。
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="api-key">API Key</Label>
          <Input
            id="api-key"
            type="password"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="ここにAPIキーを貼り付けます"
          />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">キャンセル</Button>
          </DialogClose>
          <Button onClick={handleSave}>保存</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

'use client';

import { X } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

type DebugErrorProps = {
  message: string;
  onClose: () => void;
};

export default function DebugError({ message, onClose }: DebugErrorProps) {
  if (!message) return null;

  return (
    <Card className="fixed bottom-4 right-4 w-full max-w-md z-50 bg-destructive text-destructive-foreground">
      <CardHeader className="flex-row items-center justify-between p-4">
        <CardTitle className="text-lg">エラーが発生しました</CardTitle>
        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive-foreground hover:bg-destructive/80 hover:text-destructive-foreground" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <pre className="whitespace-pre-wrap text-sm font-mono bg-destructive/50 p-2 rounded-md">
          {message}
        </pre>
      </CardContent>
    </Card>
  );
}

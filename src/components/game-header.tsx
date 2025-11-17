'use client';

import * as React from 'react';
import { useGameState } from '@/contexts/game-state';
import { Button } from '@/components/ui/button';
import { Heart, CalendarDays, Bed, KeyRound, LoaderCircle, Database, LogOut, UserPlus, Cog, Sparkles } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { checkApiKey } from '@/actions/debug';
import { testFirestoreWrite } from '@/actions/firestore-debug';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/firebase';
import { signOut } from 'firebase/auth';
import { generateAndCreateCharacter } from '@/actions/character';

type GameHeaderProps = {
  onCreateCharacter: () => void;
};

export default function GameHeader({ onCreateCharacter }: GameHeaderProps) {
  const { user, userRole, tok, gameDate, stayAtInn, setErrorMessage } = useGameState();
  const auth = useAuth();
  const [isTestingKey, setIsTestingKey] = React.useState(false);
  const [isTestingFirestore, setIsTestingFirestore] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const { toast } = useToast();

  const handleTestKey = async () => {
    setIsTestingKey(true);
    setErrorMessage(''); // Clear previous errors
    const result = await checkApiKey();
    if (result.success) {
      toast({
        title: "成功",
        description: result.message,
      });
    } else {
      setErrorMessage(result.message);
    }
    setIsTestingKey(false);
  };
  
  const handleTestFirestoreWrite = async () => {
    setIsTestingFirestore(true);
    setErrorMessage(''); // Clear previous errors
    const result = await testFirestoreWrite();
    if (result.success) {
      toast({
        title: "成功",
        description: result.message,
      });
    } else {
      setErrorMessage(result.message);
    }
    setIsTestingFirestore(false);
  };

  const handleGenerateCharacter = async () => {
    setIsGenerating(true);
    setErrorMessage('');
    const result = await generateAndCreateCharacter("ファンタジー世界の住人");
    if (result.success) {
      toast({
        title: "成功",
        description: result.message,
      });
    } else {
      setErrorMessage(result.message);
    }
    setIsGenerating(false);
  }

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: 'ログアウトしました。' });
  };

  const isAdmin = userRole === 'admin';

  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
           <h1 className="text-xl md:text-2xl font-headline font-bold text-foreground">
            Townfolk Tales
          </h1>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2" title="徳ポイント">
            <Heart className="text-primary" />
            <span className="font-bold text-lg">{tok}</span>
          </div>
          <div className="flex items-center gap-2" title="現在の日付">
            <CalendarDays className="text-primary" />
            <span className="font-bold text-lg">{gameDate}日目</span>
          </div>
          <div className="flex items-center gap-2">
            
            {isAdmin && (
              <>
                <Button variant="outline" size="sm" onClick={onCreateCharacter}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  キャラクター作成
                </Button>
                <Button variant="outline" size="sm" onClick={handleGenerateCharacter} disabled={isGenerating}>
                  {isGenerating ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                  Geminiに作成させる
                </Button>
              </>
            )}
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Bed className="mr-2 h-4 w-4" />
                  宿に泊まる
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>宿に泊まりますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    一日を終え、新しい日を始めます。すべてのキャラクターの機嫌と会話の履歴がリセットされます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={stayAtInn}>泊まる</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            {user && (
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                ログアウト
              </Button>
            )}

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Cog className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>デバッグツール</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleTestKey} disabled={isTestingKey}>
                    {isTestingKey ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <KeyRound className="mr-2 h-4 w-4" />
                    )}
                    <span>APIキーをテスト</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleTestFirestoreWrite} disabled={isTestingFirestore}>
                    {isTestingFirestore ? (
                      <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Database className="mr-2 h-4 w-4" />
                    )}
                    <span>Firestore書き込みテスト</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}

          </div>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useAuth } from '@/firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Chrome } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

export default function Login() {
  const auth = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: 'ログインしました。',
      });
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      toast({
        variant: 'destructive',
        title: 'ログインエラー',
        description: `Googleでのログインに失敗しました。\n${errorMessage}`,
      });
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Townfolk Talesへようこそ</CardTitle>
        <CardDescription>
          Googleアカウントでログインして、<br />AIキャラクターとの会話を始めましょう。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={handleGoogleSignIn} className="w-full">
          <Chrome className="mr-2 h-4 w-4" />
          Googleでログイン
        </Button>
      </CardContent>
    </Card>
  );
}

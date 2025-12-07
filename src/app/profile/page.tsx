
'use client';

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Link from 'next/link';
import { useGameState } from '@/contexts/game-state';
import { useFirestore, useUser } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { LoaderCircle } from 'lucide-react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const profileSchema = z.object({
  displayName: z.string().min(1, '表示名は必須です。').max(50, '表示名は50文字以内で入力してください。'),
  bio: z.string().max(200, '自己紹介は200文字以内で入力してください。').optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfilePage() {
  const { user } = useUser();
  const { userProfile, loading, setErrorMessage } = useGameState();
  const firestore = useFirestore();
  const { toast } = useToast();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      displayName: '',
      bio: '',
    },
  });

  useEffect(() => {
    if (userProfile) {
      form.reset({
        displayName: userProfile.displayName,
        bio: userProfile.bio || '',
      });
    }
  }, [userProfile, form]);

  const onSubmit = async (data: ProfileFormValues) => {
    if (!user || !firestore) {
      setErrorMessage('ユーザー情報またはデータベースが見つかりません。');
      return;
    }

    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userDocRef, {
        displayName: data.displayName,
        bio: data.bio,
      });
      toast({
        title: '成功',
        description: 'プロフィールを更新しました。',
      });
    } catch (error) {
      const permissionError = new FirestorePermissionError({
          path: userDocRef.path,
          operation: 'update',
          requestResourceData: data,
      }, error);
      errorEmitter.emit('permission-error', permissionError);
      
      const message = error instanceof Error ? error.message : '不明なエラー';
      setErrorMessage(`プロフィールの更新に失敗しました: ${message}`);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoaderCircle className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!user) {
     return (
       <div className="min-h-screen bg-background flex items-center justify-center">
        <p>このページを表示するにはログインが必要です。</p>
        <Button asChild className="ml-4">
            <Link href="/">ホームに戻る</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardHeader>
              <CardTitle className="text-2xl font-headline">プロフィール編集</CardTitle>
              <CardDescription>
                AIキャラクターとの会話に利用されるあなたの情報を編集できます。
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="displayName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>表示名</FormLabel>
                    <FormControl>
                      <Input placeholder="あなたの名前" {...field} />
                    </FormControl>
                     <FormDescription>
                      ゲーム内で使用されるあなたの名前です。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>自己紹介</FormLabel>
                    <FormControl>
                      <Textarea placeholder="趣味や好きなことなど、AIにあなたを教えてあげましょう。" {...field} rows={4} />
                    </FormControl>
                    <FormDescription>
                      この情報はAIキャラクターがあなたとの会話をパーソナライズするために使用されます。
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" asChild>
                <Link href="/">ゲームに戻る</Link>
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                )}
                保存
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}

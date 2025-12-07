'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/firebase';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  AuthError,
} from 'firebase/auth';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';
import { Chrome, LoaderCircle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from './ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form';
import { Input } from './ui/input';

const formSchema = z.object({
  email: z.string().email({ message: '有効なメールアドレスを入力してください。' }),
  password: z
    .string()
    .min(6, { message: 'パスワードは6文字以上で入力してください。' }),
});

type FormValues = z.infer<typeof formSchema>;

export default function Login() {
  const auth = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState<'google' | 'email' | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });
  
  const handleAuthError = (error: any) => {
    console.error('Firebase Auth Error:', error);
    let message = 'エラーが発生しました。もう一度お試しください。';
    if (error instanceof Error && 'code' in error) {
      const authError = error as AuthError;
      switch (authError.code) {
        case 'auth/user-not-found':
        case 'auth/wrong-password':
          message = 'メールアドレスまたはパスワードが正しくありません。';
          break;
        case 'auth/email-already-in-use':
          message = 'このメールアドレスは既に使用されています。';
          break;
        case 'auth/invalid-email':
          message = '無効なメールアドレスです。';
          break;
        case 'auth/weak-password':
          message = 'パスワードは6文字以上で設定してください。';
          break;
        default:
          message = `認証エラーが発生しました: ${authError.message}`;
      }
    }
    setAuthError(message);
  }

  const handleGoogleSignIn = async () => {
    if (!auth) return;
    setLoading('google');
    setAuthError(null);
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
      toast({
        title: 'ログインしました。',
      });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(null);
    }
  };

  const handleEmailSignIn = async (data: FormValues) => {
    if (!auth) return;
    setLoading('email');
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'ログインしました。',
      });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(null);
    }
  };
  
  const handleEmailSignUp = async (data: FormValues) => {
    if (!auth) return;
    setLoading('email');
    setAuthError(null);
    try {
      await createUserWithEmailAndPassword(auth, data.email, data.password);
      toast({
        title: 'アカウント登録が完了しました。',
        description: '自動的にログインします。',
      });
    } catch (error) {
      handleAuthError(error);
    } finally {
      setLoading(null);
    }
  };

  const isEmailLoading = loading === 'email';
  const isGoogleLoading = loading === 'google';

  return (
    <Card className="w-full max-w-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Motivate Talesへようこそ</CardTitle>
        <CardDescription>
          アカウントにログインまたは新規登録して、
          <br />
          AIキャラクターとの会話を始めましょう。
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">ログイン</TabsTrigger>
            <TabsTrigger value="signup">新規登録</TabsTrigger>
          </TabsList>
          
          <div className="py-4">
            {authError && (
              <p className="text-sm text-center font-medium text-destructive bg-destructive/10 p-2 rounded-md">
                {authError}
              </p>
            )}
          </div>
          
          <TabsContent value="login">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailSignIn)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} disabled={isEmailLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>パスワード</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isEmailLoading}/>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isEmailLoading}>
                  {isEmailLoading && <LoaderCircle className="animate-spin" />}
                  <span>メールアドレスでログイン</span>
                </Button>
              </form>
            </Form>
          </TabsContent>
          
          <TabsContent value="signup">
             <Form {...form}>
              <form onSubmit={form.handleSubmit(handleEmailSignUp)} className="space-y-4">
                 <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>メールアドレス</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="email@example.com" {...field} disabled={isEmailLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>パスワード（6文字以上）</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} disabled={isEmailLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isEmailLoading}>
                  {isEmailLoading && <LoaderCircle className="animate-spin" />}
                  <span>メールアドレスで登録</span>
                </Button>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
        
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-background px-2 text-muted-foreground">または</span>
          </div>
        </div>

        <Button onClick={handleGoogleSignIn} variant="outline" className="w-full" disabled={isGoogleLoading}>
            {isGoogleLoading ? <LoaderCircle className="animate-spin" /> : <Chrome />}
            <span>Googleでログイン</span>
        </Button>
      </CardContent>
    </Card>
  );
}

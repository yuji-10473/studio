
'use client';

import * as React from 'react';
import Link from 'next/link';
import { useGameState } from '@/contexts/game-state';
import { Button } from '@/components/ui/button';
import { Heart, CalendarDays, Bed, KeyRound, LoaderCircle, Database, LogOut, UserPlus, Cog, Sparkles, Volume2, User as UserIcon, Music, TestTube2, Cloud, MessageCircle, Bot, FlaskConical, Wifi, Fingerprint } from 'lucide-react';
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
import { Switch } from './ui/switch';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { runFirebaseAuthE2eTest, testCloudLogging, runChatE2eTest, runGuideChatE2eTest, runComprehensiveE2eTest, runRemoteApiTest } from '@/actions/e2e-debug';
import { Input } from './ui/input';

type GameHeaderProps = {
  onCreateCharacter: () => void;
};

const characterThemes = [
  "ゲーム開発会社で働く、燃え尽き気味のプログラマー",
  "ゲーム開発会社で働く、締め切りに追われるデザイナー",
  "ゲーム開発会社で働く、板挟みに悩むプロモーター",
  "ゲーム開発会社で働く、QAチームのリーダー",
  "ゲーム開発会社で働く、新人プランナー",
  "ゲーム開発会社で働く、経験豊富なサウンドクリエイター",
  "ゲーム開発会社で働く、ユーザーサポート担当者"
];

export default function GameHeader({ onCreateCharacter }: GameHeaderProps) {
  const { 
    user,
    userRole, 
    productionPoints, 
    gameDate, 
    stayAtInn, 
    setErrorMessage, 
    enableTTS, 
    setEnableTTS,
    bgmVolume,
    setBgmVolume,
    generateAndCreateCharacter,
  } = useGameState();
  const auth = useAuth();
  const [isTestingKey, setIsTestingKey] = React.useState(false);
  const [isTestingFirestore, setIsTestingFirestore] = React.useState(false);
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [isTestingAuth, setIsTestingAuth] = React.useState(false);
  const [isTestingChat, setIsTestingChat] = React.useState(false);
  const [isTestingLogging, setIsTestingLogging] = React.useState(false);
  const [isTestingGuideChat, setIsTestingGuideChat] = React.useState(false);
  const [isTestingComprehensive, setIsTestingComprehensive] = React.useState(false);
  const [isTestingRemoteApi, setIsTestingRemoteApi] = React.useState(false);
  const [remoteApiUrl, setRemoteApiUrl] = React.useState('https://studio-3901474762-72cde.web.app/');
  const [actionId, setActionId] = React.useState('783d6750f15bac1ba5a8d298cf2cf868857faefce8');

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
    // Select a random theme from the list
    const randomTheme = characterThemes[Math.floor(Math.random() * characterThemes.length)];
    // Call the client-side function from the context
    await generateAndCreateCharacter(randomTheme);
    setIsGenerating(false);
  }

  const handleAuthE2ETest = async () => {
    setIsTestingAuth(true);
    setErrorMessage('');
    const result = await runFirebaseAuthE2eTest('user@example.com', 'password123');
    setErrorMessage(JSON.stringify(result, null, 2));
    if (result.success) {
        toast({
            title: "E2E認証テスト成功",
            description: result.message,
        });
    }
    setIsTestingAuth(false);
  };

  const handleChatE2ETest = async () => {
    setIsTestingChat(true);
    setErrorMessage('');
    const result = await runChatE2eTest();
    setErrorMessage(JSON.stringify(result, null, 2));
    if (result.success) {
        toast({
            title: "E2E応答テスト成功",
            description: result.message,
        });
    }
    setIsTestingChat(false);
  };

  const handleGuideChatE2ETest = async () => {
    setIsTestingGuideChat(true);
    setErrorMessage('');
    const result = await runGuideChatE2eTest();
    setErrorMessage(JSON.stringify(result, null, 2));
    if (result.success) {
        toast({
            title: "E2E案内役応答テスト成功",
            description: result.message,
        });
    }
    setIsTestingGuideChat(false);
  };

  const handleTestLogging = async () => {
    setIsTestingLogging(true);
    setErrorMessage('');
    const result = await testCloudLogging();
    if (result.success) {
      toast({
        title: "Cloud Logging テスト",
        description: result.message,
      });
    } else {
      setErrorMessage(result.message);
    }
    setIsTestingLogging(false);
  };

  const handleComprehensiveTest = async () => {
    setIsTestingComprehensive(true);
    setErrorMessage('');
    const result = await runComprehensiveE2eTest();
    setErrorMessage(JSON.stringify(result, null, 2));
    if (result.success) {
      toast({
        title: '総合E2Eテスト成功',
        description: result.message,
      });
    } else {
      toast({
        title: '総合E2Eテスト失敗',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsTestingComprehensive(false);
  };

  const handleRemoteApiTest = async (testType: 'auth' | 'chat') => {
    if (!remoteApiUrl) {
      setErrorMessage('外部APIテストのURLが入力されていません。');
      return;
    }
    setIsTestingRemoteApi(true);
    setErrorMessage('');
    const result = await runRemoteApiTest(remoteApiUrl, testType, actionId);
    setErrorMessage(JSON.stringify(result, null, 2));
     if (result.success) {
      toast({
        title: '外部APIテスト成功',
        description: result.message,
      });
    } else {
      toast({
        title: '外部APIテスト失敗',
        description: result.message,
        variant: 'destructive',
      });
    }
    setIsTestingRemoteApi(false);
  }

  const handleLogout = async () => {
    if (!auth) return;
    await signOut(auth);
    toast({ title: 'ログアウトしました。' });
  };
  
  const handleTtsToggle = (checked: boolean) => {
    setEnableTTS(checked);
    toast({
      title: `音声読み上げを${checked ? 'ON' : 'OFF'}にしました。`,
    });
  }

  const handleVolumeChange = (value: number[]) => {
    setBgmVolume(value[0]);
  }
  
  const handleCheckUid = () => {
    if (user?.uid) {
      toast({
        title: "UIDチェック",
        description: `現在のユーザーUIDは次のとおりです: ${user.uid}`,
      });
    } else {
      toast({
        variant: "destructive",
        title: "UIDチェック",
        description: "ユーザーUIDが取得できません。ログインしていない可能性があります。",
      });
    }
  };

  const isAdmin = userRole === 'admin';

  return (
    <header className="bg-card border-b sticky top-0 z-10">
      <div className="container mx-auto flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
           <h1 className="text-xl md:text-2xl font-headline font-bold text-foreground">
            Motivate Tales
          </h1>
        </div>
        <div className="flex items-center gap-4 md:gap-6">
          <div className="flex items-center gap-2" title="生産ポイント">
            <Sparkles className="text-primary" />
            <span className="font-bold text-lg">{productionPoints}</span>
          </div>
          <div className="flex items-center gap-2" title="現在の期">
            <CalendarDays className="text-primary" />
            <span className="font-bold text-lg">{gameDate}期目</span>
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
                  次の期へ
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card">
                <AlertDialogHeader>
                  <AlertDialogTitle>次の期に進みますか？</AlertDialogTitle>
                  <AlertDialogDescription>
                    すべてのキャラクターの元気はリセットされますが、会話の履歴は保持されます。
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>キャンセル</AlertDialogCancel>
                  <AlertDialogAction onClick={stayAtInn}>進む</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Cog className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>設定</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/profile">
                    <UserIcon className="mr-2 h-4 w-4" />
                    <span>プロフィール編集</span>
                  </Link>
                </DropdownMenuItem>
                
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex flex-col items-start gap-2">
                   <div className="flex items-center justify-between w-full">
                      <Label htmlFor="tts-toggle" className="flex items-center gap-2 cursor-pointer">
                        <Volume2 className="h-4 w-4" />
                        <span>音声読み上げ</span>
                      </Label>
                      <Switch
                        id="tts-toggle"
                        checked={enableTTS}
                        onCheckedChange={handleTtsToggle}
                      />
                    </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="flex flex-col items-start gap-3">
                   <Label htmlFor="volume-slider" className="flex items-center gap-2 cursor-pointer">
                      <Music className="h-4 w-4" />
                      <span>BGM音量</span>
                    </Label>
                   <Slider
                    id="volume-slider"
                    defaultValue={[bgmVolume]}
                    max={1}
                    step={0.1}
                    onValueChange={handleVolumeChange}
                  />
                </DropdownMenuItem>

                {isAdmin && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>ローカルE2Eテスト</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleComprehensiveTest} disabled={isTestingComprehensive}>
                      {isTestingComprehensive ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <FlaskConical className="mr-2 h-4 w-4" />
                      )}
                      <span>総合E2Eテストを実行</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>外部APIテスト</DropdownMenuLabel>
                     <div className="px-2 py-1.5 text-sm outline-none" onSelect={(e) => e.preventDefault()}>
                       <Label htmlFor="remote-api-url" className="flex items-center gap-2 cursor-pointer text-xs mb-1">
                          テスト対象URL
                        </Label>
                       <Input 
                         id="remote-api-url"
                         value={remoteApiUrl}
                         onChange={(e) => setRemoteApiUrl(e.target.value)}
                         placeholder="https://your-app-url.com"
                         className="h-8 mb-2"
                       />
                       <Label htmlFor="action-id" className="flex items-center gap-2 cursor-pointer text-xs mb-1">
                          サーバーアクションID (Chat用)
                        </Label>
                       <Input 
                         id="action-id"
                         value={actionId}
                         onChange={(e) => setActionId(e.target.value)}
                         placeholder="ローカルテストログからコピー"
                         className="h-8 mb-2"
                       />
                       <div className='flex gap-2 w-full mt-2'>
                          <Button variant="outline" size="sm" className='w-full' onClick={() => handleRemoteApiTest('auth')} disabled={isTestingRemoteApi}>
                            {isTestingRemoteApi ? <LoaderCircle className='animate-spin mr-2 h-4 w-4' /> : <Wifi className="mr-2 h-4 w-4" />}
                            認証テスト
                          </Button>
                           <Button variant="outline" size="sm" className='w-full' onClick={() => handleRemoteApiTest('chat')} disabled={isTestingRemoteApi || !actionId}>
                            {isTestingRemoteApi ? <LoaderCircle className='animate-spin mr-2 h-4 w-4' /> : <MessageCircle className="mr-2 h-4 w-4" />}
                            応答テスト
                          </Button>
                       </div>
                    </div>

                    <DropdownMenuSeparator />
                    <DropdownMenuLabel>個別デバッグツール</DropdownMenuLabel>
                    <DropdownMenuItem onClick={handleCheckUid}>
                      <Fingerprint className="mr-2 h-4 w-4" />
                      <span>UIDをチェック</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleTestLogging} disabled={isTestingLogging}>
                      {isTestingLogging ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Cloud className="mr-2 h-4 w-4" />
                      )}
                      <span>Cloud Loggingテスト</span>
                    </DropdownMenuItem>
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
                    <DropdownMenuItem onClick={handleAuthE2ETest} disabled={isTestingAuth}>
                      {isTestingAuth ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <TestTube2 className="mr-2 h-4 w-4" />
                      )}
                      <span>(ローカル)認証テスト</span>
                    </DropdownMenuItem>
                     <DropdownMenuItem onClick={handleChatE2ETest} disabled={isTestingChat}>
                      {isTestingChat ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <MessageCircle className="mr-2 h-4 w-4" />
                      )}
                      <span>(ローカル)AI応答テスト</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleGuideChatE2ETest} disabled={isTestingGuideChat}>
                      {isTestingGuideChat ? (
                        <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Bot className="mr-2 h-4 w-4" />
                      )}
                      <span>(ローカル)案内役応答テスト</span>
                    </DropdownMenuItem>
                  </>
                )}
                 <DropdownMenuSeparator />
                 <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>ログアウト</span>
                </DropdownMenuItem>

              </DropdownMenuContent>
            </DropdownMenu>

          </div>
        </div>
      </div>
    </header>
  );
}

    
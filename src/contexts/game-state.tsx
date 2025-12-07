
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { Character, CharacterId, GameContextType, GameState, Message, CharacterState, UserProfile } from '@/lib/types';
import { getAiResponse } from '@/actions/chat';
import { generateCharacter } from '@/actions/character';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, Timestamp, doc, setDoc, getDoc, writeBatch, where, updateDoc, arrayUnion } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { toggleCharacterLock as toggleCharacterLockAction } from '@/actions/character';
import { useMemoFirebase } from '@/firebase/provider';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const CHARM_THRESHOLD = 80;
const CHARM_AWARD = 10;
const AFFECTION_MULTIPLIER = 10; // Score (-1.0 to 1.0) will be multiplied by this

const createInitialState = (characters: Character[] | null, userStates: CharacterState[] | null): GameState => {
  const characterStates = characters && userStates ? userStates.reduce((acc, state) => {
    if (state.id) {
        acc[state.id] = state;
    }
    return acc;
  }, {} as Record<CharacterId, CharacterState>) : null;

  // Fill in any missing character states
  if (characters && characterStates) {
    for (const char of characters) {
        if (char.id && !characterStates[char.id]) {
            characterStates[char.id] = { affection: 50, charmAwarded: false };
        }
    }
  }


  return {
    characters,
    characterStates,
    charm: 0,
    gameDate: 1,
    activeConversation: null,
    editingPersonaCharacterId: null,
    isAiResponding: false,
    errorMessage: '',
    user: null, // Will be populated by useUser
    userProfile: null,
    loading: true,
    userRole: 'user', // Will be populated by useUser
    isSpeaking: false,
    enableTTS: false, // Default TTS to off
    bgmVolume: 0.25, // Default BGM Volume
    affectionEvent: null,
    conversationUpdateTrigger: 0,
  };
};

const GameStateContext = createContext<GameContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const { user, role: userRole, loading: userLoading } = useUser();
  const firestore = useFirestore();
  
  const charactersCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    // No longer wait for userLoading, allow anonymous reads.
    return collection(firestore, 'characters');
  }, [firestore]);


  const { data: charactersFromDb, loading: charactersLoading } = useCollection<Character>(charactersCollection);
  
  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const userProfileDocRef = useMemoFirebase(() => (firestore && userProfilePath ? doc(firestore, userProfilePath) : null), [firestore, userProfilePath]);
  const { data: userProfile, loading: userProfileLoading } = useDoc<UserProfile>(userProfileDocRef);
  
  const characterStatesPath = useMemo(() => (user ? `users/${user.uid}/characterStates` : null), [user]);
  const characterStatesCollectionRef = useMemoFirebase(() => (firestore && characterStatesPath ? collection(firestore, characterStatesPath) : null), [firestore, characterStatesPath]);
  const { data: characterStatesFromDb, loading: characterStatesLoading } = useCollection<CharacterState>(characterStatesCollectionRef);

  const [state, setState] = useState<GameState>(createInitialState(null, null));
  const { toast } = useToast();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechPingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const bgmAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Effect for creating user profile on first login
  useEffect(() => {
    if (user && !userLoading && !userProfile && !userProfileLoading && firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (!docSnap.exists()) {
                const newUserProfile: UserProfile = {
                    email: user.email || '',
                    displayName: user.displayName || user.email?.split('@')[0] || 'New User',
                    bio: '',
                    charm: 0,
                    gameDate: 1,
                    enableTTS: false,
                    bgmVolume: 0.25,
                };
                setDoc(userDocRef, newUserProfile).catch(error => {
                    const permissionError = new FirestorePermissionError({
                        path: userDocRef.path,
                        operation: 'create',
                        requestResourceData: newUserProfile,
                    }, error);
                    errorEmitter.emit('permission-error', permissionError);
                });
            }
        });
    }
  }, [user, userLoading, userProfile, userProfileLoading, firestore]);

  // Main effect to synchronize state from Firestore
  useEffect(() => {
    const loading = userLoading || charactersLoading || (user && (userProfileLoading || characterStatesLoading));
    
    if (loading) {
      setState(prev => ({...prev, loading: true}));
      return;
    }

    setState(prevState => {
        const characters = charactersFromDb || [];
        const userStates = characterStatesFromDb || [];

        const characterStates = characters.reduce((acc, char) => {
            if (char.id) {
                const existingState = userStates.find(s => s.id === char.id);
                acc[char.id] = existingState || { id: char.id, affection: 50, charmAwarded: false };
            }
            return acc;
        }, {} as Record<CharacterId, CharacterState>);
        
        if (user && firestore && characters.length > userStates.length) {
            const batch = writeBatch(firestore);
            characters.forEach(char => {
                if (char.id && !userStates.some(s => s.id === char.id)) {
                    const newStateRef = doc(firestore, `users/${user.uid}/characterStates`, char.id);
                    const newStateData = { affection: 50, charmAwarded: false };
                    batch.set(newStateRef, newStateData);
                }
            });
            batch.commit().catch(e => {
                const permissionError = new FirestorePermissionError({
                    path: `users/${user.uid}/characterStates`,
                    operation: 'write', // Batch can contain multiple ops, 'write' is generic
                    requestResourceData: { info: "Batch write for new character states" },
                }, e);
                errorEmitter.emit('permission-error', permissionError);
            });
        }

        const newBgmVolume = userProfile?.bgmVolume ?? 0.25;
        if (bgmAudioRef.current) {
            bgmAudioRef.current.volume = newBgmVolume;
        }

        return {
            ...prevState,
            user,
            userRole,
            characters,
            characterStates,
            userProfile,
            charm: userProfile?.charm ?? 0,
            gameDate: userProfile?.gameDate ?? 1,
            enableTTS: userProfile?.enableTTS ?? false,
            bgmVolume: newBgmVolume,
            loading: false,
        };
    });

  }, [
      user, userRole, userLoading, 
      charactersFromDb, charactersLoading, 
      userProfile, userProfileLoading,
      characterStatesFromDb, characterStatesLoading,
      firestore
  ]);


  const updateState = useCallback((updater: (prevState: GameState) => GameState) => {
    setState(updater);
  }, []);

  const setErrorMessage = useCallback((message: string) => {
    updateState(prev => ({ ...prev, errorMessage: message }));
  }, [updateState]);

  const clearAffectionEvent = useCallback(() => {
    updateState(prev => ({ ...prev, affectionEvent: null }));
  }, [updateState]);

  const cancelSpeech = useCallback(() => {
    if (speechPingIntervalRef.current) {
      clearInterval(speechPingIntervalRef.current);
      speechPingIntervalRef.current = null;
    }
    if (window.speechSynthesis && window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    if (utteranceRef.current) {
      utteranceRef.current = null;
    }
    if (state.isSpeaking) {
      updateState(prev => ({ ...prev, isSpeaking: false }));
    }
  }, [updateState, state.isSpeaking]);

  const speak = useCallback((text: string, onEnd?: () => void) => {
    if (!state.enableTTS || !window.speechSynthesis) {
        onEnd?.();
        return;
    }
    
    cancelSpeech();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';

    const handleEnd = () => {
        if (speechPingIntervalRef.current) {
            clearInterval(speechPingIntervalRef.current);
            speechPingIntervalRef.current = null;
        }
        updateState(prev => ({ ...prev, isSpeaking: false }));
        utteranceRef.current = null;
        onEnd?.();
    };

    utterance.onstart = () => {
      updateState(prev => ({ ...prev, isSpeaking: true }));
      speechPingIntervalRef.current = setInterval(() => {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }, 15000);
    };
    
    utterance.onend = handleEnd;
    utterance.onerror = (event) => {
        handleEnd(); // Ensure state is cleaned up on error
    };

    utteranceRef.current = utterance;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) {
        const japaneseVoice = voices.find(voice => voice.lang === 'ja-JP');
        if (japaneseVoice) utterance.voice = japaneseVoice;
        window.speechSynthesis.speak(utterance);
    } else {
        window.speechSynthesis.onvoiceschanged = () => {
            const updatedVoices = window.speechSynthesis.getVoices();
            const japaneseVoice = updatedVoices.find(voice => voice.lang === 'ja-JP');
            if (japaneseVoice) utterance.voice = japaneseVoice;
            window.speechSynthesis.speak(utterance);
        };
    }
  }, [state.enableTTS, updateState, cancelSpeech]);

  const startConversation = useCallback((characterId: CharacterId) => {
    updateState(prev => ({ ...prev, activeConversation: characterId }));
    
    // Play BGM
    if (!bgmAudioRef.current) {
        bgmAudioRef.current = new Audio('/music/bgm1.wav');
        bgmAudioRef.current.loop = true;
    }
    bgmAudioRef.current.volume = state.bgmVolume;
    bgmAudioRef.current.play().catch(e => console.error("BGM play failed:", e));

  }, [updateState, state.bgmVolume]);

  const endConversation = useCallback(() => {
    cancelSpeech();
    updateState(prev => ({ ...prev, activeConversation: null }));

    // Pause and reset BGM
    if (bgmAudioRef.current) {
        bgmAudioRef.current.pause();
        bgmAudioRef.current.currentTime = 0;
    }
  }, [updateState, cancelSpeech]);

  const startPersonaEdit = useCallback((characterId: CharacterId) => {
    updateState(prev => ({ ...prev, editingPersonaCharacterId: characterId }));
  }, [updateState]);

  const endPersonaEdit = useCallback(() => {
    updateState(prev => ({ ...prev, editingPersonaCharacterId: null }));
  }, [updateState]);

  const sendMessage = useCallback(async (text: string) => {
    if (!state.activeConversation || !text.trim() || state.isAiResponding || !state.characters || !state.characterStates || !firestore || !user || !state.userProfile) return;

    setErrorMessage('');
    const charId = state.activeConversation;
    const conversationHistoryRef = collection(firestore, 'users', user.uid, 'conversationHistory');
    
    updateState(prev => ({ ...prev, isAiResponding: true, affectionEvent: null }));

    try {
        const userMessage: Omit<Message, 'id'> = { 
            sender: 'user', 
            text, 
            timestamp: serverTimestamp(),
            characterId: charId 
        };
        await addDoc(conversationHistoryRef, userMessage);
        
        // Trigger a re-fetch in the modal
        updateState(prev => ({ ...prev, conversationUpdateTrigger: Date.now() }));

        const historyQuery = query(
            conversationHistoryRef,
            where('characterId', '==', charId),
            orderBy('timestamp', 'desc'), 
            limit(10)
        );
        const historySnapshot = await getDocs(historyQuery);
        
        const plainHistory = historySnapshot.docs.map(doc => {
          const data = doc.data();
          return { ...data, timestamp: (data.timestamp as Timestamp)?.toDate().toISOString() || new Date().toISOString() };
        }).reverse() as Message[];

        const activeCharacter = state.characters.find(c => c.id === charId);
        if (!activeCharacter) {
            throw new Error("アクティブなキャラクターが見つかりません。");
        }

        const result = await getAiResponse(activeCharacter, text, plainHistory, state.userProfile);
        
        updateState(prev => ({ ...prev, isAiResponding: false }));

        if (result.success) {
          const aiMessage: Omit<Message, 'id'> = { 
              sender: charId, 
              text: result.message, 
              timestamp: serverTimestamp(),
              characterId: charId
          };
          await addDoc(conversationHistoryRef, aiMessage);
          
          // Trigger another re-fetch to show AI response
          updateState(prev => ({ ...prev, conversationUpdateTrigger: Date.now() }));
          
          const currentCharacterState = state.characterStates[charId];
          const affectionChange = (result.productivityScore || 0) * AFFECTION_MULTIPLIER;
          const newAffection = Math.max(0, Math.min(100, (currentCharacterState?.affection || 50) + affectionChange));

          if (affectionChange > 0) {
            updateState(prev => ({
              ...prev,
              affectionEvent: { characterId: charId, change: affectionChange },
            }));
          }

          let shouldAwardCharm = newAffection >= CHARM_THRESHOLD && !(currentCharacterState.charmAwarded ?? false);
          
          if (shouldAwardCharm) {
            const newCharm = (state.userProfile.charm || 0) + CHARM_AWARD;
            toast({
              title: "魅力アップ！",
              description: `${activeCharacter.name}との仲が深まりました。魅力が${CHARM_AWARD}ポイント上昇しました。`,
            });
            const userDocRef = doc(firestore, 'users', user.uid);
            await updateDoc(userDocRef, { charm: newCharm });
          }

          const characterStateRef = doc(firestore, 'users', user.uid, 'characterStates', charId);
          const newCharacterState = { 
              affection: newAffection,
              charmAwarded: shouldAwardCharm ? true : (currentCharacterState.charmAwarded ?? false)
          };
          await setDoc(characterStateRef, newCharacterState, { merge: true });

          speak(result.message);
        } else {
          setErrorMessage(result.message);
        }
    } catch(error) {
        console.error("Error during sendMessage:", error);
        const permissionError = new FirestorePermissionError({
            path: `users/${user.uid}/conversationHistory`,
            operation: 'write',
            requestResourceData: { messageText: text },
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setErrorMessage(`メッセージの送信中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
        updateState(prev => ({ ...prev, isAiResponding: false }));
    }
  }, [state, updateState, toast, setErrorMessage, firestore, user, speak]);

  const updateCharacterPersona = useCallback(async (characterId: CharacterId, data: Partial<Character>) => {
    if (!firestore) return;
    const characterDocRef = doc(firestore, 'characters', characterId);
    try {
      await updateDoc(characterDocRef, data);
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: characterDocRef.path,
            operation: 'update',
            requestResourceData: data,
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        // Re-throw the error to be caught by the calling component
        throw error;
    }
  }, [firestore]);

  const stayAtInn = useCallback(async () => {
    if (!firestore || !user || !state.characterStates) return;
    
    const newGameDate = state.gameDate + 1;
    
    const userDocRef = doc(firestore, 'users', user.uid);
    const batch = writeBatch(firestore);
    
    batch.update(userDocRef, { gameDate: newGameDate });

    Object.keys(state.characterStates).forEach(charId => {
        const charStateRef = doc(firestore, 'users', user.uid, 'characterStates', charId);
        batch.set(charStateRef, { affection: 50, charmAwarded: false });
    });

    try {
        await batch.commit();
        toast({ title: "新しい一日", description: "次の日になり、キャラクターの好感度がリセットされました。"});
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'write',
            requestResourceData: { info: "Batch write for stayAtInn" },
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setErrorMessage(`処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }

  }, [firestore, user, toast, state.gameDate, state.characterStates, setErrorMessage]);
  
  const setEnableTTS = useCallback(async (enabled: boolean) => {
    if (!user || !firestore) return;
    updateState(prev => ({...prev, enableTTS: enabled}));
    const userDocRef = doc(firestore, 'users', user.uid);
    try {
      await updateDoc(userDocRef, { enableTTS: enabled });
      if (!enabled) {
        cancelSpeech();
      }
    } catch(error) {
      const permissionError = new FirestorePermissionError({
        path: userDocRef.path,
        operation: 'update',
        requestResourceData: { enableTTS: enabled },
      }, error);
      errorEmitter.emit('permission-error', permissionError);
      setErrorMessage("音声設定の保存に失敗しました。");
      // Revert optimistic update
      updateState(prev => ({...prev, enableTTS: !enabled}));
    }
  }, [user, firestore, updateState, cancelSpeech, setErrorMessage]);
  
  const setBgmVolume = useCallback(async (volume: number) => {
    if (!user || !firestore) return;
    const finalVolume = Math.max(0, Math.min(1, volume));

    updateState(prev => ({ ...prev, bgmVolume: finalVolume }));

    if (bgmAudioRef.current) {
        bgmAudioRef.current.volume = finalVolume;
    }

    const userDocRef = doc(firestore, 'users', user.uid);
    try {
        await updateDoc(userDocRef, { bgmVolume: finalVolume });
    } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: userDocRef.path,
            operation: 'update',
            requestResourceData: { bgmVolume: finalVolume },
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setErrorMessage("音量設定の保存に失敗しました。");
    }
  }, [user, firestore, updateState, setErrorMessage]);

  const unlockCharacter = useCallback(async (characterId: CharacterId) => {
    if (!firestore || !user || !state.characters) return;
    const character = state.characters.find(c => c.id === characterId);
    if (!character || !character.isLocked) return;

    const cost = character.unlockCost ?? 0;
    if (state.charm < cost) {
      toast({
        variant: "destructive",
        title: "ポイントが足りません",
        description: `このキャラクターを解放するには${cost}の魅力ポイントが必要です。`,
      });
      return;
    }

    const batch = writeBatch(firestore);
    const userDocRef = doc(firestore, 'users', user.uid);
    const characterDocRef = doc(firestore, 'characters', characterId);

    const newCharm = state.charm - cost;
    batch.update(userDocRef, { charm: newCharm });
    batch.update(characterDocRef, { unlockedBy: arrayUnion(user.uid) });

    try {
      await batch.commit();
      toast({
        title: "解放成功！",
        description: `${character.name}との会話が可能になりました。`,
      });
    } catch (error) {
      const permissionError = new FirestorePermissionError({
            path: userDocRef.path, // or characterDocRef.path
            operation: 'write',
            requestResourceData: { info: "Batch write for unlockCharacter" },
        }, error);
        errorEmitter.emit('permission-error', permissionError);
      setErrorMessage(`キャラクターの解放に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }

  }, [firestore, user, state.characters, state.charm, toast, setErrorMessage]);
  
  const generateAndCreateCharacter = useCallback(async (theme: string) => {
    if (!firestore) {
      setErrorMessage("データベースに接続されていません。");
      return;
    }

    const result = await generateCharacter(theme);
    if (result.success && result.data) {
      try {
        const charactersCollectionRef = collection(firestore, 'characters');
        await addDoc(charactersCollectionRef, result.data);
        toast({
          title: '成功',
          description: `AIキャラクター「${result.data.name}」が作成されました！`,
        });
      } catch (error) {
        const permissionError = new FirestorePermissionError({
            path: 'characters',
            operation: 'create',
            requestResourceData: result.data,
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        setErrorMessage(`AIキャラクターのデータベースへの保存中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      setErrorMessage(result.message);
    }
  }, [firestore, setErrorMessage, toast]);

  const toggleCharacterLock = useCallback(async (characterId: string, isLocked: boolean) => {
     if (!firestore) {
      setErrorMessage("データベースに接続されていません。");
      return { success: false, message: "データベースに接続されていません。" };
    }
    try {
        const characterDocRef = doc(firestore, 'characters', characterId);
        await updateDoc(characterDocRef, {
            isLocked: !isLocked
        });
        return { success: true, message: `キャラクターのロック状態を${!isLocked ? 'ロック' : 'アンロック'}しました。` };
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const permissionError = new FirestorePermissionError({
            path: `characters/${characterId}`,
            operation: 'update',
            requestResourceData: { isLocked: !isLocked },
        }, error);
        errorEmitter.emit('permission-error', permissionError);
        return { success: false, message: `ロック状態の切り替えに失敗しました: ${errorMessage}` };
    }
  }, [firestore, setErrorMessage]);
  
  const contextValue: GameContextType = {
    ...state,
    startConversation,
    endConversation,
    startPersonaEdit,
    endPersonaEdit,
    sendMessage,
    updateCharacterPersona,
    stayAtInn,
    setErrorMessage,
    speak,
    cancelSpeech,
    setEnableTTS,
    setBgmVolume,
    unlockCharacter,
    toggleCharacterLock,
    clearAffectionEvent,
    generateAndCreateCharacter,
  };

  return (
    <GameStateContext.Provider value={contextValue}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = (): GameContextType => {
  const context = useContext(GameStateContext);
  if (context === undefined) {
    throw new Error('useGameState must be used within a GameStateProvider');
  }
  return context;
};

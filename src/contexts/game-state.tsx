
'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo, useRef } from 'react';
import { Character, CharacterId, GameContextType, GameState, Message, CharacterState, UserProfile } from '@/lib/types';
import { getAiResponse } from '@/actions/chat';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, Timestamp, doc, setDoc, getDoc, writeBatch, where, updateDoc, arrayUnion } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';
import { toggleCharacterLock as toggleCharacterLockAction } from '@/actions/character';

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
    isAiResponding: false,
    errorMessage: '',
    user: null, // Will be populated by useUser
    userProfile: null,
    loading: true,
    userRole: 'user', // Will be populated by useUser
    isSpeaking: false,
    enableTTS: false, // Default TTS to off
  };
};

const GameStateContext = createContext<GameContextType | undefined>(undefined);

export function GameStateProvider({ children }: { children: ReactNode }) {
  const { user, role: userRole, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { data: charactersFromDb, loading: charactersLoading } = useCollection<Character>('characters');
  
  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const { data: userProfile, loading: userProfileLoading } = useDoc<UserProfile>(userProfilePath);
  
  const characterStatesPath = useMemo(() => (user ? `users/${user.uid}/characterStates` : null), [user]);
  const { data: characterStatesFromDb, loading: characterStatesLoading } = useCollection<CharacterState>(characterStatesPath);

  const [state, setState] = useState<GameState>(createInitialState(null, null));
  const { toast } = useToast();
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const speechPingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
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
                    enableTTS: false, // Default on creation
                };
                setDoc(userDocRef, newUserProfile);
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
                    batch.set(newStateRef, { affection: 50, charmAwarded: false });
                }
            });
            batch.commit().catch(e => console.error("Failed to create new character states", e));
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
            enableTTS: userProfile?.enableTTS ?? false, // Load TTS setting, default to false
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
        console.error("SpeechSynthesisUtterance.onerror", event);
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
  }, [updateState]);

  const endConversation = useCallback(() => {
    cancelSpeech();
    updateState(prev => ({ ...prev, activeConversation: null }));
  }, [updateState, cancelSpeech]);

  const sendMessage = useCallback(async (text: string) => {
    if (!state.activeConversation || !text.trim() || state.isAiResponding || !state.characters || !state.characterStates || !firestore || !user || !state.userProfile) return;

    if (!process.env.GEMINI_API_KEY) {
      setErrorMessage(
        'Gemini APIキーが設定されていません。.envファイルに GEMINI_API_KEY として設定してください。'
      );
      return;
    }

    setErrorMessage('');
    const charId = state.activeConversation;
    const conversationHistoryRef = collection(firestore, 'users', user.uid, 'conversationHistory');

    const userMessage: Message = { 
        sender: 'user', 
        text, 
        timestamp: serverTimestamp(),
        characterId: charId 
    };

    updateState(prev => ({ ...prev, isAiResponding: true }));

    const historyQuery = query(
        conversationHistoryRef,
        orderBy('timestamp', 'desc'), 
        limit(20)
    );
    const historySnapshot = await getDocs(historyQuery);
    
    const plainHistory = historySnapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, timestamp: (data.timestamp as Timestamp).toDate().toISOString() };
    }).filter(msg => msg.characterId === charId).reverse() as Message[];

    await addDoc(conversationHistoryRef, userMessage);

    const activeCharacter = state.characters.find(c => c.id === charId);
    if (!activeCharacter) {
        setErrorMessage("アクティブなキャラクターが見つかりません。");
        updateState(prev => ({...prev, isAiResponding: false}));
        return;
    }

    const result = await getAiResponse(activeCharacter, text, plainHistory.slice(-10), state.userProfile);
    
    updateState(prev => ({ ...prev, isAiResponding: false }));

    if (result.success) {
      const aiMessage: Message = { 
          sender: charId, 
          text: result.message, 
          timestamp: serverTimestamp(),
          characterId: charId
      };
      await addDoc(conversationHistoryRef, aiMessage);
      
      const currentCharacterState = state.characterStates[charId];
      const affectionChange = (result.loveScore || 0) * AFFECTION_MULTIPLIER;
      const newAffection = Math.max(0, Math.min(100, (currentCharacterState?.affection || 50) + affectionChange));

      let shouldAwardCharm = newAffection >= CHARM_THRESHOLD && !(currentCharacterState.charmAwarded ?? false);
      
      let newCharm = state.charm;
      if (shouldAwardCharm) {
        newCharm += CHARM_AWARD;
        toast({
          title: "魅力アップ！",
          description: `${activeCharacter.name}との仲が深まりました。魅力が${CHARM_AWARD}ポイント上昇しました。`,
        });
        
        const userDocRef = doc(firestore, 'users', user.uid);
        await updateDoc(userDocRef, { charm: newCharm });
      }

      const characterStateRef = doc(firestore, 'users', user.uid, 'characterStates', charId);
      await setDoc(characterStateRef, { 
          affection: newAffection,
          charmAwarded: shouldAwardCharm ? true : (currentCharacterState.charmAwarded ?? false)
      }, { merge: true });

      speak(result.message);
    } else {
      setErrorMessage(result.message);
    }
  }, [state, updateState, toast, setErrorMessage, firestore, user, speak]);

  const updateCharacterPersona = useCallback((characterId: CharacterId, description: string) => {
    if (!firestore) return;
    const characterDocRef = doc(firestore, 'characters', characterId);
    updateDoc(characterDocRef, { description })
      .then(() => {
        toast({ title: "ペルソナ更新", description: `${characterId}のペルソナを更新しました。`});
      })
      .catch((error) => {
        setErrorMessage(`ペルソナの更新に失敗しました: ${error.message}`);
      });
  }, [firestore, toast, setErrorMessage]);

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
    } catch(e) {
      console.error("Failed to update TTS setting:", e);
      setErrorMessage("音声設定の保存に失敗しました。");
      // Revert optimistic update
      updateState(prev => ({...prev, enableTTS: !enabled}));
    }
  }, [user, firestore, updateState, cancelSpeech, setErrorMessage]);

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
      setErrorMessage(`キャラクターの解放に失敗しました: ${error instanceof Error ? error.message : String(error)}`);
    }

  }, [firestore, user, state.characters, state.charm, toast, setErrorMessage]);
  
  const toggleCharacterLock = useCallback(async (characterId: string, isLocked: boolean) => {
    return await toggleCharacterLockAction(characterId, isLocked);
  }, []);
  
  const contextValue: GameContextType = {
    ...state,
    startConversation,
    endConversation,
    sendMessage,
    updateCharacterPersona,
    stayAtInn,
    setErrorMessage,
    speak,
    cancelSpeech,
    setEnableTTS,
    unlockCharacter,
    toggleCharacterLock,
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

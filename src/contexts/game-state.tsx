'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Character, CharacterId, GameContextType, GameState, Message, CharacterState, UserProfile } from '@/lib/types';
import { getAiResponse } from '@/actions/chat';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, Timestamp, doc, setDoc, getDoc, writeBatch, where } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';

const VIRTUE_THRESHOLD = 80;
const VIRTUE_AWARD = 10;
const MOOD_MULTIPLIER = 10; // Score (-1.0 to 1.0) will be multiplied by this

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
            characterStates[char.id] = { mood: 50, tokAwarded: false };
        }
    }
  }


  return {
    characters,
    characterStates,
    tok: 0,
    gameDate: 1,
    activeConversation: null,
    isAiResponding: false,
    errorMessage: '',
    user: null, // Will be populated by useUser
    loading: true,
    userRole: 'user', // Will be populated by useUser
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
  
  // Effect for creating user profile on first login
  useEffect(() => {
    if (user && !userLoading && !userProfile && !userProfileLoading && firestore) {
        const userDocRef = doc(firestore, 'users', user.uid);
        getDoc(userDocRef).then(docSnap => {
            if (!docSnap.exists()) {
                const newUserProfile: UserProfile = {
                    email: user.email || '',
                    displayName: user.displayName || user.email?.split('@')[0] || 'New User',
                    tok: 0,
                    gameDate: 1,
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
                acc[char.id] = existingState || { id: char.id, mood: 50, tokAwarded: false };
            }
            return acc;
        }, {} as Record<CharacterId, CharacterState>);
        
        // If a new character was added, we might need to create a state for them
        if (user && firestore && characters.length > userStates.length) {
            const batch = writeBatch(firestore);
            characters.forEach(char => {
                if (char.id && !userStates.some(s => s.id === char.id)) {
                    const newStateRef = doc(firestore, `users/${user.uid}/characterStates`, char.id);
                    batch.set(newStateRef, { mood: 50, tokAwarded: false });
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
            tok: userProfile?.tok ?? 0,
            gameDate: userProfile?.gameDate ?? 1,
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

  const startConversation = useCallback((characterId: CharacterId) => {
    setErrorMessage('');
    updateState(prev => ({ ...prev, activeConversation: characterId }));
  }, [updateState, setErrorMessage]);

  const endConversation = useCallback(() => {
    updateState(prev => ({ ...prev, activeConversation: null }));
  }, [updateState]);

  const sendMessage = useCallback(async (text: string) => {
    if (!state || !state.activeConversation || !text.trim() || state.isAiResponding || !state.characters || !state.characterStates || !firestore || !user) return;

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
        where('characterId', '==', charId),
        orderBy('timestamp', 'desc'), 
        limit(10)
    );
    const historySnapshot = await getDocs(historyQuery);
    
    const plainHistory = historySnapshot.docs.map(doc => {
      const data = doc.data();
      return { ...data, timestamp: (data.timestamp as Timestamp).toDate().toISOString() };
    }).reverse() as Message[];

    await addDoc(conversationHistoryRef, userMessage);

    const activeCharacter = state.characters.find(c => c.id === charId);
    if (!activeCharacter) {
        setErrorMessage("アクティブなキャラクターが見つかりません。");
        updateState(prev => ({...prev, isAiResponding: false}));
        return;
    }

    const result = await getAiResponse(activeCharacter, text, plainHistory);
    
    if (result.success) {
      const aiMessage: Message = { 
          sender: charId, 
          text: result.message, 
          timestamp: serverTimestamp(),
          characterId: charId
      };
      await addDoc(conversationHistoryRef, aiMessage);
      
      const currentCharacterState = state.characterStates[charId];
      const moodChange = (result.sentimentScore || 0) * MOOD_MULTIPLIER;
      const newMood = Math.max(0, Math.min(100, (currentCharacterState?.mood || 50) + moodChange));

      let shouldAwardTok = newMood >= VIRTUE_THRESHOLD && !currentCharacterState.tokAwarded;
      
      let newTok = state.tok;
      if (shouldAwardTok) {
        newTok += VIRTUE_AWARD;
        toast({
          title: "徳を獲得！",
          description: `${activeCharacter.name}の機嫌が良くなりました。徳を${VIRTUE_AWARD}ポイント獲得しました。`,
        });
        
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, { tok: newTok }, { merge: true });
      }

      const characterStateRef = doc(firestore, 'users', user.uid, 'characterStates', charId);
      await setDoc(characterStateRef, { 
          mood: newMood,
          tokAwarded: shouldAwardTok ? true : currentCharacterState.tokAwarded
      }, { merge: true });

      updateState(prev => ({...prev, isAiResponding: false}));
      // State will be updated by the Firestore listener, no need to setState here for tok/mood
    } else {
      setErrorMessage(result.message);
      updateState(prev => ({
        ...prev,
        isAiResponding: false,
      }));
    }
  }, [state, updateState, toast, setErrorMessage, firestore, user]);

  const updateCharacterPersona = useCallback((characterId: CharacterId, description: string) => {
    if (!firestore) return;
    const characterDocRef = doc(firestore, 'characters', characterId);
    setDoc(characterDocRef, { description }, { merge: true })
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
        batch.set(charStateRef, { mood: 50, tokAwarded: false });
    });

    try {
        await batch.commit();
        toast({ title: "新しい一日", description: "宿に泊まり、新しい一日が始まりました。"});
        // Local state will update via Firestore listeners
    } catch (error) {
        setErrorMessage(`宿に泊まる処理中にエラーが発生しました: ${error instanceof Error ? error.message : String(error)}`);
    }

  }, [firestore, user, toast, state.gameDate, state.characterStates, setErrorMessage]);

  
  const contextValue: GameContextType = {
    ...state,
    startConversation,
    endConversation,
    sendMessage,
    updateCharacterPersona,
    stayAtInn,
    setErrorMessage,
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

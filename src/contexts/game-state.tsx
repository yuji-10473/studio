'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useMemo } from 'react';
import { Character, CharacterId, GameContextType, GameState, Message, CharacterState, UserProfile, UserRole } from '@/lib/types';
import { getAiResponse } from '@/actions/chat';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import type { User } from 'firebase/auth';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs, Timestamp, doc, setDoc, getDoc } from 'firebase/firestore';
import { useDoc } from '@/firebase/firestore/use-doc';

const VIRTUE_THRESHOLD = 80;
const VIRTUE_AWARD = 10;
const MOOD_MULTIPLIER = 10; // Score (-1.0 to 1.0) will be multiplied by this

const STORAGE_KEY = 'townfolk-tales-gamestate';

const GameStateContext = createContext<GameContextType | undefined>(undefined);

const createInitialState = (characters: Character[] | null, user: User | null): GameState => {
  const characterStates = characters ? characters.reduce((acc, char) => {
    if (char.id) {
      acc[char.id] = {
        mood: 50,
        tokAwarded: false,
      };
    }
    return acc;
  }, {} as Record<CharacterId, CharacterState>) : null;

  return {
    characters,
    characterStates,
    tok: 0,
    gameDate: 1,
    activeConversation: null,
    isAiResponding: false,
    errorMessage: '',
    user: user,
    loading: true,
    userRole: 'user',
  };
};

export function GameStateProvider({ children }: { children: ReactNode }) {
  const { user, role: userRole, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { data: charactersFromDb, loading: charactersLoading } = useCollection<Character>('characters');
  
  // We only want to fetch the user profile if the user is logged in.
  // The useDoc hook is modified to handle a null path.
  const userProfilePath = useMemo(() => (user ? `users/${user.uid}` : null), [user]);
  const { data: userProfile, loading: userProfileLoading } = useDoc<UserProfile>(userProfilePath);


  const [state, setState] = useState<GameState>(createInitialState(null, null));
  const { toast } = useToast();

  useEffect(() => {
    const loading = userLoading || charactersLoading || (user && userProfileLoading);
    if (loading) {
      setState(prev => ({...prev, loading: true}));
      return;
    }
    
    // Create user profile if it doesn't exist
    if (user && !userProfile && firestore) {
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
        // The useDoc hook will refetch and update the userProfile state, triggering another rerender.
        // We can continue with the current flow as it will be corrected shortly.
    }


    setState(prevState => {
      const isInitialLoad = !prevState.characters;
      const characters = charactersFromDb || [];

      if (!isInitialLoad) {
         const characterStates = characters.reduce((acc, char) => {
          if (char.id) {
            acc[char.id] = prevState.characterStates?.[char.id] || {
              mood: 50,
              tokAwarded: false,
            };
          }
          return acc;
        }, {} as Record<CharacterId, CharacterState>);

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
      }
      
      const initialState = createInitialState(characters, user);
      let characterStates = initialState.characterStates;

      try {
        const savedStateJSON = localStorage.getItem(STORAGE_KEY);
        if (savedStateJSON) {
          const savedState = JSON.parse(savedStateJSON);
          
          if (savedState.characterStates) {
            characterStates = characters.reduce((acc, char) => {
              if (char.id) {
                acc[char.id] = savedState.characterStates?.[char.id] || {
                    mood: 50,
                    tokAwarded: false,
                };
              }
              return acc;
            }, {} as Record<CharacterId, CharacterState>);
          }
        }
      } catch (error) {
        console.error("Failed to load character states from localStorage", error);
      }
      
      return {
        ...initialState,
        characterStates,
        userRole,
        tok: userProfile?.tok ?? 0,
        gameDate: userProfile?.gameDate ?? 1,
        loading: false
      };
    });

  }, [user, userRole, userLoading, charactersFromDb, charactersLoading, userProfile, userProfileLoading, firestore]);


  useEffect(() => {
    if (state && !state.loading && state.characterStates) {
      try {
        const stateToSave = { 
            characterStates: state.characterStates
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save game state to localStorage", error);
      }
    }
  }, [state]);
  
  const updateState = useCallback((updater: (prevState: GameState) => GameState) => {
    setState(prevState => {
        return updater(prevState);
    });
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
    const userMessage: Message = { sender: 'user', text, timestamp: serverTimestamp() };

    updateState(prev => ({ ...prev, isAiResponding: true }));

    const conversationHistoryRef = collection(firestore, 'characters', charId, 'conversationHistory');
    
    const historyQuery = query(conversationHistoryRef, orderBy('timestamp', 'desc'), limit(4));
    const historySnapshot = await getDocs(historyQuery);
    
    const plainHistory = historySnapshot.docs.map(doc => {
      const data = doc.data();
      const timestamp = data.timestamp;
      if (timestamp instanceof Timestamp) {
        return { ...data, timestamp: timestamp.toDate().toISOString() };
      }
      return data;
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
      const aiMessage: Message = { sender: charId, text: result.message, timestamp: serverTimestamp() };
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
        
        // Update user profile in Firestore
        const userDocRef = doc(firestore, 'users', user.uid);
        await setDoc(userDocRef, { tok: newTok }, { merge: true });
      }

      updateState(prev => {
        if (!prev.characterStates) return prev;
        
        return {
          ...prev,
          tok: newTok,
          characterStates: {
            ...prev.characterStates,
            [charId]: {
              ...prev.characterStates[charId],
              mood: newMood,
              tokAwarded: shouldAwardTok ? true : currentCharacterState.tokAwarded,
            },
          },
          isAiResponding: false,
        };
      });
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

  const stayAtInn = useCallback(() => {
    if (!firestore || !user) return;
    
    setState(prev => {
      const newGameDate = prev.gameDate + 1;
      
      // We need to do this outside the setState to avoid race conditions
      const userDocRef = doc(firestore, 'users', user.uid);
      setDoc(userDocRef, { gameDate: newGameDate }, { merge: true });

      const resetCharacterStates = prev.characterStates ? Object.keys(prev.characterStates).reduce((acc, key) => {
        acc[key as CharacterId] = { mood: 50, tokAwarded: false };
        return acc;
      }, {} as Record<CharacterId, CharacterState>) : null;
      
      toast({ title: "新しい一日", description: "宿に泊まり、新しい一日が始まりました。"});

      return {
        ...prev,
        gameDate: newGameDate,
        characterStates: resetCharacterStates,
      }
    });

  }, [firestore, user, toast]);

  
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

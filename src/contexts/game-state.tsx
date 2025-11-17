'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Character, CharacterId, GameContextType, GameState, Message, CharacterState } from '@/lib/types';
import { getAiResponse } from '@/actions/chat';
import { useToast } from '@/hooks/use-toast';
import { useCollection } from '@/firebase/firestore/use-collection';
import { useUser } from '@/firebase/auth/use-user';
import type { User } from 'firebase/auth';
import { useFirestore } from '@/firebase';
import { collection, addDoc, serverTimestamp, query, orderBy, limit, getDocs } from 'firebase/firestore';

const VIRTUE_THRESHOLD = 80;
const VIRTUE_AWARD = 10;
const MOOD_INCREASE = 15;
const STORAGE_KEY = 'townfolk-tales-gamestate';

const GameStateContext = createContext<GameContextType | undefined>(undefined);

const createInitialState = (characters: Character[] | null, user: User | null): GameState => {
  const characterStates = characters ? characters.reduce((acc, char) => {
    if (char.id) {
      acc[char.id] = {
        mood: 50,
        conversationHistory: [], // This will now be populated from firestore
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
  };
};

export function GameStateProvider({ children }: { children: ReactNode }) {
  const { user, loading: userLoading } = useUser();
  const firestore = useFirestore();
  const { data: charactersFromDb, loading: charactersLoading } = useCollection<Character>('characters');
  const [state, setState] = useState<GameState>(createInitialState(null, null));
  const { toast } = useToast();

  useEffect(() => {
    if (userLoading || charactersLoading) {
      return; // Wait for both user and characters to finish loading
    }
    
    setState(prevState => {
      const isInitialLoad = !prevState.characters;
      
      const characters = charactersFromDb || [];

      // If state is already initialized, just update characters and user
      if (!isInitialLoad) {
         const characterStates = characters.reduce((acc, char) => {
          if (char.id) {
            // Preserve existing state if available, otherwise initialize
            acc[char.id] = prevState.characterStates?.[char.id] || {
              mood: 50,
              conversationHistory: [],
              tokAwarded: false,
            };
          }
          return acc;
        }, {} as Record<CharacterId, CharacterState>);

        return {
          ...prevState,
          user,
          characters,
          characterStates,
          loading: false,
        };
      }

      // Initialize state for the first time
      const initialState = createInitialState(characters, user);
      try {
        const savedStateJSON = localStorage.getItem(STORAGE_KEY);
        if (savedStateJSON) {
          const savedState = JSON.parse(savedStateJSON);
          
          const loadedCharacterStates = characters.reduce((acc, char) => {
              if (char.id) {
                acc[char.id] = savedState.characterStates?.[char.id] || {
                    mood: 50,
                    conversationHistory: [],
                    tokAwarded: false,
                };
              }
              return acc;
          }, {} as Record<CharacterId, CharacterState>);

          return {
            ...initialState,
            tok: savedState.tok ?? 0,
            gameDate: savedState.gameDate ?? 1,
            characterStates: loadedCharacterStates,
            loading: false,
          };
        }
      } catch (error) {
        console.error("Failed to load game state from localStorage", error);
      }
      return {...initialState, loading: false};
    });

  }, [user, userLoading, charactersFromDb, charactersLoading]);


  useEffect(() => {
    if (state && !state.loading) {
      try {
        const stateToSave = { 
            tok: state.tok, 
            gameDate: state.gameDate,
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
    if (!state || !state.activeConversation || !text.trim() || state.isAiResponding || !state.characters || !state.characterStates || !firestore) return;

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
    
    // Fetch last 10 messages for context
    const historyQuery = query(conversationHistoryRef, orderBy('timestamp', 'desc'), limit(10));
    const historySnapshot = await getDocs(historyQuery);
    const conversationHistory = historySnapshot.docs.map(doc => doc.data() as Message).reverse();

    // Add new message to firestore (but not to the history we pass to the AI yet)
    await addDoc(conversationHistoryRef, userMessage);

    const activeCharacter = state.characters.find(c => c.id === charId);
    if (!activeCharacter) {
        setErrorMessage("アクティブなキャラクターが見つかりません。");
        updateState(prev => ({...prev, isAiResponding: false}));
        return;
    }

    const result = await getAiResponse(activeCharacter, text, conversationHistory);
    
    if (result.success) {
      const aiMessage: Message = { sender: charId, text: result.message, timestamp: serverTimestamp() };
      await addDoc(conversationHistoryRef, aiMessage);
      
      const currentCharacterState = state.characterStates[charId];
      const newMood = Math.min(100, (currentCharacterState?.mood || 50) + MOOD_INCREASE);
      const tokAwarded = currentCharacterState?.tokAwarded || false;
      let shouldAwardTok = newMood >= VIRTUE_THRESHOLD && !tokAwarded;

      if (shouldAwardTok) {
        toast({
          title: "徳を獲得！",
          description: `${activeCharacter.name}の機嫌が良くなりました。徳を${VIRTUE_AWARD}ポイント獲得しました。`,
        });
      }

      updateState(prev => {
        if (!prev.characterStates) return prev;
        
        let newTok = prev.tok;
        if (shouldAwardTok) {
          newTok += VIRTUE_AWARD;
        }
        
        return {
          ...prev,
          tok: newTok,
          characterStates: {
            ...prev.characterStates,
            [charId]: {
              ...prev.characterStates[charId],
              mood: newMood,
              tokAwarded: shouldAwardTok ? true : tokAwarded,
            },
          },
          isAiResponding: false,
        };
      });
    } else {
      setErrorMessage(result.message);
      // We don't remove the user message from firestore, just visually indicate error
      updateState(prev => ({
        ...prev,
        isAiResponding: false,
      }));
    }
  }, [state, updateState, toast, setErrorMessage, firestore]);

  const updateCharacterPersona = useCallback((characterId: CharacterId, description: string) => {
    // This now only needs to update firestore, the useCollection hook will update the state
    // For now, we will update the local state for responsiveness
    updateState(prev => {
      if (!prev.characters) return prev;
      const newCharacters = prev.characters.map(c => 
        c.id === characterId ? { ...c, description } : c
      );
      
      toast({ title: "ペルソナ更新", description: `ペルソナを更新しました。Firestoreへの保存は未実装です。`});

      return {
        ...prev,
        characters: newCharacters,
      };
    });
  }, [updateState, toast]);

  const stayAtInn = useCallback(() => {
    updateState(prev => {
      if (!prev.characterStates) return prev;
      
      // Clear conversation history from firestore for all characters
      if (prev.characters) {
          prev.characters.forEach(char => {
              if (char.id) {
                // This is a placeholder for a bulk delete, which would be more efficient
                // For now, we just reset the local state, as deleting collections client-side is complex.
              }
          });
      }

      const resetCharacterStates = Object.keys(prev.characterStates).reduce((acc, key) => {
        acc[key as CharacterId] = { mood: 50, conversationHistory: [], tokAwarded: false };
        return acc;
      }, {} as Record<CharacterId, CharacterState>);
      
      toast({ title: "新しい一日", description: "宿に泊まり、新しい一日が始まりました。"});

      return {
        ...prev,
        gameDate: prev.gameDate + 1,
        characterStates: resetCharacterStates,
      }
    });
  }, [updateState, toast]);

  
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

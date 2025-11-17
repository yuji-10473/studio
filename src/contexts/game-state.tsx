'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { CHARACTERS, Character, CharacterId, GameContextType, GameState, Message, CharacterState } from '@/lib/types';
import { getAiResponse } from '@/actions/chat';
import { useToast } from '@/hooks/use-toast';

const VIRTUE_THRESHOLD = 80;
const VIRTUE_AWARD = 10;
const MOOD_INCREASE = 15;
const STORAGE_KEY = 'townfolk-tales-gamestate';

const GameStateContext = createContext<GameContextType | undefined>(undefined);

const createInitialState = (): GameState => {
  const characterStates = Object.keys(CHARACTERS).reduce((acc, key) => {
    acc[key as CharacterId] = {
      mood: 50,
      conversationHistory: [],
      tokAwarded: false,
    };
    return acc;
  }, {} as Record<CharacterId, CharacterState>);

  return {
    characters: { ...CHARACTERS },
    characterStates,
    tok: 0,
    gameDate: 1,
    activeConversation: null,
    isAiResponding: false,
    errorMessage: '',
  };
};

export function GameStateProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(createInitialState());
  const [isLoaded, setIsLoaded] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const savedStateJSON = localStorage.getItem(STORAGE_KEY);
      if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        const updatedCharacters = { ...CHARACTERS };
        if (savedState.characters) {
            for (const charId in updatedCharacters) {
                if (savedState.characters[charId]) {
                    updatedCharacters[charId as CharacterId].description = savedState.characters[charId].description;
                }
            }
        }
        
        setState({ ...createInitialState(), ...savedState, characters: updatedCharacters });
      } else {
        setState(createInitialState());
      }
    } catch (error) {
      console.error("Failed to load game state from localStorage", error);
      setState(createInitialState());
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        const stateToSave = { ...state, activeConversation: null, isAiResponding: false, errorMessage: '' };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
      } catch (error) {
        console.error("Failed to save game state to localStorage", error);
      }
    }
  }, [state, isLoaded]);
  
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
    if (!state.activeConversation || !text.trim() || state.isAiResponding) return;

    setErrorMessage('');
    const charId = state.activeConversation;
    const userMessage: Message = { sender: 'user', text, id: Date.now() };

    updateState(prev => ({
      ...prev,
      isAiResponding: true,
      characterStates: {
        ...prev.characterStates,
        [charId]: {
          ...prev.characterStates[charId],
          conversationHistory: [...prev.characterStates[charId].conversationHistory, userMessage],
        },
      },
    }));

    const result = await getAiResponse(state.characters[charId], text);
    
    if (result.success) {
      const aiMessage: Message = { sender: charId, text: result.message, id: Date.now() + 1 };
      updateState(prev => {
        const currentCharacterState = prev.characterStates[charId];
        const newMood = Math.min(100, currentCharacterState.mood + MOOD_INCREASE);
        let newTok = prev.tok;
        let tokAwarded = currentCharacterState.tokAwarded;

        if (newMood >= VIRTUE_THRESHOLD && !tokAwarded) {
          newTok += VIRTUE_AWARD;
          tokAwarded = true;
          toast({
            title: "徳を獲得！",
            description: `${prev.characters[charId].name}の機嫌が良くなりました。徳を${VIRTUE_AWARD}ポイント獲得しました。`,
          });
        }
        
        return {
          ...prev,
          isAiResponding: false,
          tok: newTok,
          characterStates: {
            ...prev.characterStates,
            [charId]: {
              ...currentCharacterState,
              mood: newMood,
              tokAwarded: tokAwarded,
              conversationHistory: [...currentCharacterState.conversationHistory, aiMessage],
            },
          },
        };
      });
    } else {
      setErrorMessage(result.message);
      updateState(prev => ({
        ...prev,
        isAiResponding: false,
        characterStates: {
          ...prev.characterStates,
          [charId]: {
            ...prev.characterStates[charId],
            // Remove the user message that failed to get a response
            conversationHistory: prev.characterStates[charId].conversationHistory.slice(0, -1),
          },
        },
      }));
    }
  }, [state.activeConversation, state.isAiResponding, state.characters, updateState, toast, setErrorMessage]);

  const updateCharacterPersona = useCallback((characterId: CharacterId, description: string) => {
    updateState(prev => {
      const newCharacters = {
        ...prev.characters,
        [characterId]: {
          ...prev.characters[characterId],
          description,
        },
      };
      
      toast({ title: "ペルソナ更新", description: `${newCharacters[characterId].name}のペルソナを更新しました。`});

      return {
        ...prev,
        characters: newCharacters,
      };
    });
  }, [updateState, toast]);

  const stayAtInn = useCallback(() => {
    updateState(prev => {
      const resetCharacterStates = Object.keys(prev.characters).reduce((acc, key) => {
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

  const contextValue = {
    ...state,
    startConversation,
    endConversation,
    sendMessage,
    updateCharacterPersona,
    stayAtInn,
    setErrorMessage,
  };
  
  if (!isLoaded) {
    return null;
  }

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

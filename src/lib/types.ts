
import type {ImagePlaceholder} from './placeholder-images';
import type { User } from 'firebase/auth';
import type { FieldValue } from 'firebase/firestore';

// This is now used only as a fallback or for initial data structure reference.
// The primary source of truth is Firestore.
export const CHARACTERS_DATA = {
  elara: {
    name: 'エララ',
    introduction: '村の賢いパン屋。いつも焼きたてのパンの香りがする。',
    description: 'あなたは村のパン屋、エララです。温かく、思いやりがあり、村人たちの相談相手になることが多いです。あなたは常にポジティブで、人々の心を温める言葉をかけます。焼きたてのパンの話を交えながら、相手を元気づけてください。',
    imagePath: '/images/icons/icon1.png',
  },
  leon: {
    name: 'レオン',
    introduction: '町の警備隊長。正義感が強く、少し頑固。',
    description: 'あなたは町の警備隊長、レオンです。正義感が強く、町の平和を第一に考えています。口調はぶっきらぼうですが、根は優しく、困っている人を見ると放っておけません。少し疑り深い一面もありますが、信頼した相手には心を開きます。',
    imagePath: '/images/icons/icon2.png',
  },
  seraphina: {
    name: 'セラフィナ',
    introduction: '森の奥に住む物静かな魔法使い。',
    description: 'あなたは森の奥深くで暮らす魔法使い、セラフィナです。物静かで神秘的な雰囲気をまとっていますが、好奇心は旺盛です。自然と魔法に関する知識が豊富で、時折、哲学的な問いを投げかけることがあります。人間社会には少し疎いです。',
    imagePath: '/images/icons/icon3.png',
  }
} as const;

export type CharacterId = string;

export type Character = {
  id?: CharacterId; // Document ID from Firestore
  name: string;
  introduction: string;
  description: string;
  imagePath: string;
  isLocked?: boolean;
  unlockCost?: number;
  unlockedBy?: string[]; // Array of user UIDs who have unlocked this character
};

export type Message = {
  id?: string;
  sender: 'user' | CharacterId;
  characterId: CharacterId;
  text: string;
  timestamp?: FieldValue | any;
};

export type CharacterState = {
  id?: CharacterId; // This will be the characterId
  affection: number;
  charmAwarded: boolean;
};

export type UserRole = 'admin' | 'user';

export type UserProfile = {
  id?: string;
  email: string;
  displayName: string;
  charm: number;
  gameDate: number;
  enableTTS?: boolean; // Text-to-speech setting
  role?: UserRole; // Optional as it might not be on every user doc
  isAdmin?: boolean; // Kept for logic in use-user, but role is preferred
}

export type GameState = {
  characters: Character[] | null;
  characterStates: Record<CharacterId, CharacterState> | null;
  charm: number;
  gameDate: number;
  activeConversation: CharacterId | null;
  isAiResponding: boolean;
  errorMessage: string;
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  userRole: UserRole;
  isSpeaking: boolean;
  enableTTS: boolean; // Text-to-speech setting
};

export type GameContextType = GameState & {
  startConversation: (characterId: CharacterId) => void;
  endConversation: () => void;
  sendMessage: (text: string) => void;
  updateCharacterPersona: (characterId: CharacterId, description: string) => void;
  stayAtInn: () => void;
  setErrorMessage: (message: string) => void;
  speak: (text: string, onEnd?: () => void) => void;
  cancelSpeech: () => void;
  setEnableTTS: (enabled: boolean) => void;
  unlockCharacter: (characterId: CharacterId) => Promise<void>;
  toggleCharacterLock: (characterId: string, isLocked: boolean) => Promise<{ success: boolean, message: string }>;
};

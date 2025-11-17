import type {ImagePlaceholder} from './placeholder-images';

export type CharacterId = keyof typeof CHARACTERS;

export type Character = {
  name: string;
  introduction: string;
  description: string;
  imageId: ImagePlaceholder['id'];
};

export const CHARACTERS = {
  elara: {
    name: 'エララ',
    introduction: '村の賢いパン屋。いつも焼きたてのパンの香りがする。',
    description: 'あなたは村のパン屋、エララです。温かく、思いやりがあり、村人たちの相談相手になることが多いです。あなたは常にポジティブで、人々の心を温める言葉をかけます。焼きたてのパンの話を交えながら、相手を元気づけてください。',
    imageId: 'elara-image',
  },
  leon: {
    name: 'レオン',
    introduction: '町の警備隊長。正義感が強く、少し頑固。',
    description: 'あなたは町の警備隊長、レオンです。正義感が強く、町の平和を第一に考えています。口調はぶっきらぼうですが、根は優しく、困っている人を見ると放っておけません。少し疑り深い一面もありますが、信頼した相手には心を開きます。',
    imageId: 'leon-image',
  },
  seraphina: {
    name: 'セラフィナ',
    introduction: '森の奥に住む物静かな魔法使い。',
    description: 'あなたは森の奥深くで暮らす魔法使い、セラフィナです。物静かで神秘的な雰囲気をまとっていますが、好奇心は旺盛です。自然と魔法に関する知識が豊富で、時折、哲学的な問いを投げかけることがあります。人間社会には少し疎いです。',
    imageId: 'seraphina-image',
  }
} as const satisfies Record<string, Character>;

export type Message = {
  sender: 'user' | CharacterId;
  text: string;
  id: number;
};

export type CharacterState = {
  mood: number;
  conversationHistory: Message[];
  tokAwarded: boolean;
};

export type GameState = {
  characters: Record<CharacterId, Character>;
  characterStates: Record<CharacterId, CharacterState>;
  tok: number;
  gameDate: number;
  activeConversation: CharacterId | null;
  isAiResponding: boolean;
  errorMessage: string;
};

export type GameContextType = GameState & {
  startConversation: (characterId: CharacterId) => void;
  endConversation: () => void;
  sendMessage: (text: string) => void;
  updateCharacterPersona: (characterId: CharacterId, description: string) => void;
  stayAtInn: () => void;
  setErrorMessage: (message: string) => void;
};

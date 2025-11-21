
export type Language = 'en' | 'zh';

export interface LyricLine {
  time: number; // Time in seconds
  text: string;
  words: string[]; // Split words for interaction
  isJapanese?: boolean; // Flag to adjust styling for Japanese text
}

export interface DefinitionData {
  word: string;
  partOfSpeech: string;
  definition: string;
  exampleSentence: string;
  translation: string; // Translation of the word
  pronunciation?: string; // IPA or similar
  romanization?: string; // Pinyin or Romaji
  furigana?: string; // Japanese reading for Kanji
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface Note {
  id: string;
  word: string;
  definitionData: DefinitionData;
  contextLine: string; // The lyric line where the word appeared
  chatHistory: ChatMessage[];
  timestamp: number;
}

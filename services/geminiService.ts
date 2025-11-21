
import { GoogleGenAI, Type } from "@google/genai";
import { DefinitionData, ChatMessage } from "../types";

export const getWordDefinition = async (
  word: string,
  contextLine: string
): Promise<DefinitionData> => {
  // Initialize client inside function to ensure process.env is accessible and avoid top-level init errors
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  // Define Schema locally to avoid top-level execution issues with Type
  const definitionSchema = {
    type: Type.OBJECT,
    properties: {
      word: { type: Type.STRING },
      partOfSpeech: { type: Type.STRING },
      definition: { type: Type.STRING },
      exampleSentence: { type: Type.STRING },
      translation: { type: Type.STRING },
      pronunciation: { type: Type.STRING },
      romanization: { type: Type.STRING },
      furigana: { type: Type.STRING },
    },
    required: ["word", "partOfSpeech", "definition", "exampleSentence", "translation"],
  };

  const prompt = `
    Analyze the word "${word}" found in the song lyric: "${contextLine}".
    Provide the following details in JSON format:
    1. partOfSpeech: The grammatical part of speech.
    2. definition: A concise definition.
    3. translation: Translation of the word to Chinese.
    4. exampleSentence: A new simple example sentence containing the word.
    5. pronunciation: IPA or phonetic notation (e.g., /.../).
    6. romanization: Pinyin (for Chinese) or Romaji (for Japanese).
    7. furigana: The Hiragana reading if the word contains Japanese Kanji (e.g., "ひとり" for "一人"), otherwise empty string.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: definitionSchema,
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as DefinitionData;
  } catch (error) {
    console.error("Error fetching definition:", error);
    throw error;
  }
};

export const getChatResponse = async (
  history: ChatMessage[],
  newMessage: string,
  wordContext: string
): Promise<string> => {
  // Initialize client inside function
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    // Construct the chat history for the model
    const historyForModel = history.map(msg => ({
      role: msg.role,
      parts: [{ text: msg.text }]
    }));

    const systemInstruction = `You are a helpful language tutor. The user is learning the word "${wordContext}". Keep answers concise and helpful.`;

    const chat = ai.chats.create({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: systemInstruction
      },
      history: historyForModel
    });

    const result = await chat.sendMessage({ message: newMessage });
    return result.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Error in chat:", error);
    return "Sorry, I encountered an error.";
  }
};

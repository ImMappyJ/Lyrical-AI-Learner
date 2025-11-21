
import React, { useState, useEffect, useRef } from 'react';
import { X, MessageSquare, BookOpen, Save, Send, Loader2, Volume2 } from 'lucide-react';
import { DefinitionData, ChatMessage, Note, Language } from '../types';
import * as GeminiService from '../services/geminiService';

interface WordDetailModalProps {
  word: string;
  contextLine: string;
  onClose: () => void;
  onSaveNote: (note: Note) => void;
  isOpen: boolean;
  initialData?: Note | null;
  language: Language;
}

const WordDetailModal: React.FC<WordDetailModalProps> = ({
  word,
  contextLine,
  onClose,
  onSaveNote,
  isOpen,
  initialData,
  language,
}) => {
  const [loading, setLoading] = useState(true);
  const [definitionData, setDefinitionData] = useState<DefinitionData | null>(null);
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Localization helpers
  const t = (en: string, zh: string) => (language === 'zh' ? zh : en);

  // Fetch definition when modal opens or initialData changes
  useEffect(() => {
    if (isOpen && word) {
      if (initialData && initialData.word === word) {
        // Load from saved note
        setDefinitionData(initialData.definitionData);
        setChatHistory(initialData.chatHistory || []);
        setLoading(false);
      } else {
        // Fetch new
        setLoading(true);
        setDefinitionData(null);
        setChatHistory([]);
        
        GeminiService.getWordDefinition(word, contextLine)
          .then((data) => {
            setDefinitionData(data);
            setLoading(false);
          })
          .catch((err) => {
            console.error(err);
            setLoading(false);
          });
      }
    }
  }, [isOpen, word, contextLine, initialData]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg: ChatMessage = { role: 'user', text: chatInput };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatInput('');
    setChatLoading(true);

    try {
      const responseText = await GeminiService.getChatResponse(
        [...chatHistory, userMsg], 
        chatInput, 
        word
      );
      
      const aiMsg: ChatMessage = { role: 'model', text: responseText };
      setChatHistory((prev) => [...prev, aiMsg]);
    } catch (e) {
      console.error("Chat error", e);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSave = () => {
    if (definitionData) {
      const note: Note = {
        id: initialData?.id || Date.now().toString(),
        word,
        definitionData,
        contextLine,
        chatHistory,
        timestamp: Date.now(),
      };
      onSaveNote(note);
    }
  };

  const handlePlayAudio = () => {
    if (!word) return;
    
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(word);
    
    // Attempt to determine language based on definition data or character codes
    if (definitionData?.furigana) {
        // Presence of furigana implies Japanese
        utterance.lang = 'ja-JP';
    } else if (/[\u3040-\u309F\u30A0-\u30FF]/.test(word)) {
        // Hiragana/Katakana
        utterance.lang = 'ja-JP';
    } else if (/[\u4E00-\u9FFF]/.test(word)) {
        // Kanji/Hanzi - default to Chinese if no furigana, unless it looks like Japanese context
        // (Simple heuristic: default to zh-CN for Hanzi unless we know otherwise)
        utterance.lang = 'zh-CN';
    } else {
        // Default to English or let browser decide
        utterance.lang = 'en-US';
    }
    
    window.speechSynthesis.speak(utterance);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm p-4">
      <div className="bg-gray-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col border border-gray-700">
        
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-end gap-3">
             <div className="flex flex-col">
                {/* Furigana (Japanese reading) */}
                {definitionData?.furigana && (
                    <span className="text-xs text-gray-400 mb-1">{definitionData.furigana}</span>
                )}
                <h2 className="text-3xl font-bold text-amber-400 capitalize leading-none">{word}</h2>
                {/* Romanization (Pinyin/Romaji) */}
                {definitionData?.romanization && (
                    <span className="text-sm text-blue-300 mt-1 font-mono">{definitionData.romanization}</span>
                )}
             </div>
             
             <button 
                onClick={handlePlayAudio}
                className="mb-1 p-2 rounded-full bg-gray-700 hover:bg-amber-500 hover:text-gray-900 text-amber-400 transition"
                title={t("Listen", "听读音")}
             >
                <Volume2 size={20} />
             </button>
          </div>

          <div className="flex gap-2 self-start">
            {!loading && definitionData && (
                <button 
                    onClick={handleSave}
                    className="p-2 hover:bg-gray-700 rounded-full text-gray-300 hover:text-green-400 transition"
                    title={t("Save Note", "保存笔记")}
                >
                    <Save size={20} />
                </button>
            )}
            <button 
                onClick={onClose}
                className="p-2 hover:bg-gray-700 rounded-full text-gray-300 hover:text-white transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 space-y-3">
              <Loader2 className="animate-spin text-amber-400" size={32} />
              <p className="text-gray-400">{t("Asking AI for definition...", "正在询问 AI 定义...")}</p>
            </div>
          ) : definitionData ? (
            <div className="space-y-6">
              {/* Definition Card */}
              <div className="bg-gray-900/50 p-4 rounded-lg border border-gray-700">
                <div className="flex items-center gap-3 mb-3 flex-wrap">
                  <div className="flex items-center gap-2">
                    <BookOpen size={18} className="text-blue-400" />
                    <span className="text-sm font-mono text-blue-400 px-2 py-0.5 bg-blue-400/10 rounded">
                        {definitionData.partOfSpeech}
                    </span>
                  </div>
                  {definitionData.pronunciation && (
                      <span className="text-gray-400 font-sans text-sm border border-gray-600 rounded px-2 py-0.5">
                        {definitionData.pronunciation}
                      </span>
                  )}
                </div>
                
                <p className="text-lg text-white mb-2">{definitionData.definition}</p>
                <p className="text-gray-400 italic text-sm border-l-2 border-gray-600 pl-3 my-3">
                    "{definitionData.exampleSentence}"
                </p>
                <p className="text-gray-500 mt-2 text-sm border-t border-gray-700 pt-2">
                  <span className="font-semibold text-gray-400">{t("Translation: ", "翻译：")}</span>
                  {definitionData.translation}
                </p>
              </div>

              {/* Chat Section */}
              <div className="flex flex-col h-64 border border-gray-700 rounded-lg overflow-hidden bg-gray-900">
                <div className="bg-gray-800 px-4 py-2 border-b border-gray-700 flex items-center gap-2">
                    <MessageSquare size={16} className="text-purple-400" />
                    <span className="text-sm font-semibold text-gray-300">{t("AI Tutor Chat", "AI 导师对话")}</span>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {chatHistory.length === 0 && (
                    <p className="text-center text-gray-600 text-sm mt-4">
                      {t(`Have questions about "${word}"? Ask here!`, `关于“${word}”有什么问题吗？在这里提问！`)}
                    </p>
                  )}
                  {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] p-2.5 rounded-lg text-sm ${
                        msg.role === 'user' 
                          ? 'bg-purple-600 text-white rounded-br-none' 
                          : 'bg-gray-700 text-gray-200 rounded-bl-none'
                      }`}>
                        {msg.text}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                     <div className="flex justify-start">
                        <div className="bg-gray-700 p-2 rounded-lg rounded-bl-none">
                            <Loader2 className="animate-spin text-gray-400" size={16} />
                        </div>
                     </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="p-2 bg-gray-800 border-t border-gray-700 flex gap-2">
                  <input 
                    type="text" 
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t("Ask a question...", "问个问题...")}
                    className="flex-1 bg-gray-900 border border-gray-600 rounded-md px-3 py-1 text-sm text-white focus:outline-none focus:border-purple-500"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={chatLoading || !chatInput.trim()}
                    className="bg-purple-600 hover:bg-purple-500 disabled:bg-gray-600 text-white p-2 rounded-md transition"
                  >
                    <Send size={16} />
                  </button>
                </div>
              </div>

            </div>
          ) : (
             <div className="text-center text-red-400">{t("Failed to load definition.", "无法加载定义。")}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WordDetailModal;

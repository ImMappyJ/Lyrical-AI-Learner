
import React from 'react';
import { Note, Language } from '../types';
import { Trash2, Book, MessageCircle } from 'lucide-react';

interface NotesSidebarProps {
  isOpen: boolean;
  notes: Note[];
  onDelete: (id: string) => void;
  onNoteClick: (note: Note) => void;
  language: Language;
}

const NotesSidebar: React.FC<NotesSidebarProps> = ({ isOpen, notes, onDelete, onNoteClick, language }) => {
  
  const t = (en: string, zh: string) => (language === 'zh' ? zh : en);

  return (
    <div 
      className={`fixed top-0 right-0 h-full w-80 bg-gray-900 border-l border-gray-700 shadow-2xl transform transition-transform duration-300 z-40 ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}
    >
      <div className="p-4 h-full flex flex-col">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Book className="text-amber-400" />
          {t("Study Notes", "学习笔记")}
        </h2>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {notes.length === 0 ? (
            <p className="text-gray-500 text-center mt-10">{t("No notes saved yet.", "暂无学习笔记。")}</p>
          ) : (
            notes.map((note) => (
              <div 
                key={note.id} 
                onClick={() => onNoteClick(note)}
                className="bg-gray-800 rounded-lg p-3 border border-gray-700 group cursor-pointer hover:bg-gray-750 hover:border-gray-600 transition relative"
              >
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-amber-400">{note.word}</h3>
                    <span className="text-xs text-blue-300 bg-blue-900/30 px-1 rounded">
                      {note.definitionData.partOfSpeech}
                    </span>
                  </div>
                  <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onDelete(note.id);
                    }}
                    className="text-gray-500 hover:text-red-400 opacity-0 group-hover:opacity-100 transition p-1"
                    title={t("Delete", "删除")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                
                <p className="text-sm text-gray-300 mb-2 line-clamp-2">
                  {note.definitionData.definition}
                </p>
                
                <div className="text-xs text-gray-500 italic bg-gray-900 p-2 rounded mb-2">
                  "{note.contextLine}"
                </div>

                {note.chatHistory.length > 0 && (
                   <div className="flex items-center gap-1 text-xs text-purple-400 mt-2">
                        <MessageCircle size={12} />
                        <span>{note.chatHistory.length} {t("chat messages", "条对话")}</span>
                   </div>
                )}
                
                <div className="text-xs text-gray-600 mt-2 text-right">
                    {new Date(note.timestamp).toLocaleDateString()}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotesSidebar;

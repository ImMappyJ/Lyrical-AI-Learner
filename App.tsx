
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Music, FileText, Menu, Play, Pause, SkipBack, SkipForward, Info, Globe, CheckCircle } from 'lucide-react';
import { parseLRC } from './utils/lrcParser';
import { LyricLine, Note, Language } from './types';
import WordDetailModal from './components/WordDetailModal';
import NotesSidebar from './components/NotesSidebar';

const App: React.FC = () => {
  // App Settings
  const [language, setLanguage] = useState<Language>('zh');

  // State
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [lyrics, setLyrics] = useState<LyricLine[]>([]);
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(0);
  const [duration, setDuration] = useState(0);
  
  // File names for display
  const [audioFileName, setAudioFileName] = useState<string>('');
  const [lrcFileName, setLrcFileName] = useState<string>('');

  // Modal & Sidebar
  const [selectedWordInfo, setSelectedWordInfo] = useState<{ word: string; contextLine: string } | null>(null);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);

  // Toast Notification
  const [toast, setToast] = useState<{ show: boolean; message: string }>({ show: false, message: '' });

  // Refs
  const audioRef = useRef<HTMLAudioElement>(null);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);
  const activeLineRef = useRef<HTMLDivElement>(null);

  // Load notes from local storage
  useEffect(() => {
    const savedNotes = localStorage.getItem('lyric-notes');
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, []);

  const showToastMessage = (msg: string) => {
    setToast({ show: true, message: msg });
    setTimeout(() => setToast({ show: false, message: '' }), 3000);
  };

  const saveNoteToStorage = (newNote: Note) => {
    // Check if updating existing note or creating new
    const existingIndex = notes.findIndex(n => n.id === newNote.id);
    let updatedNotes;
    if (existingIndex >= 0) {
        updatedNotes = [...notes];
        updatedNotes[existingIndex] = newNote;
    } else {
        updatedNotes = [newNote, ...notes];
    }
    setNotes(updatedNotes);
    localStorage.setItem('lyric-notes', JSON.stringify(updatedNotes));
    showToastMessage(language === 'zh' ? '已添加到笔记！' : 'Added to notes!');
    
    // Update selected note so modal reflects saved state
    setSelectedNote(newNote);
  };

  const deleteNote = (id: string) => {
    const updatedNotes = notes.filter(n => n.id !== id);
    setNotes(updatedNotes);
    localStorage.setItem('lyric-notes', JSON.stringify(updatedNotes));
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFileName(file.name);
      const url = URL.createObjectURL(file);
      setAudioSrc(url);
      // Reset lyrics if new audio
      setCurrentTime(0);
      setIsPlaying(false);
    }
  };

  const handleLrcUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLrcFileName(file.name);
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        const parsed = parseLRC(text);
        setLyrics(parsed);
      };
      reader.readAsText(file);
    }
  };

  // Audio Control Logic
  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      const time = audioRef.current.currentTime;
      setCurrentTime(time);

      // Find active lyric line
      const index = lyrics.findIndex((line, i) => {
        const nextLine = lyrics[i + 1];
        return time >= line.time && (!nextLine || time < nextLine.time);
      });

      if (index !== -1 && index !== currentLineIndex) {
        setCurrentLineIndex(index);
      }
    }
  };

  const onLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = Number(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  // Auto-scroll lyrics
  useEffect(() => {
    if (activeLineRef.current && lyricsContainerRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentLineIndex]);

  const handleWordClick = (word: string, contextLine: string) => {
    const cleanWord = word.trim().replace(/[.,!?;:"()]/g, "");
    if (cleanWord.length > 0) {
        if (audioRef.current && isPlaying) {
            audioRef.current.pause();
            setIsPlaying(false);
        }
        setSelectedNote(null); // Reset selected note for fresh lookup
        setSelectedWordInfo({ word: cleanWord, contextLine });
    }
  };

  const handleNoteClick = (note: Note) => {
      if (audioRef.current && isPlaying) {
          audioRef.current.pause();
          setIsPlaying(false);
      }
      setSelectedNote(note);
      setSelectedWordInfo({ word: note.word, contextLine: note.contextLine });
      setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const formatTime = (time: number) => {
    const min = Math.floor(time / 60);
    const sec = Math.floor(time % 60);
    return `${min}:${sec.toString().padStart(2, '0')}`;
  };

  // Translation Helper
  const t = (en: string, zh: string) => (language === 'zh' ? zh : en);

  return (
    <div className="flex h-full w-full flex-col bg-gray-900 text-gray-100 font-sans">
      
      {/* Top Navigation / Upload Area */}
      <header className="flex-none bg-gray-800 border-b border-gray-700 p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="bg-amber-500 p-2 rounded-lg">
            <Music className="text-white" size={24} />
          </div>
          <h1 className="text-xl font-bold tracking-tight hidden sm:block">Lyrical AI Learner</h1>
        </div>

        <div className="flex gap-2 sm:gap-4 items-center">
          <div className="flex bg-gray-700 rounded-lg p-1">
             <button 
               onClick={() => setLanguage('en')}
               className={`px-3 py-1 rounded text-xs font-medium transition ${language === 'en' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
             >
               EN
             </button>
             <button 
               onClick={() => setLanguage('zh')}
               className={`px-3 py-1 rounded text-xs font-medium transition ${language === 'zh' ? 'bg-gray-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}
             >
               中文
             </button>
          </div>

          <div className="relative group hidden sm:block">
             <input type="file" accept="audio/*" onChange={handleAudioUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
             <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition overflow-hidden whitespace-nowrap max-w-[150px]">
                <Upload size={16} /> 
                <span className="truncate">{audioFileName ? audioFileName : t('Upload Audio', '上传音频')}</span>
             </button>
          </div>
          <div className="relative group hidden sm:block">
             <input type="file" accept=".lrc,.txt" onChange={handleLrcUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
             <button className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition overflow-hidden whitespace-nowrap max-w-[150px]">
                <FileText size={16} />
                <span className="truncate">{lrcFileName ? lrcFileName : t('Upload LRC', '上传歌词')}</span>
             </button>
          </div>
          {/* Mobile Upload Icons (Simplified) */}
          <div className="relative group sm:hidden">
             <input type="file" accept="audio/*" onChange={handleAudioUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
             <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition">
                <Upload size={20} /> 
             </button>
          </div>
          <div className="relative group sm:hidden">
             <input type="file" accept=".lrc,.txt" onChange={handleLrcUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
             <button className="p-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm transition">
                <FileText size={20} />
             </button>
          </div>

          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-gray-700 rounded-full transition relative"
          >
            <Menu size={24} />
            {notes.length > 0 && (
                <span className="absolute top-1 right-1 w-3 h-3 bg-amber-500 rounded-full border-2 border-gray-800"></span>
            )}
          </button>
        </div>
      </header>

      {/* Main Content - Lyric View */}
      <main className="flex-1 relative overflow-hidden flex flex-col items-center justify-center">
        {lyrics.length === 0 ? (
          <div className="text-center p-10 border-2 border-dashed border-gray-700 rounded-xl bg-gray-800/50 text-gray-400 max-w-md mx-auto m-4">
            <Info size={48} className="mx-auto mb-4 text-gray-600" />
            <p className="text-lg font-medium">{t("No Lyrics Loaded", "未加载歌词")}</p>
            <p className="text-sm mt-2">{t("Upload an Audio file and an LRC file to start learning.", "请上传音频文件和 LRC 歌词文件以开始学习。")}</p>
          </div>
        ) : (
          <div 
            ref={lyricsContainerRef}
            className="w-full h-full overflow-y-auto px-4 py-[50vh] space-y-6 text-center scroll-smooth"
          >
            {lyrics.map((line, index) => {
              const isActive = index === currentLineIndex;
              return (
                <div 
                  key={index} 
                  ref={isActive ? activeLineRef : null}
                  className={`transition-all duration-300 ease-in-out ${isActive ? 'lyric-active opacity-100 scale-105' : 'text-gray-500 opacity-60 text-lg'}`}
                >
                  {line.words && line.words.length > 0 ? (
                    <div className={`flex flex-wrap justify-center ${line.isJapanese ? 'gap-x-0.5' : 'gap-x-1.5'}`}>
                       {line.words.map((word, wIdx) => (
                          <span 
                            key={wIdx}
                            onClick={() => handleWordClick(word, line.text)}
                            className={`cursor-pointer hover:text-blue-400 hover:underline decoration-blue-400 decoration-2 underline-offset-4 transition-colors rounded px-0.5 ${isActive ? 'hover:bg-white/10' : ''}`}
                          >
                            {word}
                          </span>
                       ))}
                    </div>
                  ) : (
                    <span>{line.text}</span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Bottom Player Controls */}
      <footer className="flex-none bg-gray-800 border-t border-gray-700 p-4 sm:px-8 z-20">
        <audio 
            ref={audioRef} 
            src={audioSrc || undefined} 
            onTimeUpdate={onTimeUpdate}
            onLoadedMetadata={onLoadedMetadata}
            onEnded={() => setIsPlaying(false)}
        />
        
        <div className="max-w-3xl mx-auto w-full flex flex-col gap-2">
            {/* Progress Bar */}
            <div className="flex items-center gap-3 text-xs text-gray-400 font-mono">
                <span>{formatTime(currentTime)}</span>
                <input 
                    type="range" 
                    min={0} 
                    max={duration || 0} 
                    value={currentTime} 
                    onChange={seek}
                    className="flex-1 h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-amber-400 [&::-webkit-slider-thumb]:rounded-full"
                />
                <span>{formatTime(duration)}</span>
            </div>

            {/* Controls */}
            <div className="flex justify-center items-center gap-6 mt-1">
                <button className="text-gray-400 hover:text-white transition">
                    <SkipBack size={20} />
                </button>
                <button 
                    onClick={togglePlay}
                    disabled={!audioSrc}
                    className="w-12 h-12 bg-amber-500 hover:bg-amber-400 rounded-full flex items-center justify-center text-gray-900 transition shadow-lg shadow-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                </button>
                <button className="text-gray-400 hover:text-white transition">
                    <SkipForward size={20} />
                </button>
            </div>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <WordDetailModal 
        word={selectedWordInfo?.word || ''}
        contextLine={selectedWordInfo?.contextLine || ''}
        isOpen={!!selectedWordInfo}
        onClose={() => setSelectedWordInfo(null)}
        onSaveNote={saveNoteToStorage}
        initialData={selectedNote}
        language={language}
      />

      {/* Sidebar Overlay for mobile */}
      {isSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-30"
            onClick={() => setIsSidebarOpen(false)}
          />
      )}
      <NotesSidebar 
        isOpen={isSidebarOpen} 
        notes={notes} 
        onDelete={deleteNote}
        onNoteClick={handleNoteClick}
        language={language}
      />

      {/* Toast Notification */}
      <div 
        className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 bg-green-600 text-white px-4 py-2 rounded-full shadow-xl flex items-center gap-2 transition-all duration-300 ${
          toast.show ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'
        }`}
      >
        <CheckCircle size={18} />
        <span>{toast.message}</span>
      </div>

    </div>
  );
};

export default App;

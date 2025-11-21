
import { LyricLine } from "../types";

export const parseLRC = (lrcContent: string): LyricLine[] => {
  const lines = lrcContent.split('\n');
  const lyrics: LyricLine[] = [];
  
  // Regex to match [mm:ss.xx] or [mm:ss.xxx]
  const timeRegex = /\[(\d{2}):(\d{2})(\.(\d{2,3}))?\]/;

  for (const line of lines) {
    const match = timeRegex.exec(line);
    if (match) {
      const minute = parseInt(match[1], 10);
      const second = parseInt(match[2], 10);
      const millisecond = match[4] ? parseInt(match[4].padEnd(3, '0'), 10) : 0;
      
      const time = minute * 60 + second + millisecond / 1000;
      const text = line.replace(timeRegex, '').trim();

      if (text) {
        let words: string[] = [];
        let isJapanese = false;

        // Detect Japanese: Hiragana (\u3040-\u309F) or Katakana (\u30A0-\u30FF)
        const hasJapanese = /[\u3040-\u309F\u30A0-\u30FF]/.test(text);
        
        // Detect Chinese: CJK Unified Ideographs, but exclude if we detected Kana (since Japanese uses Kanji)
        const hasChineseChars = /[\u4E00-\u9FFF]/.test(text);
        const isChinese = hasChineseChars && !hasJapanese;

        if (hasJapanese) {
           isJapanese = true;
           // Use Intl.Segmenter for Japanese if available
           if (typeof Intl !== 'undefined' && (Intl as any).Segmenter) {
             try {
               const segmenter = new (Intl as any).Segmenter('ja', { granularity: 'word' });
               const segments = segmenter.segment(text);
               words = Array.from(segments)
                  .filter((s: any) => s.isWordLike)
                  .map((s: any) => s.segment);
             } catch (e) {
               console.warn("Intl.Segmenter error", e);
               words = text.split(''); // Fallback
             }
           } else {
             // Fallback for environments without Intl.Segmenter
             words = text.split('');
           }
        } else if (!isChinese) {
           // Latin / English / Other (Space separated)
           // Check if it's mostly Latin/ASCII to be safe, or just default split by space
           words = text.split(/\s+/);
        }
        // If pure Chinese, we keep words empty to treat as a block (or could split by char if desired, 
        // but requirement says 'if non-Chinese then split').

        lyrics.push({ time, text, words, isJapanese });
      }
    }
  }

  return lyrics.sort((a, b) => a.time - b.time);
};

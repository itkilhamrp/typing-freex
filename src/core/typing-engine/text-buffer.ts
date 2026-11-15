import type { CharState, WordState, CharStatus } from './types';

const MAX_EXTRA_CHARS = 20;
export const MAX_ZEN_WORD_LENGTH = 36;

export class TextBuffer {
  private words: WordState[] = [];
  private currentWordIndex: number = 0;
  private currentCharIndex: number = 0;
  private rawTargetText: string = '';
  private isZenMode: boolean = false;

  private runningCorrect: number = 0;
  private runningIncorrect: number = 0;
  private runningExtra: number = 0;
  private runningMissed: number = 0;

  constructor(initialText: string = '', isZenMode: boolean = false, preserveNewlines: boolean = false) {
    this.isZenMode = isZenMode;
    if (initialText || isZenMode) {
      this.loadText(initialText, isZenMode, preserveNewlines);
    }
  }

  setZenMode(isZen: boolean): void {
    this.isZenMode = isZen;
    this.runningCorrect = 0;
    this.runningIncorrect = 0;
    this.runningExtra = 0;
    this.runningMissed = 0;
    if (isZen) {
      this.words = [];
      this.currentWordIndex = 0;
      this.currentCharIndex = 0;
    }
  }

  loadText(text: string, isZenMode: boolean = this.isZenMode, preserveNewlines: boolean = false): void {
    this.isZenMode = isZenMode;
    this.rawTargetText = text.trim();
    this.currentWordIndex = 0;
    this.currentCharIndex = 0;
    this.runningCorrect = 0;
    this.runningIncorrect = 0;
    this.runningExtra = 0;
    this.runningMissed = 0;

    if (this.isZenMode) {
      this.words = [];
      return;
    }

    if (preserveNewlines) {
      const lines = this.rawTargetText.split('\n');
      this.words = [];
      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx] ?? '';
        const rawWords = line.split(/\s+/).filter(Boolean);
        for (const word of rawWords) {
          this.words.push({
            target: word,
            chars: Array.from(word).map((char) => ({
              char,
              status: 'untyped',
            })),
            extraChars: [],
            isCompleted: false,
            hasError: false,
          });
        }
        // Insert newline sentinel word at the end of each line (except the last line)
        if (lineIdx < lines.length - 1) {
          this.words.push({
            target: '\n',
            chars: [{ char: '\n', status: 'untyped' }],
            extraChars: [],
            isCompleted: false,
            hasError: false,
          });
        }
      }
    } else {
      const rawWords = this.rawTargetText.split(/\s+/).filter(Boolean);
      this.words = rawWords.map((word) => ({
        target: word,
        chars: Array.from(word).map((char) => ({
          char,
          status: 'untyped',
        })),
        extraChars: [],
        isCompleted: false,
        hasError: false,
      }));
    }
  }

  getRawTargetText(): string {
    if (this.isZenMode) {
      let result = '';
      for (const w of this.words) {
        if (w.target === '\n') {
          result += '\n';
        } else if (w.target) {
          if (result.length > 0 && !result.endsWith('\n')) {
            result += ' ';
          }
          result += w.target;
        }
      }
      return result;
    }
    return this.rawTargetText;
  }

  getWords(): WordState[] {
    return [...this.words];
  }

  getCurrentWordIndex(): number {
    return this.currentWordIndex;
  }

  getCurrentCharIndex(): number {
    return this.currentCharIndex;
  }

  getCurrentWord(): WordState | undefined {
    return this.words[this.currentWordIndex];
  }

  getCurrentTargetChar(): string | null {
    if (this.isZenMode) return null;
    const word = this.getCurrentWord();
    if (!word) return null;
    if (word.target === '\n') {
      return '\n';
    }
    if (this.currentCharIndex < word.chars.length) {
      return word.chars[this.currentCharIndex]?.char ?? null;
    }
    // Past the target word length -> if next word is newline sentinel, next expected is '\n', else ' '
    const nextWord = this.words[this.currentWordIndex + 1];
    if (nextWord && nextWord.target === '\n') {
      return '\n';
    }
    return ' ';
  }

  isAllCompleted(): boolean {
    if (this.isZenMode) return false;
    if (this.words.length === 0) return true;
    return this.currentWordIndex >= this.words.length;
  }

  /**
   * Returns true when the cursor is on the very last word,
   * all target characters have been typed correctly (status === 'correct'),
   * and there are zero extra characters.
   *
   * Used to auto-finish finite tests without requiring a trailing Space press (§MonkeyType behavior).
   */
  isLastWordFullyCorrect(): boolean {
    if (this.isZenMode) return false;
    if (this.words.length === 0) return false;

    const lastIndex = this.words.length - 1;
    if (this.currentWordIndex !== lastIndex) return false;

    const word = this.words[lastIndex];
    if (!word || word.chars.length === 0 || word.extraChars.length > 0) return false;
    if (this.currentCharIndex !== word.chars.length) return false;

    return word.chars.every((c) => c.status === 'correct');
  }

  /**
   * Completes the last word cleanly by marking it completed
   * and advancing currentWordIndex, mirroring handleSpace behavior
   * without needing an actual Space keystroke.
   */
  completeLastWord(): void {
    if (this.isZenMode || this.words.length === 0) return;
    const lastIndex = this.words.length - 1;
    if (this.currentWordIndex !== lastIndex) return;
    const word = this.words[lastIndex];
    if (!word) return;

    this.words[lastIndex] = {
      ...word,
      isCompleted: true,
    };
    this.currentWordIndex++;
    this.currentCharIndex = 0;
  }

  /**
   * Handles character input into the active word
   */
  inputChar(char: string, timestamp: number): { isCorrect: boolean; isIgnored: boolean } {
    if (this.isZenMode) {
      let word = this.getCurrentWord();
      if (!word) {
        word = {
          target: '',
          chars: [],
          extraChars: [],
          isCompleted: false,
          hasError: false,
        };
        this.words.push(word);
      }
      // Mode Zen: batasi panjang karakter hingga 36 per kata.
      // Setelah 36 karakter, input diabaikan sampai spasi ditekan.
      if (word.chars.length >= MAX_ZEN_WORD_LENGTH) {
        return { isCorrect: false, isIgnored: true };
      }

      const charState: CharState = {
        char,
        status: 'correct',
        typedChar: char,
        timestamp,
      };
      const newChars = [...word.chars, charState];
      this.words[this.currentWordIndex] = {
        ...word,
        target: word.target + char,
        chars: newChars,
      };
      this.currentCharIndex++;
      this.runningCorrect++;
      return { isCorrect: true, isIgnored: false };
    }

    const word = this.getCurrentWord();
    if (!word) {
      return { isCorrect: false, isIgnored: true };
    }

    if (word.target === '\n') {
      return { isCorrect: false, isIgnored: true };
    }

    if (this.currentCharIndex < word.chars.length) {
      const targetCharState = word.chars[this.currentCharIndex];
      if (!targetCharState) return { isCorrect: false, isIgnored: true };

      const isCorrect = char === targetCharState.char;
      const newChars = [...word.chars];
      newChars[this.currentCharIndex] = {
        char: targetCharState.char,
        status: isCorrect ? 'correct' : 'incorrect',
        typedChar: char,
        timestamp,
      };

      if (isCorrect) {
        this.runningCorrect++;
      } else {
        this.runningIncorrect++;
      }

      this.words[this.currentWordIndex] = {
        ...word,
        chars: newChars,
        hasError: word.hasError || !isCorrect,
      };
      this.currentCharIndex++;
      return { isCorrect, isIgnored: false };
    }

    // Extra characters beyond target length
    if (word.extraChars.length < MAX_EXTRA_CHARS) {
      const extraState: CharState = {
        char,
        status: 'extra',
        typedChar: char,
        timestamp,
      };
      const newExtra = [...word.extraChars, extraState];
      this.words[this.currentWordIndex] = {
        ...word,
        extraChars: newExtra,
        hasError: true,
      };
      this.currentCharIndex++;
      this.runningExtra++;
      return { isCorrect: false, isIgnored: false };
    }

    return { isCorrect: false, isIgnored: true };
  }

  /**
   * Handles spacebar press to advance between words (§5.3)
   */
  handleSpace(_timestamp: number, strictSpace: boolean = false): { advanced: boolean; isCorrect: boolean } {
    if (this.isZenMode) {
      const word = this.getCurrentWord();
      // If buffer has no words or current word has 0 characters, ignore space
      if (!word || word.chars.length === 0) {
        return { advanced: false, isCorrect: true };
      }
      this.words[this.currentWordIndex] = { ...word, isCompleted: true };
      this.currentWordIndex++;
      this.currentCharIndex = 0;
      this.words.push({
        target: '',
        chars: [],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      });
      return { advanced: true, isCorrect: true };
    }

    const word = this.getCurrentWord();
    if (!word) {
      return { advanced: false, isCorrect: false };
    }

    // Newline sentinel cannot be skipped with Space
    if (word.target === '\n') {
      return { advanced: false, isCorrect: false };
    }

    // In strictSpace mode: word must be fully typed before space is permitted
    if (strictSpace && this.currentCharIndex < word.chars.length) {
      return { advanced: false, isCorrect: false };
    }

    // If word is incomplete and not strict space: mark remaining chars as missed
    let isCorrectWord = true;
    let charsModified = false;
    const newChars = [...word.chars];
    for (let i = 0; i < newChars.length; i++) {
      const c = newChars[i]!;
      if (c.status === 'untyped') {
        newChars[i] = { ...c, status: 'missed' };
        this.runningMissed++;
        charsModified = true;
        isCorrectWord = false;
      } else if (c.status !== 'correct') {
        isCorrectWord = false;
      }
    }

    if (word.extraChars.length > 0) {
      isCorrectWord = false;
    }

    this.words[this.currentWordIndex] = {
      ...word,
      chars: charsModified ? newChars : word.chars,
      isCompleted: true,
      hasError: word.hasError || !isCorrectWord,
    };
    this.currentWordIndex++;
    this.currentCharIndex = 0;

    return { advanced: true, isCorrect: isCorrectWord };
  }

  /**
   * Handles Enter keypress to advance newlines (§MonkeyType behavior)
   */
  handleEnter(timestamp: number, strictSpace: boolean = false): { advanced: boolean; isCorrect: boolean } {
    if (this.isZenMode) {
      const word = this.getCurrentWord();
      // In Zen mode: if buffer has no words or current word has 0 characters, ignore Enter
      if (!word || word.chars.length === 0) {
        return { advanced: false, isCorrect: true };
      }
      this.words[this.currentWordIndex] = { ...word, isCompleted: true };
      this.words.push(
        {
          target: '\n',
          chars: [{ char: '\n', status: 'correct', timestamp }],
          extraChars: [],
          isCompleted: true,
          hasError: false,
        },
        {
          target: '',
          chars: [],
          extraChars: [],
          isCompleted: false,
          hasError: false,
        }
      );
      this.currentWordIndex += 2;
      this.currentCharIndex = 0;
      return { advanced: true, isCorrect: true };
    }

    const word = this.getCurrentWord();
    if (!word) {
      return { advanced: false, isCorrect: false };
    }

    // Case 1: Cursor is directly on the newline sentinel word
    if (word.target === '\n') {
      const newChars = [{ char: '\n', status: 'correct' as const, typedChar: '\n', timestamp }];
      this.words[this.currentWordIndex] = {
        ...word,
        chars: newChars,
        isCompleted: true,
        hasError: false,
      };
      this.runningCorrect++;
      this.currentWordIndex++;
      this.currentCharIndex = 0;
      return { advanced: true, isCorrect: true };
    }

    // Case 2: Cursor is on the word immediately preceding a newline sentinel
    const nextWord = this.words[this.currentWordIndex + 1];
    if (nextWord && nextWord.target === '\n') {
      // In strictSpace mode: word must be fully typed before enter is permitted
      if (strictSpace && this.currentCharIndex < word.chars.length) {
        return { advanced: false, isCorrect: false };
      }

      // Mark uncompleted chars if any
      let isCorrectWord = true;
      let charsModified = false;
      const newChars = [...word.chars];
      for (let i = 0; i < newChars.length; i++) {
        const c = newChars[i]!;
        if (c.status === 'untyped') {
          newChars[i] = { ...c, status: 'missed' };
          this.runningMissed++;
          charsModified = true;
          isCorrectWord = false;
        } else if (c.status !== 'correct') {
          isCorrectWord = false;
        }
      }

      if (word.extraChars.length > 0) {
        isCorrectWord = false;
      }

      // Complete current word
      this.words[this.currentWordIndex] = {
        ...word,
        chars: charsModified ? newChars : word.chars,
        isCompleted: true,
        hasError: word.hasError || !isCorrectWord,
      };

      // Complete next newline sentinel as correct
      this.words[this.currentWordIndex + 1] = {
        ...nextWord,
        chars: [{ char: '\n', status: 'correct', typedChar: '\n', timestamp }],
        isCompleted: true,
        hasError: false,
      };
      this.runningCorrect++;

      // Advance past both current word and newline sentinel
      this.currentWordIndex += 2;
      this.currentCharIndex = 0;

      return { advanced: true, isCorrect: isCorrectWord };
    }

    // Enter pressed on normal word not preceding newline -> invalid
    return { advanced: false, isCorrect: false };
  }

  /**
   * Handles Backspace keypress
   */
  handleBackspace(backspaceThroughWords: boolean = false): { moved: boolean; deletedStatus?: CharStatus } {
    if (this.isZenMode) {
      const word = this.getCurrentWord();
      if (word && this.currentCharIndex > 0) {
        this.currentCharIndex--;
        const popped = word.chars[word.chars.length - 1];
        const newChars = word.chars.slice(0, -1);
        this.words[this.currentWordIndex] = {
          ...word,
          target: word.target.slice(0, -1),
          chars: newChars,
        };
        if (popped?.status === 'correct') {
          this.runningCorrect = Math.max(0, this.runningCorrect - 1);
        }
        return { moved: true, deletedStatus: popped?.status ?? 'correct' };
      }

      // In Zen mode, always allow backspacing across word boundaries
      if (this.currentCharIndex === 0 && this.currentWordIndex > 0) {
        // If current word is empty (created by space or enter), remove it
        if (word && word.chars.length === 0) {
          this.words.splice(this.currentWordIndex, 1);
        }
        this.currentWordIndex--;
        // If previous word is newline sentinel, remove it as well to step back to previous line
        const prevWord = this.words[this.currentWordIndex];
        if (prevWord && prevWord.target === '\n') {
          this.words.splice(this.currentWordIndex, 1);
          this.currentWordIndex--;
        }
        const targetWord = this.words[this.currentWordIndex];
        if (targetWord) {
          this.words[this.currentWordIndex] = { ...targetWord, isCompleted: false };
          this.currentCharIndex = targetWord.chars.length;
          return { moved: true };
        }
      }

      return { moved: false };
    }

    const word = this.getCurrentWord();

    if (word && this.currentCharIndex > 0) {
      this.currentCharIndex--;

      let deletedStatus: CharStatus = 'untyped';
      if (this.currentCharIndex >= word.chars.length) {
        // We are inside extraChars
        const popped = word.extraChars[word.extraChars.length - 1];
        const newExtra = word.extraChars.slice(0, -1);
        deletedStatus = popped?.status ?? 'extra';
        this.runningExtra = Math.max(0, this.runningExtra - 1);
        const hasError =
          newExtra.length > 0 ||
          word.chars.some((c) => c.status === 'incorrect' || c.status === 'missed');
        this.words[this.currentWordIndex] = {
          ...word,
          extraChars: newExtra,
          hasError,
        };
      } else {
        // We are inside standard chars
        const charState = word.chars[this.currentCharIndex];
        if (charState) {
          deletedStatus = charState.status;
          if (deletedStatus === 'correct') {
            this.runningCorrect = Math.max(0, this.runningCorrect - 1);
          } else if (deletedStatus === 'incorrect') {
            this.runningIncorrect = Math.max(0, this.runningIncorrect - 1);
          } else if (deletedStatus === 'missed') {
            this.runningMissed = Math.max(0, this.runningMissed - 1);
          }
          const newChars = [...word.chars];
          newChars[this.currentCharIndex] = {
            char: charState.char,
            status: 'untyped',
          };
          const hasError =
            word.extraChars.length > 0 ||
            newChars.some((c) => c.status === 'incorrect' || c.status === 'missed');
          this.words[this.currentWordIndex] = {
            ...word,
            chars: newChars,
            hasError,
          };
        }
      }

      return { moved: true, deletedStatus };
    }

    // At the beginning of a word: check if we can jump back to previous word
    if (this.currentCharIndex === 0 && backspaceThroughWords && this.currentWordIndex > 0) {
      this.currentWordIndex--;
      const prevWord = this.words[this.currentWordIndex];
      if (prevWord) {
        if (prevWord.target === '\n') {
          this.words[this.currentWordIndex] = {
            ...prevWord,
            chars: [{ char: '\n', status: 'untyped' }],
            isCompleted: false,
          };
          this.runningCorrect = Math.max(0, this.runningCorrect - 1);
          if (this.currentWordIndex > 0) {
            this.currentWordIndex--;
            const wordBefore = this.words[this.currentWordIndex];
            if (wordBefore) {
              this.words[this.currentWordIndex] = {
                ...wordBefore,
                isCompleted: false,
              };
              this.currentCharIndex = wordBefore.chars.length + wordBefore.extraChars.length;
              return { moved: true };
            }
          }
        } else {
          this.words[this.currentWordIndex] = {
            ...prevWord,
            isCompleted: false,
          };
          this.currentCharIndex = prevWord.chars.length + prevWord.extraChars.length;
          return { moved: true };
        }
      }
    }

    return { moved: false };
  }

  /**
   * Aggregates character counts across all words (O(1) incremental retrieval)
   */
  getCharCounts(): {
    correct: number;
    incorrect: number;
    extra: number;
    missed: number;
    totalTyped: number;
  } {
    const totalTyped = this.runningCorrect + this.runningIncorrect + this.runningExtra;
    return {
      correct: this.runningCorrect,
      incorrect: this.runningIncorrect,
      extra: this.runningExtra,
      missed: this.runningMissed,
      totalTyped,
    };
  }
}

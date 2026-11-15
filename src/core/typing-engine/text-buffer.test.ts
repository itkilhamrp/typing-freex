import { describe, it, expect } from 'vitest';
import { TextBuffer } from './text-buffer';

describe('TextBuffer (§5.3)', () => {
  it('loads text and initializes words with untyped status', () => {
    const buffer = new TextBuffer('hello world');
    expect(buffer.getWords().length).toBe(2);
    expect(buffer.getCurrentTargetChar()).toBe('h');
    expect(buffer.getCurrentWordIndex()).toBe(0);
    expect(buffer.getCurrentCharIndex()).toBe(0);
  });

  it('marks correctly typed characters as correct and advances cursor', () => {
    const buffer = new TextBuffer('hi there');
    const r1 = buffer.inputChar('h', 100);
    expect(r1.isCorrect).toBe(true);
    expect(buffer.getCurrentCharIndex()).toBe(1);
    expect(buffer.getCurrentTargetChar()).toBe('i');

    const r2 = buffer.inputChar('i', 200);
    expect(r2.isCorrect).toBe(true);
    expect(buffer.getCurrentCharIndex()).toBe(2);
    expect(buffer.getCurrentTargetChar()).toBe(' '); // expects space
  });

  it('marks mismatched characters as incorrect and marks word with error', () => {
    const buffer = new TextBuffer('cat');
    const r = buffer.inputChar('x', 100);
    expect(r.isCorrect).toBe(false);
    const word = buffer.getCurrentWord();
    expect(word?.hasError).toBe(true);
    expect(word?.chars[0]?.status).toBe('incorrect');
  });

  it('accumulates extra characters up to cap of 20', () => {
    const buffer = new TextBuffer('a');
    buffer.inputChar('a', 100); // target typed
    for (let i = 0; i < 25; i++) {
      buffer.inputChar('x', 100 + i);
    }
    const word = buffer.getCurrentWord();
    expect(word?.extraChars.length).toBe(20); // capped at 20
  });

  it('advances to next word upon Space in non-strict mode, marking missed characters', () => {
    const buffer = new TextBuffer('hello world');
    buffer.inputChar('h', 100);
    buffer.inputChar('e', 200);
    // Skips 'llo' with space
    const res = buffer.handleSpace(300, false);
    expect(res.advanced).toBe(true);
    expect(buffer.getCurrentWordIndex()).toBe(1);
    expect(buffer.getCurrentCharIndex()).toBe(0);

    const prevWord = buffer.getWords()[0]!;
    expect(prevWord.hasError).toBe(true);
    expect(prevWord.chars[2]?.status).toBe('missed');
    expect(prevWord.chars[3]?.status).toBe('missed');
    expect(prevWord.chars[4]?.status).toBe('missed');
  });

  it('rejects Space in strictSpace mode if word is incomplete', () => {
    const buffer = new TextBuffer('hello world');
    buffer.inputChar('h', 100);
    const res = buffer.handleSpace(200, true);
    expect(res.advanced).toBe(false);
    expect(buffer.getCurrentWordIndex()).toBe(0); // remains on word 0
  });

  it('handles backspace within current word', () => {
    const buffer = new TextBuffer('dog');
    buffer.inputChar('d', 100);
    buffer.inputChar('x', 200); // error
    expect(buffer.getCurrentCharIndex()).toBe(2);

    const b = buffer.handleBackspace(true);
    expect(b.moved).toBe(true);
    expect(buffer.getCurrentCharIndex()).toBe(1);
    expect(buffer.getCurrentWord()?.chars[1]?.status).toBe('untyped');
  });

  it('handles backspace across word boundary when backspaceThroughWords is true', () => {
    const buffer = new TextBuffer('one two');
    buffer.inputChar('o', 100);
    buffer.inputChar('n', 200);
    buffer.inputChar('e', 300);
    buffer.handleSpace(400, false); // now at 'two' (index 1, char 0)

    expect(buffer.getCurrentWordIndex()).toBe(1);
    expect(buffer.getCurrentCharIndex()).toBe(0);

    const b = buffer.handleBackspace(true);
    expect(b.moved).toBe(true);
    expect(buffer.getCurrentWordIndex()).toBe(0);
    expect(buffer.getCurrentCharIndex()).toBe(3); // at end of 'one'
  });

  it('does NOT allow backspacing across word boundary when backspaceThroughWords is false or omitted', () => {
    const buffer = new TextBuffer('one two');
    buffer.inputChar('o', 100);
    buffer.inputChar('n', 200);
    buffer.inputChar('e', 300);
    buffer.handleSpace(400, false); // now at 'two' (index 1, char 0)

    expect(buffer.getCurrentWordIndex()).toBe(1);
    expect(buffer.getCurrentCharIndex()).toBe(0);

    // Default false refuses to cross into previous word
    const b = buffer.handleBackspace();
    expect(b.moved).toBe(false);
    expect(buffer.getCurrentWordIndex()).toBe(1);
    expect(buffer.getCurrentCharIndex()).toBe(0);

    // Typing inside the new word can still be backspaced within that word
    buffer.inputChar('t', 500);
    expect(buffer.getCurrentCharIndex()).toBe(1);
    const b2 = buffer.handleBackspace();
    expect(b2.moved).toBe(true);
    expect(buffer.getCurrentCharIndex()).toBe(0);

    // Backspacing again at 0 still refuses to cross back
    const b3 = buffer.handleBackspace();
    expect(b3.moved).toBe(false);
    expect(buffer.getCurrentWordIndex()).toBe(1);
  });

  it('supports dynamic free typing in Zen mode', () => {
    const buffer = new TextBuffer('', true);
    expect(buffer.getWords().length).toBe(0);
    expect(buffer.isAllCompleted()).toBe(false);

    // Type 'z', 'e', 'n'
    const r1 = buffer.inputChar('z', 100);
    expect(r1.isCorrect).toBe(true);
    expect(buffer.getWords().length).toBe(1);
    expect(buffer.getCurrentWord()?.target).toBe('z');

    buffer.inputChar('e', 200);
    buffer.inputChar('n', 300);
    expect(buffer.getCurrentWord()?.target).toBe('zen');

    // Space advances to next dynamic word
    const spaceRes = buffer.handleSpace(400);
    expect(spaceRes.advanced).toBe(true);
    expect(buffer.getCurrentWordIndex()).toBe(1);
    expect(buffer.getWords().length).toBe(2);

    // Type 'mode'
    buffer.inputChar('m', 500);
    expect(buffer.getCurrentWord()?.target).toBe('m');

    // Backspace works in Zen mode even with backspaceThroughWords = false
    const backRes = buffer.handleBackspace(false);
    expect(backRes.moved).toBe(true);
    expect(buffer.getCurrentWord()?.target).toBe('');

    // Backspace back to previous word even without flag
    const backToPrev = buffer.handleBackspace(false);
    expect(backToPrev.moved).toBe(true);
    expect(buffer.getCurrentWordIndex()).toBe(0);
    expect(buffer.getCurrentWord()?.target).toBe('zen');
    expect(buffer.getRawTargetText()).toBe('zen');
  });

  it('sanitizes spaces in Zen mode (ignores leading and consecutive spaces)', () => {
    const buffer = new TextBuffer('', true);

    // Space on empty buffer does not advance or create empty words
    const s1 = buffer.handleSpace(100);
    expect(s1.advanced).toBe(false);
    expect(buffer.getWords().length).toBe(0);
    expect(buffer.getCurrentWordIndex()).toBe(0);

    // Type a word
    buffer.inputChar('h', 200);
    buffer.inputChar('i', 300);
    expect(buffer.getWords().length).toBe(1);

    // First space advances
    const s2 = buffer.handleSpace(400);
    expect(s2.advanced).toBe(true);
    expect(buffer.getCurrentWordIndex()).toBe(1);
    expect(buffer.getWords().length).toBe(2);

    // Consecutive space on empty new word does not advance
    const s3 = buffer.handleSpace(500);
    expect(s3.advanced).toBe(false);
    expect(buffer.getCurrentWordIndex()).toBe(1);
    expect(buffer.getWords().length).toBe(2);

    // Backspacing cleans up the trailing empty word and lands on previous word
    const b = buffer.handleBackspace(false);
    expect(b.moved).toBe(true);
    expect(buffer.getCurrentWordIndex()).toBe(0);
    expect(buffer.getWords().length).toBe(1);
    expect(buffer.getCurrentWord()?.target).toBe('hi');
  });

  it('limits word length to 36 characters in Zen mode and requires space to continue', () => {
    const buffer = new TextBuffer('', true);

    // Type 36 characters
    for (let i = 0; i < 36; i++) {
      const res = buffer.inputChar('a', 100 + i);
      expect(res.isIgnored).toBe(false);
      expect(res.isCorrect).toBe(true);
    }

    const currentWord = buffer.getCurrentWord();
    expect(currentWord?.chars.length).toBe(36);
    expect(currentWord?.target.length).toBe(36);

    // 37th character without space must be ignored
    const overflow = buffer.inputChar('b', 200);
    expect(overflow.isIgnored).toBe(true);
    expect(currentWord?.chars.length).toBe(36);
    expect(currentWord?.target.length).toBe(36);

    // Press space to advance to next word
    const spaceRes = buffer.handleSpace(300);
    expect(spaceRes.advanced).toBe(true);
    expect(buffer.getCurrentWordIndex()).toBe(1);

    // Can now type again on the new word
    const nextChar = buffer.inputChar('c', 400);
    expect(nextChar.isIgnored).toBe(false);
    expect(nextChar.isCorrect).toBe(true);
    expect(buffer.getCurrentWord()?.target).toBe('c');
  });

  it('maintains exact O(1) incremental character counts on input, space, and backspace', () => {
    const buffer = new TextBuffer('cat dog', false);
    expect(buffer.getCharCounts()).toEqual({
      correct: 0,
      incorrect: 0,
      extra: 0,
      missed: 0,
      totalTyped: 0,
    });

    // Type 'c' (correct)
    buffer.inputChar('c', 100);
    expect(buffer.getCharCounts()).toEqual({
      correct: 1,
      incorrect: 0,
      extra: 0,
      missed: 0,
      totalTyped: 1,
    });

    // Type 'x' (incorrect)
    buffer.inputChar('x', 200);
    expect(buffer.getCharCounts()).toEqual({
      correct: 1,
      incorrect: 1,
      extra: 0,
      missed: 0,
      totalTyped: 2,
    });

    // Backspace 'x'
    buffer.handleBackspace(false);
    expect(buffer.getCharCounts()).toEqual({
      correct: 1,
      incorrect: 0,
      extra: 0,
      missed: 0,
      totalTyped: 1,
    });

    // Type 'a', 't'
    buffer.inputChar('a', 300);
    buffer.inputChar('t', 400);
    // Type extra 's'
    buffer.inputChar('s', 500);
    expect(buffer.getCharCounts()).toEqual({
      correct: 3,
      incorrect: 0,
      extra: 1,
      missed: 0,
      totalTyped: 4,
    });

    // Advance with space
    buffer.handleSpace(600);
    // On word 'dog', skip by pressing space early (marks 3 chars as missed)
    buffer.handleSpace(700);
    expect(buffer.getCharCounts().missed).toBe(3);
  });

  describe('isLastWordFullyCorrect() and completeLastWord() (§MonkeyType auto-finish)', () => {
    it('returns true when last word is fully typed correctly', () => {
      const buffer = new TextBuffer('hi');
      buffer.inputChar('h', 100);
      buffer.inputChar('i', 200);
      expect(buffer.isLastWordFullyCorrect()).toBe(true);
    });

    it('returns false when last word has incorrect characters', () => {
      const buffer = new TextBuffer('hi');
      buffer.inputChar('h', 100);
      buffer.inputChar('x', 200);
      expect(buffer.isLastWordFullyCorrect()).toBe(false);
    });

    it('returns false when last word has extra characters', () => {
      const buffer = new TextBuffer('hi');
      buffer.inputChar('h', 100);
      buffer.inputChar('i', 200);
      buffer.inputChar('s', 300);
      expect(buffer.isLastWordFullyCorrect()).toBe(false);
    });

    it('returns false when not on the last word', () => {
      const buffer = new TextBuffer('hi there');
      buffer.inputChar('h', 100);
      buffer.inputChar('i', 200);
      expect(buffer.isLastWordFullyCorrect()).toBe(false);
    });

    it('returns false in Zen mode', () => {
      const buffer = new TextBuffer('', true);
      buffer.inputChar('h', 100);
      buffer.inputChar('i', 200);
      expect(buffer.isLastWordFullyCorrect()).toBe(false);
    });

    it('completes last word cleanly with completeLastWord()', () => {
      const buffer = new TextBuffer('hello world');
      buffer.inputChar('h', 100);
      buffer.inputChar('e', 110);
      buffer.inputChar('l', 120);
      buffer.inputChar('l', 130);
      buffer.inputChar('o', 140);
      buffer.handleSpace(150);

      expect(buffer.getCurrentWordIndex()).toBe(1);
      buffer.inputChar('w', 200);
      buffer.inputChar('o', 210);
      buffer.inputChar('r', 220);
      buffer.inputChar('l', 230);
      buffer.inputChar('d', 240);
      expect(buffer.isLastWordFullyCorrect()).toBe(true);

      buffer.completeLastWord();
      expect(buffer.getCurrentWordIndex()).toBe(2);
      expect(buffer.getCurrentCharIndex()).toBe(0);
      expect(buffer.isAllCompleted()).toBe(true);
      expect(buffer.getWords()[1]?.isCompleted).toBe(true);
    });
  });

  describe('Newline & Enter Key Handling', () => {
    it('preserves newlines as sentinel words when preserveNewlines is true', () => {
      const buffer = new TextBuffer('FROM python:3.7\nWORKDIR /app', false, true);
      const words = buffer.getWords();
      expect(words.length).toBe(5);
      expect(words[0]?.target).toBe('FROM');
      expect(words[1]?.target).toBe('python:3.7');
      expect(words[2]?.target).toBe('\n');
      expect(words[3]?.target).toBe('WORKDIR');
      expect(words[4]?.target).toBe('/app');
    });

    it('indicates next target char is \\n when at end of word preceding newline', () => {
      const buffer = new TextBuffer('FROM python:3.7\nWORKDIR /app', false, true);
      // Type FROM + space
      for (const ch of 'FROM') buffer.inputChar(ch, 100);
      buffer.handleSpace(150);

      // Type python:3.7
      for (const ch of 'python:3.7') buffer.inputChar(ch, 200);
      expect(buffer.getCurrentTargetChar()).toBe('\n');
    });

    it('advances both current word and newline sentinel when Enter is pressed at end of line', () => {
      const buffer = new TextBuffer('FROM python:3.7\nWORKDIR /app', false, true);
      for (const ch of 'FROM') buffer.inputChar(ch, 100);
      buffer.handleSpace(150);
      for (const ch of 'python:3.7') buffer.inputChar(ch, 200);

      const res = buffer.handleEnter(250);
      expect(res.advanced).toBe(true);
      expect(res.isCorrect).toBe(true);
      expect(buffer.getCurrentWordIndex()).toBe(3); // Now on WORKDIR
      expect(buffer.getCurrentWord()?.target).toBe('WORKDIR');
    });

    it('advances newline sentinel with Enter when preceded by Space', () => {
      const buffer = new TextBuffer('A\nB', false, true);
      buffer.inputChar('A', 100);
      buffer.handleSpace(150); // Now on \n sentinel
      expect(buffer.getCurrentWordIndex()).toBe(1);
      expect(buffer.getCurrentTargetChar()).toBe('\n');

      // Space should NOT advance newline sentinel
      const spaceRes = buffer.handleSpace(160);
      expect(spaceRes.advanced).toBe(false);

      // Enter should advance
      const enterRes = buffer.handleEnter(200);
      expect(enterRes.advanced).toBe(true);
      expect(buffer.getCurrentWordIndex()).toBe(2);
      expect(buffer.getCurrentWord()?.target).toBe('B');
    });

    it('supports free Enter in Zen mode to create newlines', () => {
      const buffer = new TextBuffer('', true);
      for (const ch of 'hello') buffer.inputChar(ch, 100);
      const enterRes = buffer.handleEnter(200);
      expect(enterRes.advanced).toBe(true);
      expect(buffer.getWords().length).toBe(3); // hello, \n, empty word
      expect(buffer.getCurrentWordIndex()).toBe(2);

      for (const ch of 'world') buffer.inputChar(ch, 300);
      expect(buffer.getRawTargetText()).toBe('hello\nworld');
    });

    it('handles backspacing across newline sentinel in Zen mode', () => {
      const buffer = new TextBuffer('', true);
      for (const ch of 'hello') buffer.inputChar(ch, 100);
      buffer.handleEnter(200);
      expect(buffer.getCurrentWordIndex()).toBe(2);

      // Backspace on empty word created after Enter should remove it and the newline
      const bRes = buffer.handleBackspace(true);
      expect(bRes.moved).toBe(true);
      expect(buffer.getCurrentWordIndex()).toBe(0);
      expect(buffer.getCurrentCharIndex()).toBe(5); // back at end of 'hello'
    });

    it('handles backspacing across newline sentinel when backspaceThroughWords is true', () => {
      const buffer = new TextBuffer('hi\nthere', false, true);
      for (const ch of 'hi') buffer.inputChar(ch, 100);
      buffer.handleEnter(150); // now on 'there' (index 2)
      expect(buffer.getCurrentWordIndex()).toBe(2);

      const bRes = buffer.handleBackspace(true);
      expect(bRes.moved).toBe(true);
      expect(buffer.getCurrentWordIndex()).toBe(0);
      expect(buffer.getCurrentCharIndex()).toBe(2); // back at end of 'hi'
    });
  });
});


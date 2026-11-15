import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/svelte';
import WordStream from './WordStream.svelte';
import Caret from './Caret.svelte';
import type { WordState } from '@/core/typing-engine';

describe('Caret (Svelte 5)', () => {
  it('renders with GPU translate3d and default line style', () => {
    const { container } = render(Caret, {
      props: {
        x: 42,
        y: 18,
        width: 2.5,
        height: 28,
        styleType: 'line',
        visible: true,
      },
    });

    const el = container.firstElementChild as HTMLElement;
    expect(el).not.toBeNull();
    expect(el?.getAttribute('style')).toContain('translate3d(42px, 18px, 0)');
    expect(el?.getAttribute('style')).toContain('width: 2.5px');
    expect(el?.getAttribute('style')).toContain('height: 28px');
    expect(el?.classList.contains('caret-pulse')).toBe(true);
  });

  it('does not pulse caret when user is actively typing (isTyping: true)', () => {
    const { container } = render(Caret, {
      props: {
        x: 42,
        y: 18,
        width: 2.5,
        height: 28,
        styleType: 'line',
        visible: true,
        isTyping: true,
      },
    });

    const el = container.firstElementChild as HTMLElement;
    expect(el).not.toBeNull();
    expect(el?.classList.contains('caret-pulse')).toBe(false);
    expect(el?.classList.contains('bg-tt-primary')).toBe(true);
  });

  it('strictly maintains 2.5px width for line style even if larger width is provided', () => {
    const { container } = render(Caret, {
      props: {
        x: 10,
        y: 10,
        width: 14,
        styleType: 'line',
      },
    });
    const el = container.firstElementChild as HTMLElement;
    expect(el?.getAttribute('style')).toContain('width: 2.5px');
  });

  it('renders block, underline, and outline variants properly', () => {
    const { container: blockContainer } = render(Caret, {
      props: {
        x: 10,
        y: 10,
        width: 14,
        styleType: 'block',
      },
    });
    const blockEl = blockContainer.firstElementChild;
    expect(blockEl?.classList.contains('bg-tt-primary/35')).toBe(true);

    const { container: underlineContainer } = render(Caret, {
      props: {
        x: 10,
        y: 10,
        width: 14,
        styleType: 'underline',
      },
    });
    const underlineEl = underlineContainer.firstElementChild;
    expect(underlineEl?.classList.contains('border-b-2')).toBe(true);

    const { container: outlineContainer } = render(Caret, {
      props: {
        x: 10,
        y: 10,
        width: 14,
        styleType: 'outline',
      },
    });
    const outlineEl = outlineContainer.firstElementChild;
    expect(outlineEl?.classList.contains('border-2')).toBe(true);
  });
});

describe('WordStream (Svelte 5)', () => {
  it('displays placeholder in Zen mode when words buffer is empty', () => {
    const { container } = render(WordStream, {
      props: {
        words: [],
        currentWordIndex: 0,
        currentCharIndex: 0,
        mode: 'zen',
      },
    });

    expect(container.textContent).toContain('Start typing freely...');
  });

  it('does not display Zen placeholder when words buffer is empty in non-Zen mode', () => {
    const { container } = render(WordStream, {
      props: {
        words: [],
        currentWordIndex: 0,
        currentCharIndex: 0,
        mode: 'time',
      },
    });

    expect(container.textContent).not.toContain('Start typing freely...');
  });

  it('renders active and untyped characters with correct status classes', () => {
    const mockWords: WordState[] = [
      {
        target: 'hi',
        chars: [
          { char: 'h', status: 'correct' },
          { char: 'i', status: 'untyped' },
        ],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
    ];

    const { container } = render(WordStream, {
      props: {
        words: mockWords,
        currentWordIndex: 0,
        currentCharIndex: 1,
      },
    });

    const charNodes = container.querySelectorAll('.char-node');
    expect(charNodes.length).toBe(2);
    expect(charNodes[0]?.classList.contains('char-correct')).toBe(true);
    expect(charNodes[1]?.classList.contains('char-untyped')).toBe(true);
  });

  it('passes isTyping prop down to Caret component', () => {
    const { container } = render(WordStream, {
      props: {
        words: [],
        currentWordIndex: 0,
        currentCharIndex: 0,
        caretStyle: 'line',
        isTyping: true,
      },
    });

    const pulsingCaret = container.querySelector('.caret-pulse');
    expect(pulsingCaret).toBeNull();
  });

  it('renders ↵ icon for newline sentinel words', () => {
    const mockWords: WordState[] = [
      {
        target: 'echo',
        chars: [{ char: 'e', status: 'correct' }, { char: 'c', status: 'correct' }, { char: 'h', status: 'correct' }, { char: 'o', status: 'correct' }],
        extraChars: [],
        isCompleted: true,
        hasError: false,
      },
      {
        target: '\n',
        chars: [{ char: '\n', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
      {
        target: 'hi',
        chars: [{ char: 'h', status: 'untyped' }, { char: 'i', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
    ];

    const { container } = render(WordStream, {
      props: {
        words: mockWords,
        currentWordIndex: 1,
        currentCharIndex: 0,
      },
    });

    const enterWordContainer = container.querySelector('[data-word-idx="1"]');
    const enterNode = enterWordContainer?.querySelector('.char-node');
    expect(enterWordContainer?.classList.contains('-ml-2')).toBe(true);
    expect(enterNode).not.toBeNull();
    expect(enterNode?.textContent).toBe('↵');
    expect(enterNode?.classList.contains('char-untyped')).toBe(true);
    expect(enterNode?.classList.contains('char-enter')).toBe(true);
  });

  it('omits -ml-2 class for newline sentinel words at line start or on empty lines', () => {
    const mockWords: WordState[] = [
      {
        target: 'echo',
        chars: [{ char: 'e', status: 'correct' }, { char: 'c', status: 'correct' }, { char: 'h', status: 'correct' }, { char: 'o', status: 'correct' }],
        extraChars: [],
        isCompleted: true,
        hasError: false,
      },
      {
        target: '\n',
        chars: [{ char: '\n', status: 'correct' }],
        extraChars: [],
        isCompleted: true,
        hasError: false,
      },
      {
        target: '\n', // Empty line (preceded by another \n)
        chars: [{ char: '\n', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
      {
        target: 'next',
        chars: [{ char: 'n', status: 'untyped' }, { char: 'e', status: 'untyped' }, { char: 'x', status: 'untyped' }, { char: 't', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
    ];

    const { container } = render(WordStream, {
      props: {
        words: mockWords,
        currentWordIndex: 2,
        currentCharIndex: 0,
      },
    });

    const trailingEnter = container.querySelector('[data-word-idx="1"]');
    const emptyLineEnter = container.querySelector('[data-word-idx="2"]');

    expect(trailingEnter?.classList.contains('-ml-2')).toBe(true);
    expect(emptyLineEnter?.classList.contains('-ml-2')).toBe(false);

    const emptyLineNode = emptyLineEnter?.querySelector('.char-node');
    expect(emptyLineNode?.classList.contains('char-enter')).toBe(true);
    expect(emptyLineNode?.textContent).toBe('↵');
  });

  it('renders tape mode with single line nowrap classes when tapeEnabled is true', () => {
    const mockWords: WordState[] = [
      {
        target: 'hello',
        chars: [{ char: 'h', status: 'untyped' }, { char: 'e', status: 'untyped' }, { char: 'l', status: 'untyped' }, { char: 'l', status: 'untyped' }, { char: 'o', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
      {
        target: 'world',
        chars: [{ char: 'w', status: 'untyped' }, { char: 'o', status: 'untyped' }, { char: 'r', status: 'untyped' }, { char: 'l', status: 'untyped' }, { char: 'd', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
    ];

    const { container } = render(WordStream, {
      props: {
        words: mockWords,
        currentWordIndex: 0,
        currentCharIndex: 0,
        tapeEnabled: true,
        tapeMode: 'letter',
        tapeMargin: 50,
      },
    });

    const streamEl = container.querySelector('.flex-nowrap');
    expect(streamEl).not.toBeNull();
    expect(streamEl?.classList.contains('whitespace-nowrap')).toBe(true);

    const wordEl = container.querySelector('[data-word-idx="0"]');
    expect(wordEl?.classList.contains('whitespace-nowrap')).toBe(true);
    expect(wordEl?.classList.contains('flex-nowrap')).toBe(true);
  });

  it('renders a single data-tape-line container when tapeEnabled is true and no newlines exist', () => {
    const mockWords: WordState[] = [
      {
        target: 'alpha',
        chars: [{ char: 'a', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
      {
        target: 'beta',
        chars: [{ char: 'b', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
    ];

    const { container } = render(WordStream, {
      props: {
        words: mockWords,
        currentWordIndex: 0,
        currentCharIndex: 0,
        tapeEnabled: true,
        tapeMode: 'letter',
        tapeMargin: 50,
      },
    });

    const tapeLines = container.querySelectorAll<HTMLElement>('[data-tape-line]');
    expect(tapeLines.length).toBe(1);
    expect(tapeLines[0]?.style.paddingLeft).toBe('50%');
    expect(tapeLines[0]?.style.paddingRight).toBe('50%');
  });

  it('segments words into multiple data-tape-line containers at newline sentinels when tapeEnabled is true', () => {
    const mockWords: WordState[] = [
      {
        target: 'line1',
        chars: [{ char: 'l', status: 'correct' }],
        extraChars: [],
        isCompleted: true,
        hasError: false,
      },
      {
        target: '\n',
        chars: [{ char: '\n', status: 'correct' }],
        extraChars: [],
        isCompleted: true,
        hasError: false,
      },
      {
        target: 'line2a',
        chars: [{ char: 'a', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
      {
        target: 'line2b',
        chars: [{ char: 'b', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
      {
        target: '\n',
        chars: [{ char: '\n', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
      {
        target: 'line3',
        chars: [{ char: 'c', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
    ];

    const { container } = render(WordStream, {
      props: {
        words: mockWords,
        currentWordIndex: 2,
        currentCharIndex: 0,
        tapeEnabled: true,
        tapeMode: 'letter',
        tapeMargin: 40,
      },
    });

    const tapeLines = container.querySelectorAll<HTMLElement>('[data-tape-line]');
    expect(tapeLines.length).toBe(3);

    // Line 0 has word 0 and word 1 ('\n')
    const line0Words = tapeLines[0]?.querySelectorAll('[data-word-idx]');
    expect(line0Words?.length).toBe(2);
    expect(line0Words?.[0]?.getAttribute('data-word-idx')).toBe('0');
    expect(line0Words?.[1]?.getAttribute('data-word-idx')).toBe('1');
    expect(line0Words?.[1]?.querySelector('.char-enter')?.textContent).toBe('↵');

    // Line 1 has words 2, 3, and 4 ('\n')
    const line1Words = tapeLines[1]?.querySelectorAll('[data-word-idx]');
    expect(line1Words?.length).toBe(3);
    expect(line1Words?.[0]?.getAttribute('data-word-idx')).toBe('2');
    expect(line1Words?.[1]?.getAttribute('data-word-idx')).toBe('3');
    expect(line1Words?.[2]?.getAttribute('data-word-idx')).toBe('4');

    // Line 2 has word 5
    const line2Words = tapeLines[2]?.querySelectorAll('[data-word-idx]');
    expect(line2Words?.length).toBe(1);
    expect(line2Words?.[0]?.getAttribute('data-word-idx')).toBe('5');

    // Verify per-line padding honors tapeMargin and symmetric vertical padding (7px top/bottom)
    tapeLines.forEach((lineEl) => {
      expect(lineEl.style.paddingLeft).toBe('40%');
      expect(lineEl.style.paddingRight).toBe('60%');
      expect(lineEl.style.paddingTop).toBe('7px');
      expect(lineEl.style.paddingBottom).toBe('7px');
    });

    // Verify active line isolation (currentWordIndex = 2 is on line 1):
    // Only line 1 has opacity-100 and data-tape-line-active="true", while lines 0 and 2 have opacity-0
    expect(tapeLines[0]?.getAttribute('data-tape-line-active')).toBe('false');
    expect(tapeLines[0]?.classList.contains('opacity-0')).toBe(true);
    expect(tapeLines[1]?.getAttribute('data-tape-line-active')).toBe('true');
    expect(tapeLines[1]?.classList.contains('opacity-100')).toBe(true);
    expect(tapeLines[2]?.getAttribute('data-tape-line-active')).toBe('false');
    expect(tapeLines[2]?.classList.contains('opacity-0')).toBe(true);
  });

  it('does not render data-tape-line containers when tapeEnabled is false (normal mode isolation)', () => {
    const mockWords: WordState[] = [
      {
        target: 'first',
        chars: [{ char: 'f', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
      {
        target: '\n',
        chars: [{ char: '\n', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
      {
        target: 'second',
        chars: [{ char: 's', status: 'untyped' }],
        extraChars: [],
        isCompleted: false,
        hasError: false,
      },
    ];

    const { container } = render(WordStream, {
      props: {
        words: mockWords,
        currentWordIndex: 0,
        currentCharIndex: 0,
        tapeEnabled: false,
      },
    });

    expect(container.querySelectorAll('[data-tape-line]').length).toBe(0);
    // Normal mode still uses basis-full span for line breaks
    expect(container.querySelectorAll('.basis-full').length).toBe(1);
  });
});

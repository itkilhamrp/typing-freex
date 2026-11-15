import { describe, it, expect } from 'vitest';
import { evaluateReactPulse } from './keymap-react';

describe('evaluateReactPulse', () => {
  it('correctly marks matching character as correct', () => {
    const res = evaluateReactPulse({ code: 'KeyA', key: 'a' }, 'a', 'words');
    expect(res).toEqual({
      code: 'KeyA',
      isCorrect: true,
    });
  });

  it('correctly marks mismatched character as incorrect', () => {
    const res = evaluateReactPulse({ code: 'KeyB', key: 'b' }, 'a', 'words');
    expect(res).toEqual({
      code: 'KeyB',
      isCorrect: false,
    });
  });

  it('correctly handles Enter key for newline character', () => {
    const correctRes = evaluateReactPulse({ code: 'Enter', key: 'Enter' }, '\n', 'custom');
    expect(correctRes).toEqual({
      code: 'Enter',
      isCorrect: true,
    });

    const incorrectRes = evaluateReactPulse({ code: 'KeyA', key: 'a' }, '\n', 'custom');
    expect(incorrectRes).toEqual({
      code: 'KeyA',
      isCorrect: false,
    });
  });

  it('always marks keypress as correct in zen mode', () => {
    const res = evaluateReactPulse({ code: 'KeyZ', key: 'z' }, 'a', 'zen');
    expect(res).toEqual({
      code: 'KeyZ',
      isCorrect: true,
    });
  });

  it('marks keypress as correct if expected character is null', () => {
    const res = evaluateReactPulse({ code: 'KeyX', key: 'x' }, null, 'words');
    expect(res).toEqual({
      code: 'KeyX',
      isCorrect: true,
    });
  });
});


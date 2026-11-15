import { describe, it, expect } from 'vitest';
import { EngineStateMachine } from './state-machine';

describe('EngineStateMachine (§5.6)', () => {
  it('follows nominal test lifecycle: Idle -> Preparing -> Ready -> Running -> Finishing -> Finished -> Saving -> Result', () => {
    const sm = new EngineStateMachine();
    expect(sm.getState()).toBe('Idle');

    expect(sm.transition('LOAD_TEST')).toBe(true);
    expect(sm.getState()).toBe('Preparing');

    expect(sm.transition('TEXT_READY')).toBe(true);
    expect(sm.getState()).toBe('Ready');

    expect(sm.transition('FIRST_KEYSTROKE')).toBe(true);
    expect(sm.getState()).toBe('Running');

    expect(sm.transition('TARGET_REACHED')).toBe(true);
    expect(sm.getState()).toBe('Finishing');

    expect(sm.transition('METRICS_FROZEN')).toBe(true);
    expect(sm.getState()).toBe('Finished');

    expect(sm.transition('AUTO_SAVE')).toBe(true);
    expect(sm.getState()).toBe('Saving');

    expect(sm.transition('SAVE_OK')).toBe(true);
    expect(sm.getState()).toBe('Result');
  });

  it('handles pause/suspend and resume on focus change', () => {
    const sm = new EngineStateMachine();
    sm.transition('LOAD_TEST');
    sm.transition('TEXT_READY');
    sm.transition('FIRST_KEYSTROKE');
    expect(sm.getState()).toBe('Running');

    // Focus lost -> Suspended
    expect(sm.transition('FOCUS_LOST_SUSPEND', 1000)).toBe(true);
    expect(sm.getState()).toBe('Suspended');

    // Focus regained -> Running
    expect(sm.transition('FOCUS_GAINED')).toBe(true);
    expect(sm.getState()).toBe('Running');
  });

  it('triggers suspend timeout abort after 10s inactivity in Suspended state', () => {
    const sm = new EngineStateMachine(10000);
    sm.transition('LOAD_TEST');
    sm.transition('TEXT_READY');
    sm.transition('FIRST_KEYSTROKE');
    sm.transition('FOCUS_LOST_SUSPEND', 1000);

    // After 5s -> still suspended
    expect(sm.checkSuspendTimeout(6000)).toBe(false);
    expect(sm.getState()).toBe('Suspended');

    // After 10.1s -> aborts
    expect(sm.checkSuspendTimeout(11001)).toBe(true);
    expect(sm.getState()).toBe('Aborted');
  });

  it('rejects invalid state transitions', () => {
    const sm = new EngineStateMachine();
    // Cannot start typing from Idle without loading text
    expect(sm.transition('FIRST_KEYSTROKE')).toBe(false);
    expect(sm.getState()).toBe('Idle');
  });

  it('END_ZEN transitions to Finishing from Running state', () => {
    const sm = new EngineStateMachine();
    sm.transition('LOAD_TEST');
    sm.transition('TEXT_READY');
    sm.transition('FIRST_KEYSTROKE');
    expect(sm.getState()).toBe('Running');

    expect(sm.transition('END_ZEN')).toBe(true);
    expect(sm.getState()).toBe('Finishing');
  });

  it('END_ZEN transitions to Finishing from Suspended state', () => {
    const sm = new EngineStateMachine();
    sm.transition('LOAD_TEST');
    sm.transition('TEXT_READY');
    sm.transition('FIRST_KEYSTROKE');
    sm.transition('FOCUS_LOST_SUSPEND', 1000);
    expect(sm.getState()).toBe('Suspended');

    expect(sm.transition('END_ZEN')).toBe(true);
    expect(sm.getState()).toBe('Finishing');
  });

  it('END_ZEN transitions to Finishing from Ready state', () => {
    const sm = new EngineStateMachine();
    sm.transition('LOAD_TEST');
    sm.transition('TEXT_READY');
    expect(sm.getState()).toBe('Ready');

    expect(sm.transition('END_ZEN')).toBe(true);
    expect(sm.getState()).toBe('Finishing');
  });
});

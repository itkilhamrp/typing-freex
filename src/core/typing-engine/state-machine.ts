import type { EngineState } from './types';

export type StateTransitionEvent =
  | 'LOAD_TEST'
  | 'TEXT_READY'
  | 'LOAD_FAILED'
  | 'FIRST_KEYSTROKE'
  | 'FOCUS_LOST_SUSPEND'
  | 'FOCUS_LOST_ABORT'
  | 'FOCUS_GAINED'
  | 'SUSPEND_TIMEOUT'
  | 'TARGET_REACHED'
  | 'TIME_ELAPSED'
  | 'END_ZEN'
  | 'METRICS_FROZEN'
  | 'AUTO_SAVE'
  | 'SAVE_OK'
  | 'SAVE_FAILED'
  | 'RESTART'
  | 'ABORT';

export class EngineStateMachine {
  private currentState: EngineState = 'Idle';
  private suspendTimestamp: number | null = null;
  private readonly suspendTimeoutMs: number;

  constructor(suspendTimeoutMs: number = 10000) {
    this.suspendTimeoutMs = suspendTimeoutMs;
  }

  getState(): EngineState {
    return this.currentState;
  }

  canTransition(event: StateTransitionEvent): boolean {
    switch (this.currentState) {
      case 'Idle':
        return event === 'LOAD_TEST';

      case 'Preparing':
        return event === 'TEXT_READY' || event === 'LOAD_FAILED' || event === 'ABORT';

      case 'Ready':
        return (
          event === 'FIRST_KEYSTROKE' ||
          event === 'ABORT' ||
          event === 'RESTART' ||
          event === 'LOAD_TEST' ||
          event === 'END_ZEN'
        );

      case 'Running':
        return (
          event === 'TARGET_REACHED' ||
          event === 'TIME_ELAPSED' ||
          event === 'END_ZEN' ||
          event === 'FOCUS_LOST_SUSPEND' ||
          event === 'FOCUS_LOST_ABORT' ||
          event === 'ABORT' ||
          event === 'RESTART'
        );

      case 'Suspended':
        return (
          event === 'FOCUS_GAINED' ||
          event === 'SUSPEND_TIMEOUT' ||
          event === 'ABORT' ||
          event === 'RESTART' ||
          event === 'END_ZEN'
        );

      case 'Finishing':
        return event === 'METRICS_FROZEN';

      case 'Finished':
        return event === 'AUTO_SAVE' || event === 'RESTART';

      case 'Saving':
        return event === 'SAVE_OK' || event === 'SAVE_FAILED';

      case 'Result':
        return event === 'RESTART' || event === 'LOAD_TEST';

      case 'Aborted':
        return event === 'RESTART' || event === 'LOAD_TEST';

      default:
        return false;
    }
  }

  transition(event: StateTransitionEvent, timestamp?: number): boolean {
    if (!this.canTransition(event)) {
      return false;
    }

    switch (this.currentState) {
      case 'Idle':
        if (event === 'LOAD_TEST') this.currentState = 'Preparing';
        break;

      case 'Preparing':
        if (event === 'TEXT_READY') this.currentState = 'Ready';
        else if (event === 'LOAD_FAILED' || event === 'ABORT') this.currentState = 'Idle';
        break;

      case 'Ready':
        if (event === 'FIRST_KEYSTROKE') this.currentState = 'Running';
        else if (event === 'END_ZEN') this.currentState = 'Finishing';
        else if (event === 'ABORT') this.currentState = 'Aborted';
        else if (event === 'RESTART' || event === 'LOAD_TEST') this.currentState = 'Preparing';
        break;

      case 'Running':
        if (event === 'TARGET_REACHED' || event === 'TIME_ELAPSED' || event === 'END_ZEN') {
          this.currentState = 'Finishing';
        } else if (event === 'FOCUS_LOST_SUSPEND') {
          this.currentState = 'Suspended';
          this.suspendTimestamp = timestamp ?? Date.now();
        } else if (event === 'FOCUS_LOST_ABORT' || event === 'ABORT') {
          this.currentState = 'Aborted';
        } else if (event === 'RESTART') {
          this.currentState = 'Preparing';
        }
        break;

      case 'Suspended':
        if (event === 'FOCUS_GAINED') {
          this.currentState = 'Running';
          this.suspendTimestamp = null;
        } else if (event === 'END_ZEN') {
          this.currentState = 'Finishing';
          this.suspendTimestamp = null;
        } else if (event === 'SUSPEND_TIMEOUT' || event === 'ABORT') {
          this.currentState = 'Aborted';
          this.suspendTimestamp = null;
        } else if (event === 'RESTART') {
          this.currentState = 'Preparing';
          this.suspendTimestamp = null;
        }
        break;

      case 'Finishing':
        if (event === 'METRICS_FROZEN') this.currentState = 'Finished';
        break;

      case 'Finished':
        if (event === 'AUTO_SAVE') this.currentState = 'Saving';
        else if (event === 'RESTART') this.currentState = 'Preparing';
        break;

      case 'Saving':
        if (event === 'SAVE_OK' || event === 'SAVE_FAILED') this.currentState = 'Result';
        break;

      case 'Result':
      case 'Aborted':
        if (event === 'RESTART' || event === 'LOAD_TEST') this.currentState = 'Preparing';
        break;
    }

    return true;
  }

  checkSuspendTimeout(currentTimestamp: number): boolean {
    if (
      this.currentState === 'Suspended' &&
      this.suspendTimestamp !== null &&
      currentTimestamp - this.suspendTimestamp >= this.suspendTimeoutMs
    ) {
      this.transition('SUSPEND_TIMEOUT');
      return true;
    }
    return false;
  }
}

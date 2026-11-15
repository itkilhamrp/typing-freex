/**
 * Typed Minimal Event Bus (§2.3, AD-01)
 * Clean pub/sub event bus for loose coupling across domain modules.
 */

export type EventHandler<T = unknown> = (data: T) => void;

export interface SystemEvents {
  [key: string]: unknown;
  'engine:state_changed': { state: string; revision: number };
  'engine:finished': { wpm: number; accuracy: number };
  'profile:switched': { profileId: string };
  'settings:updated': { key: string; value: unknown };
  'window:focus': void;
  'window:blur': void;
}

export class EventBus<Events extends Record<string, unknown> = SystemEvents> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handlers = new Map<string, Set<(data: any) => void>>();

  on<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void;
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  on(event: string, handler: (data: any) => void): () => void {
    if (!this.handlers.has(event)) {
      this.handlers.set(event, new Set());
    }
    const set = this.handlers.get(event)!;
    set.add(handler);
    return () => {
      set.delete(handler);
      if (set.size === 0) {
        this.handlers.delete(event);
      }
    };
  }

  once<K extends keyof Events>(event: K, handler: EventHandler<Events[K]>): () => void;
  once<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  once(event: string, handler: (data: any) => void): () => void {
    const unsubscribe = this.on(event, (data) => {
      unsubscribe();
      handler(data);
    });
    return unsubscribe;
  }

  emit<K extends keyof Events>(event: K, data: Events[K]): void;
  emit<T = unknown>(event: string, data?: T): void;
  emit(event: string, data?: unknown): void {
    const set = this.handlers.get(event);
    if (set) {
      const listeners = Array.from(set);
      for (const listener of listeners) {
        try {
          listener(data);
        } catch (err) {
          console.error(`Error in event listener for '${event}':`, err);
        }
      }
    }
  }

  listenerCount(event: string): number {
    return this.handlers.get(event)?.size ?? 0;
  }

  clear(): void {
    this.handlers.clear();
  }
}

export const eventBus = new EventBus();

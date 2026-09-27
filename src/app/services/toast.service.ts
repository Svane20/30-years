import { DestroyRef, inject, Injectable, signal } from '@angular/core';

export interface Toast {
  kind: 'success' | 'error';
  title: string;
  message: string;
}

export const TOAST_DURATION_MS = 6000;

/** One notification at a time; a new one replaces the current one and restarts the timer. */
@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly state = signal<Toast | null>(null);
  private timerId: ReturnType<typeof setTimeout> | null = null;

  public readonly current = this.state.asReadonly();

  constructor() {
    inject(DestroyRef).onDestroy(() => this.clearTimer());
  }

  public show(toast: Toast): void {
    this.clearTimer();
    this.state.set(toast);
    this.timerId = setTimeout(() => this.dismiss(), TOAST_DURATION_MS);
  }

  public dismiss(): void {
    this.clearTimer();
    this.state.set(null);
  }

  private clearTimer(): void {
    if (this.timerId !== null) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }
}

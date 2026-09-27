import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { invitation } from '../invitation.config';

export interface Remaining {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** True from midnight on the party date. */
  isToday: boolean;
}

const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

export function computeRemaining(now: Date, target: Date): Remaining {
  const startOfTargetDay = new Date(target.getFullYear(), target.getMonth(), target.getDate());
  const ms = Math.max(0, target.getTime() - now.getTime());

  return {
    days: Math.floor(ms / DAY),
    hours: Math.floor((ms % DAY) / HOUR),
    minutes: Math.floor((ms % HOUR) / MINUTE),
    seconds: Math.floor((ms % MINUTE) / SECOND),
    isToday: now.getTime() >= startOfTargetDay.getTime(),
  };
}

@Injectable({ providedIn: 'root' })
export class CountdownService {
  private readonly target = invitation.date;
  private readonly state = signal<Remaining>(computeRemaining(new Date(), this.target));

  public readonly remaining = this.state.asReadonly();

  constructor() {
    const intervalId = setInterval(() => this.state.set(computeRemaining(new Date(), this.target)), SECOND);
    inject(DestroyRef).onDestroy(() => clearInterval(intervalId));
  }
}

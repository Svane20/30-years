import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { invitation } from '../../invitation.config';
import { Slide } from '../../invitation.model';

export const SLIDE_INTERVAL_MS = 5000;
const TAP_MAX_PX = 10;
const SWIPE_MIN_PX = 40;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

@Component({
  selector: 'app-hero',
  styleUrl: './hero.scss',
  templateUrl: './hero.html',
})
export class Hero {
  protected readonly invitation = invitation;
  /** Polaroid slots in on-screen order: left, right, bottom centre. */
  protected readonly roles: (keyof Slide)[] = ['kasper', 'mette', 'together'];

  private readonly document = inject(DOCUMENT);
  private readonly reducedMotion = prefersReducedMotion();
  private timerId: ReturnType<typeof setInterval> | null = null;
  private pointerStartX: number | null = null;

  /** Index of the slide on screen. */
  public readonly current = signal(0);

  constructor() {
    const onVisibilityChange = () => (this.document.hidden ? this.stopTimer() : this.startTimer());
    this.document.addEventListener('visibilitychange', onVisibilityChange);

    inject(DestroyRef).onDestroy(() => {
      this.stopTimer();
      this.document.removeEventListener('visibilitychange', onVisibilityChange);
    });

    this.startTimer();
  }

  public next(): void {
    this.current.update(index => (index + 1) % invitation.slides.length);
  }

  public onPointerDown(event: PointerEvent): void {
    this.pointerStartX = event.clientX;
  }

  /** The browser took over the gesture (e.g. a vertical scroll), so it is neither a tap nor a swipe. */
  public onPointerCancel(): void {
    this.pointerStartX = null;
  }

  public onPointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) {
      return;
    }

    const distance = Math.abs(event.clientX - this.pointerStartX);
    this.pointerStartX = null;

    if (distance < TAP_MAX_PX || distance >= SWIPE_MIN_PX) {
      this.next();
      this.stopTimer();
      this.startTimer();
    }
  }

  private startTimer(): void {
    if (this.reducedMotion || this.timerId !== null || this.document.hidden) {
      return;
    }

    this.timerId = setInterval(() => this.next(), SLIDE_INTERVAL_MS);
  }

  private stopTimer(): void {
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }
}

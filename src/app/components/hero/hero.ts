import { DOCUMENT } from '@angular/common';
import { Component, DestroyRef, inject, signal } from '@angular/core';
import { invitation } from '../../invitation.config';
import { Photo, Slide } from '../../invitation.model';
import { Lightbox } from '../lightbox/lightbox';

export const SLIDE_INTERVAL_MS = 5000;
const TAP_MAX_PX = 10;
const SWIPE_MIN_PX = 40;

function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

@Component({
  imports: [Lightbox],
  selector: 'app-hero',
  styleUrl: './hero.scss',
  templateUrl: './hero.html',
})
export class Hero {
  protected readonly invitation = invitation;
  /** Polaroid slots in on-screen order: left, right, bottom centre. */
  protected readonly slots = [0, 1, 2];

  private readonly document = inject(DOCUMENT);
  private readonly reducedMotion = prefersReducedMotion();
  private timerId: ReturnType<typeof setInterval> | null = null;
  private pointerStartX: number | null = null;
  /** True when the last gesture moved the pointer, so the click that follows it must not open a photo. */
  private suppressClick = false;
  private openedFrom: HTMLElement | null = null;

  /** Index of the slide on screen. */
  public readonly current = signal(0);
  /** Every photo, slide by slide, in on-screen order: the lightbox steps through these. */
  protected readonly photos: Photo[] = invitation.slides.flatMap((slide, i) => this.slots.map(slot => slide[this.roleFor(slot, i)]));
  /** Index into `photos` shown full screen, or null when the lightbox is closed. */
  public readonly openIndex = signal<number | null>(null);

  constructor() {
    const onVisibilityChange = () => (this.document.hidden || this.openIndex() !== null ? this.stopTimer() : this.startTimer());
    this.document.addEventListener('visibilitychange', onVisibilityChange);

    inject(DestroyRef).onDestroy(() => {
      this.stopTimer();
      this.document.removeEventListener('visibilitychange', onVisibilityChange);
    });

    this.startTimer();
  }

  /** Who is in a slot on a given slide: Kasper and Mette swap sides every other slide; together stays at the bottom. */
  protected roleFor(slot: number, slideIndex: number): keyof Slide {
    const sides: (keyof Slide)[] = slideIndex % 2 === 0 ? ['kasper', 'mette'] : ['mette', 'kasper'];
    return slot < 2 ? sides[slot] : 'together';
  }

  /** The photo in a slot on the slide currently on screen. */
  protected photoAt(slot: number): Photo {
    const index = this.current();
    return invitation.slides[index][this.roleFor(slot, index)];
  }

  /** Tapping (or pressing Enter on) a polaroid opens its current photo full screen. */
  public open(slot: number, event: Event): void {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }

    this.openedFrom = event.currentTarget as HTMLElement;
    this.openIndex.set(this.current() * this.slots.length + slot);
    this.stopTimer();
  }

  public close(): void {
    this.openIndex.set(null);
    this.openedFrom?.focus();
    this.openedFrom = null;
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
    this.suppressClick = distance >= TAP_MAX_PX;

    // Only a swipe changes the slide: taps are left for the polaroids, so tapping never looks like "next photo".
    if (distance >= SWIPE_MIN_PX) {
      this.next();
      this.stopTimer();
      this.startTimer();
    }
  }

  private startTimer(): void {
    if (this.reducedMotion || this.timerId !== null || this.document.hidden || this.openIndex() !== null) {
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

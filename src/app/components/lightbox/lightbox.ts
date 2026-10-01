import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  HostListener,
  inject,
  input,
  linkedSignal,
  output,
  viewChild,
} from '@angular/core';
import { Photo } from '../../invitation.model';

const TAP_MAX_PX = 10;
const SWIPE_MIN_PX = 40;

/**
 * Full-screen view of a list of photos, opened at `start`. Steps with the arrow buttons, ← / →, or a swipe,
 * wrapping at both ends. Closes from the × button, a tap on the dark background, or Escape.
 */
@Component({
  selector: 'app-lightbox',
  styleUrl: './lightbox.scss',
  templateUrl: './lightbox.html',
})
export class Lightbox {
  public readonly photos = input.required<Photo[]>();
  public readonly start = input(0);
  public readonly closed = output<void>();

  /** Index of the photo on screen. */
  protected readonly index = linkedSignal(() => this.start());
  protected readonly photo = computed(() => this.photos()[this.index()]);

  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');
  private pointerStartX: number | null = null;
  /** True when the last gesture moved the pointer, so the click that follows it must not close. */
  private suppressClick = false;

  constructor() {
    const body = inject(DOCUMENT).body;
    const previousOverflow = body.style.overflow;
    body.style.overflow = 'hidden';
    inject(DestroyRef).onDestroy(() => (body.style.overflow = previousOverflow));

    afterNextRender(() => this.closeButton().nativeElement.focus());
  }

  @HostListener('document:keydown.escape')
  public close(): void {
    this.closed.emit();
  }

  @HostListener('document:keydown.arrowright')
  public next(): void {
    this.step(1);
  }

  @HostListener('document:keydown.arrowleft')
  public previous(): void {
    this.step(-1);
  }

  public onPointerDown(event: PointerEvent): void {
    this.pointerStartX = event.clientX;
  }

  /** The browser took over the gesture (e.g. a pinch zoom), so it is neither a tap nor a swipe. */
  public onPointerCancel(): void {
    this.pointerStartX = null;
  }

  /** A swipe left shows the next photo, a swipe right the previous one. */
  public onPointerUp(event: PointerEvent): void {
    if (this.pointerStartX === null) {
      return;
    }

    const moved = event.clientX - this.pointerStartX;
    this.pointerStartX = null;
    this.suppressClick = Math.abs(moved) >= TAP_MAX_PX;

    if (Math.abs(moved) >= SWIPE_MIN_PX) {
      this.step(moved < 0 ? 1 : -1);
    }
  }

  /** Only a tap on the backdrop itself closes; clicks on the photo or the buttons bubble up with a different target. */
  public onBackdropClick(event: MouseEvent): void {
    if (this.suppressClick) {
      this.suppressClick = false;
      return;
    }

    if (event.target === event.currentTarget) {
      this.close();
    }
  }

  private step(by: number): void {
    const count = this.photos().length;
    this.index.update(index => (index + by + count) % count);
  }
}

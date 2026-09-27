import { DOCUMENT } from '@angular/common';
import { afterNextRender, Component, DestroyRef, ElementRef, HostListener, inject, input, output, viewChild } from '@angular/core';
import { Photo } from '../../invitation.model';

/** Full-screen view of one photo. Closes from the × button, a click on the dark background, or Escape. */
@Component({
  selector: 'app-lightbox',
  styleUrl: './lightbox.scss',
  templateUrl: './lightbox.html',
})
export class Lightbox {
  public readonly photo = input.required<Photo>();
  public readonly closed = output<void>();

  private readonly closeButton = viewChild.required<ElementRef<HTMLButtonElement>>('closeButton');

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

  /** Only a click on the backdrop itself closes; clicks on the photo bubble up with a different target. */
  public onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}

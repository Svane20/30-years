import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Photo } from '../../invitation.model';
import { Lightbox } from './lightbox';

const photo: Photo = { src: 'assets/images/photos/a.jpg', full: 'assets/images/photos/a-full.jpg', alt: 'Kasper på Mont Ventoux' };

describe('Lightbox', () => {
  let fixture: ComponentFixture<Lightbox>;
  let el: HTMLElement;
  let closed: ReturnType<typeof vi.fn<() => void>>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(Lightbox);
    fixture.componentRef.setInput('photo', photo);
    closed = vi.fn<() => void>();
    fixture.componentInstance.closed.subscribe(() => closed());
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement;
  });

  afterEach(() => (document.body.style.overflow = ''));

  it('shows the full-size photo in a modal dialog labelled by its alt text', () => {
    const dialog = el.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe(photo.alt);
    const img = dialog.querySelector('img')!;
    expect(img.getAttribute('src')).toBe(photo.full);
    expect(img.getAttribute('alt')).toBe(photo.alt);
  });

  it('closes from the close button', () => {
    const button = el.querySelector<HTMLButtonElement>('button.lightbox__close')!;
    expect(button.getAttribute('aria-label')).toBe('Luk');
    button.click();
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('closes when the dark background outside the photo is clicked', () => {
    el.querySelector<HTMLElement>('.lightbox')!.click();
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('stays open when the photo itself is clicked', () => {
    el.querySelector<HTMLElement>('.lightbox img')!.click();
    expect(closed).not.toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('moves focus to the close button when it opens', () => {
    expect(document.activeElement).toBe(el.querySelector('button.lightbox__close'));
  });

  it('stops the page behind from scrolling while open, and restores it on close', () => {
    expect(document.body.style.overflow).toBe('hidden');
    fixture.destroy();
    expect(document.body.style.overflow).toBe('');
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Photo } from '../../invitation.model';
import { Lightbox } from './lightbox';

const photos: Photo[] = [
  { src: 'assets/images/photos/a.jpg', full: 'assets/images/photos/a-full.jpg', alt: 'Kasper på Mont Ventoux' },
  { src: 'assets/images/photos/b.jpg', full: 'assets/images/photos/b-full.jpg', alt: 'Mette som barn' },
  { src: 'assets/images/photos/c.jpg', full: 'assets/images/photos/c-full.jpg', alt: 'Kasper og Mette ved søen' },
];

describe('Lightbox', () => {
  let fixture: ComponentFixture<Lightbox>;
  let el: HTMLElement;
  let closed: ReturnType<typeof vi.fn<() => void>>;

  const img = () => el.querySelector<HTMLImageElement>('.lightbox img')!;
  const backdrop = () => el.querySelector<HTMLElement>('.lightbox')!;
  const counter = () => el.querySelector('.lightbox__counter')!.textContent!.trim();

  async function create(start = 1): Promise<void> {
    fixture?.destroy();
    fixture = TestBed.createComponent(Lightbox);
    fixture.componentRef.setInput('photos', photos);
    fixture.componentRef.setInput('start', start);
    closed = vi.fn<() => void>();
    fixture.componentInstance.closed.subscribe(() => closed());
    fixture.detectChanges();
    await fixture.whenStable();
    el = fixture.nativeElement;
  }

  function key(name: string): void {
    document.dispatchEvent(new KeyboardEvent('keydown', { key: name, bubbles: true }));
    fixture.detectChanges();
  }

  function click(selector: string): void {
    el.querySelector<HTMLElement>(selector)!.click();
    fixture.detectChanges();
  }

  /** A pointer gesture on the photo from x=200 to x=200+moveBy, followed by the click the browser sends after it. */
  function swipe(moveBy: number, target: HTMLElement = img()): void {
    target.dispatchEvent(new PointerEvent('pointerdown', { clientX: 200, bubbles: true }));
    target.dispatchEvent(new PointerEvent('pointerup', { clientX: 200 + moveBy, bubbles: true }));
    target.click();
    fixture.detectChanges();
  }

  beforeEach(() => create());

  afterEach(() => (document.body.style.overflow = ''));

  it('shows the start photo full size in a modal dialog labelled by its alt text', () => {
    const dialog = el.querySelector('[role="dialog"]')!;
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe(photos[1].alt);
    expect(img().getAttribute('src')).toBe(photos[1].full);
    expect(img().getAttribute('alt')).toBe(photos[1].alt);
  });

  it('shows which photo is open out of how many', () => {
    expect(counter()).toBe('2 / 3');
  });

  it('labels the arrow buttons', () => {
    expect(el.querySelector('button.lightbox__prev')!.getAttribute('aria-label')).toBe('Forrige billede');
    expect(el.querySelector('button.lightbox__next')!.getAttribute('aria-label')).toBe('Næste billede');
  });

  it('goes to the next and previous photo with the arrow buttons', () => {
    click('button.lightbox__next');
    expect(img().getAttribute('src')).toBe(photos[2].full);
    expect(counter()).toBe('3 / 3');

    click('button.lightbox__prev');
    click('button.lightbox__prev');
    expect(img().getAttribute('src')).toBe(photos[0].full);
    expect(el.querySelector('[role="dialog"]')!.getAttribute('aria-label')).toBe(photos[0].alt);
    expect(closed).not.toHaveBeenCalled();
  });

  it('goes to the next and previous photo with the arrow keys', () => {
    key('ArrowRight');
    expect(img().getAttribute('src')).toBe(photos[2].full);
    key('ArrowLeft');
    expect(img().getAttribute('src')).toBe(photos[1].full);
  });

  it('wraps around past the last and the first photo', async () => {
    await create(2);
    key('ArrowRight');
    expect(img().getAttribute('src')).toBe(photos[0].full);
    key('ArrowLeft');
    expect(img().getAttribute('src')).toBe(photos[2].full);
  });

  it('goes to the next photo on a swipe left and the previous on a swipe right', () => {
    swipe(-60);
    expect(img().getAttribute('src')).toBe(photos[2].full);
    swipe(60);
    swipe(60);
    expect(img().getAttribute('src')).toBe(photos[0].full);
  });

  it('ignores a drag shorter than 40px', () => {
    swipe(-30);
    expect(img().getAttribute('src')).toBe(photos[1].full);
  });

  it('does not close when a swipe ends on the dark background', () => {
    swipe(-60, backdrop());
    expect(img().getAttribute('src')).toBe(photos[2].full);
    expect(closed).not.toHaveBeenCalled();
  });

  it('closes from the close button', () => {
    const button = el.querySelector<HTMLButtonElement>('button.lightbox__close')!;
    expect(button.getAttribute('aria-label')).toBe('Luk');
    button.click();
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('closes when the dark background outside the photo is tapped', () => {
    swipe(0, backdrop());
    expect(closed).toHaveBeenCalledTimes(1);
  });

  it('stays open when the photo itself is clicked', () => {
    img().click();
    expect(closed).not.toHaveBeenCalled();
  });

  it('closes on Escape', () => {
    key('Escape');
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

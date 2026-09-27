import { ComponentFixture, TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { Hero, SLIDE_INTERVAL_MS } from './hero';
import { advanceSlideshow, initialSlideshow, SlideshowState } from './slideshow';

const photoCount = invitation.photos.length;
const after = (steps: number): SlideshowState => {
  let state = initialSlideshow(photoCount);
  for (let i = 0; i < steps; i++) state = advanceSlideshow(state, photoCount);
  return state;
};

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;
  let section: HTMLElement;

  function create(): void {
    fixture = TestBed.createComponent(Hero);
    fixture.detectChanges();
    section = fixture.nativeElement.querySelector('section');
  }

  function pointer(type: 'pointerdown' | 'pointerup', clientX: number): void {
    section.dispatchEvent(new PointerEvent(type, { clientX, bubbles: true }));
  }

  function setHidden(hidden: boolean, notify = true): void {
    Object.defineProperty(document, 'hidden', { configurable: true, get: () => hidden });
    if (notify) document.dispatchEvent(new Event('visibilitychange'));
  }

  beforeEach(() => {
    vi.useFakeTimers();
    // jsdom reports document.hidden === true by default; a real open tab is visible.
    setHidden(false, false);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    delete (document as { hidden?: boolean }).hidden;
  });

  it('shows three polaroids with the first three photos and the title', () => {
    create();
    const imgs: HTMLImageElement[] = Array.from(section.querySelectorAll('.polaroid img'));
    expect(imgs.map(img => img.getAttribute('src'))).toEqual(invitation.photos.slice(0, 3).map(p => p.src));
    expect(imgs[0].getAttribute('alt')).toBe(invitation.photos[0].alt);
    expect(section.querySelector('h1')?.textContent).toContain('30!');
    expect(section.textContent).toContain(invitation.names);
  });

  it('advances automatically every 4 seconds', () => {
    create();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS - 1);
    expect(fixture.componentInstance.state()).toEqual(after(0));
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.state()).toEqual(after(1));
  });

  it('advances on tap and restarts the timer', () => {
    create();
    vi.advanceTimersByTime(3000);
    pointer('pointerdown', 100);
    pointer('pointerup', 102);
    expect(fixture.componentInstance.state()).toEqual(after(1));

    vi.advanceTimersByTime(3000);
    expect(fixture.componentInstance.state()).toEqual(after(1));
    vi.advanceTimersByTime(1000);
    expect(fixture.componentInstance.state()).toEqual(after(2));
  });

  it('advances on a swipe of at least 40px but ignores a short drag', () => {
    create();
    pointer('pointerdown', 200);
    pointer('pointerup', 180);
    expect(fixture.componentInstance.state()).toEqual(after(0));

    pointer('pointerdown', 200);
    pointer('pointerup', 150);
    expect(fixture.componentInstance.state()).toEqual(after(1));
  });

  it('pauses while the tab is hidden and resumes when visible', () => {
    create();
    setHidden(true);
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 3);
    expect(fixture.componentInstance.state()).toEqual(after(0));

    setHidden(false);
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS);
    expect(fixture.componentInstance.state()).toEqual(after(1));
  });

  it('does not rotate automatically with reduced motion, but still reacts to taps', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    create();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 3);
    expect(fixture.componentInstance.state()).toEqual(after(0));

    pointer('pointerdown', 100);
    pointer('pointerup', 100);
    expect(fixture.componentInstance.state()).toEqual(after(1));
  });

  it('renders one dot per photo and marks the current one', () => {
    create();
    const dots = section.querySelectorAll('.hero__dots span');
    expect(dots).toHaveLength(photoCount);
    expect(dots[after(0).current].classList).toContain('active');
  });
});

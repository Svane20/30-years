import { ComponentFixture, TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { Slide } from '../../invitation.model';
import { Hero, SLIDE_INTERVAL_MS } from './hero';

const slideCount = invitation.slides.length;

describe('Hero', () => {
  let fixture: ComponentFixture<Hero>;
  let section: HTMLElement;

  function create(): void {
    fixture = TestBed.createComponent(Hero);
    fixture.detectChanges();
    section = fixture.nativeElement.querySelector('section');
  }

  /** The photo shown in each polaroid, in slot order (Kasper, Mette, together). */
  function shown(): (string | null)[] {
    fixture.detectChanges();
    return Array.from(section.querySelectorAll('.polaroid')).map(p => p.querySelector('img.active')?.getAttribute('src') ?? null);
  }

  const srcs = (slide: Slide) => [slide.kasper.src, slide.mette.src, slide.together.src];

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

  it('shows Kasper, Mette and the two together from the first slide, with the title', () => {
    create();
    expect(shown()).toEqual(srcs(invitation.slides[0]));
    expect(section.querySelector('.polaroid img.active')?.getAttribute('alt')).toBe(invitation.slides[0].kasper.alt);
    expect(section.querySelector('h1')?.textContent).toContain('30!');
    expect(section.textContent).toContain(invitation.names);
  });

  it('changes the whole slide every 5 seconds', () => {
    create();
    expect(SLIDE_INTERVAL_MS).toBe(5000);
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS - 1);
    expect(fixture.componentInstance.current()).toBe(0);
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.current()).toBe(1);
    expect(shown()).toEqual(srcs(invitation.slides[1]));
  });

  it('wraps around to the first slide after the last', () => {
    create();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * slideCount);
    expect(fixture.componentInstance.current()).toBe(0);
    expect(shown()).toEqual(srcs(invitation.slides[0]));
  });

  it('marks only the current slide’s photos as visible to screen readers', () => {
    create();
    const visible = Array.from(section.querySelectorAll('.polaroid img')).filter(img => img.getAttribute('aria-hidden') !== 'true');
    expect(visible.map(img => img.getAttribute('src'))).toEqual(srcs(invitation.slides[0]));
  });

  it('advances on tap and restarts the timer', () => {
    create();
    vi.advanceTimersByTime(3000);
    pointer('pointerdown', 100);
    pointer('pointerup', 102);
    expect(fixture.componentInstance.current()).toBe(1);

    vi.advanceTimersByTime(SLIDE_INTERVAL_MS - 1);
    expect(fixture.componentInstance.current()).toBe(1);
    vi.advanceTimersByTime(1);
    expect(fixture.componentInstance.current()).toBe(2);
  });

  it('advances on a swipe of at least 40px but ignores a short drag', () => {
    create();
    pointer('pointerdown', 200);
    pointer('pointerup', 180);
    expect(fixture.componentInstance.current()).toBe(0);

    pointer('pointerdown', 200);
    pointer('pointerup', 150);
    expect(fixture.componentInstance.current()).toBe(1);
  });

  it('pauses while the tab is hidden and resumes when visible', () => {
    create();
    setHidden(true);
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 3);
    expect(fixture.componentInstance.current()).toBe(0);

    setHidden(false);
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS);
    expect(fixture.componentInstance.current()).toBe(1);
  });

  it('does not rotate automatically with reduced motion, but still reacts to taps', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    create();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 3);
    expect(fixture.componentInstance.current()).toBe(0);

    pointer('pointerdown', 100);
    pointer('pointerup', 100);
    expect(fixture.componentInstance.current()).toBe(1);
  });

  it('renders one dot per slide and marks the current one', () => {
    create();
    const dots = () => Array.from(section.querySelectorAll('.hero__dots span'));
    expect(dots()).toHaveLength(slideCount);
    expect(dots().map(d => d.classList.contains('active'))).toEqual([true, false, false]);

    vi.advanceTimersByTime(SLIDE_INTERVAL_MS);
    fixture.detectChanges();
    expect(dots().map(d => d.classList.contains('active'))).toEqual([false, true, false]);
  });
});

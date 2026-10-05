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

  /** Expected photos per slot (left, right, bottom): Kasper and Mette swap sides every other slide. */
  const srcs = (slide: Slide, index = invitation.slides.indexOf(slide)) =>
    index % 2 === 0 ? [slide.kasper.src, slide.mette.src, slide.together.src] : [slide.mette.src, slide.kasper.src, slide.together.src];

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

  it('swaps Kasper and Mette between left and right on every other slide', () => {
    create();
    const slide1 = invitation.slides[1];
    expect(shown()).toEqual([invitation.slides[0].kasper.src, invitation.slides[0].mette.src, invitation.slides[0].together.src]);
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS);
    expect(shown()).toEqual([slide1.mette.src, slide1.kasper.src, slide1.together.src]);
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

  it('does not advance on a tap, so taps only ever open photos', () => {
    create();
    pointer('pointerdown', 100);
    pointer('pointerup', 102);
    expect(fixture.componentInstance.current()).toBe(0);
  });

  it('advances on a swipe and restarts the timer', () => {
    create();
    vi.advanceTimersByTime(3000);
    pointer('pointerdown', 200);
    pointer('pointerup', 150);
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

  it('does not rotate automatically with reduced motion, but still reacts to swipes', () => {
    vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: true }));
    create();
    vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 3);
    expect(fixture.componentInstance.current()).toBe(0);

    pointer('pointerdown', 100);
    pointer('pointerup', 50);
    expect(fixture.componentInstance.current()).toBe(1);
  });

  describe('full-screen photo', () => {
    const polaroid = (slot: number) => section.querySelectorAll<HTMLButtonElement>('button.polaroid')[slot];
    const lightbox = () => (fixture.nativeElement as HTMLElement).querySelector('app-lightbox');

    function tapPolaroid(slot: number, moveBy = 0): void {
      const target = polaroid(slot);
      target.dispatchEvent(new PointerEvent('pointerdown', { clientX: 100, bubbles: true }));
      target.dispatchEvent(new PointerEvent('pointerup', { clientX: 100 + moveBy, bubbles: true }));
      target.click();
      fixture.detectChanges();
    }

    it('opens the tapped polaroid’s current photo without changing the slide', () => {
      create();
      vi.advanceTimersByTime(SLIDE_INTERVAL_MS); // slide 2: Mette left, Kasper right
      fixture.detectChanges();
      tapPolaroid(1);
      expect(fixture.componentInstance.current()).toBe(1);
      expect(lightbox()?.querySelector('img')?.getAttribute('src')).toBe(invitation.slides[1].kasper.full);
    });

    it('steps through every photo slide by slide, in on-screen order, starting from the tapped one', () => {
      create();
      vi.advanceTimersByTime(SLIDE_INTERVAL_MS); // slide 2
      fixture.detectChanges();
      tapPolaroid(2);
      const full = () => lightbox()!.querySelector('img')!.getAttribute('src');
      expect(full()).toBe(invitation.slides[1].together.full);
      expect(lightbox()!.querySelector('.lightbox__counter')!.textContent!.trim()).toBe(`6 / ${slideCount * 3}`);

      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
      fixture.detectChanges();
      expect(full()).toBe(invitation.slides[2].kasper.full); // slide 3: Kasper left again
      expect(fixture.componentInstance.current()).toBe(1);
    });

    it('wraps from the first photo back to the last one', () => {
      create();
      tapPolaroid(0);
      lightbox()!.querySelector<HTMLButtonElement>('button.lightbox__prev')!.click();
      fixture.detectChanges();
      expect(lightbox()!.querySelector('img')!.getAttribute('src')).toBe(invitation.slides[slideCount - 1].together.full);
    });

    it('labels each polaroid as a button that opens the photo', () => {
      create();
      expect(polaroid(0).getAttribute('aria-label')).toBe(`Vis billede i fuld skærm: ${invitation.slides[0].kasper.alt}`);
    });

    it('still changes slide on a swipe that starts on a polaroid, without opening it', () => {
      create();
      tapPolaroid(0, -60);
      expect(fixture.componentInstance.current()).toBe(1);
      expect(lightbox()).toBeNull();
    });

    it('pauses the slideshow while open and resumes after closing', () => {
      create();
      tapPolaroid(0);
      vi.advanceTimersByTime(SLIDE_INTERVAL_MS * 3);
      expect(fixture.componentInstance.current()).toBe(0);

      lightbox()!.querySelector<HTMLButtonElement>('button.lightbox__close')!.click();
      fixture.detectChanges();
      expect(lightbox()).toBeNull();
      vi.advanceTimersByTime(SLIDE_INTERVAL_MS);
      expect(fixture.componentInstance.current()).toBe(1);
    });

    it('returns focus to the polaroid after closing', () => {
      create();
      tapPolaroid(2);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();
      expect(lightbox()).toBeNull();
      expect(document.activeElement).toBe(polaroid(2));
    });
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

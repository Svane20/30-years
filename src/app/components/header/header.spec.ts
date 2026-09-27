import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Header } from './header';

describe('Header', () => {
  let fixture: ComponentFixture<Header>;
  let el: HTMLElement;

  beforeEach(() => {
    fixture = TestBed.createComponent(Header);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  afterEach(() => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 });
  });

  it('shows the logo and the four jump links in page order', () => {
    expect(el.querySelector('.logo')?.textContent?.trim()).toBe('K & M');
    const links = Array.from(el.querySelectorAll<HTMLAnchorElement>('.nav a'));
    expect(links.map(a => a.textContent?.trim())).toEqual(['Info', 'Kort', 'Ønsker', 'Svar']);
    expect(links.map(a => a.getAttribute('href'))).toEqual(['#info', '#kort', '#oensker', '#svar']);
  });

  it('becomes solid after scrolling more than 100px', () => {
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 150 });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(el.querySelector('header')?.classList).toContain('fixed');

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 20 });
    window.dispatchEvent(new Event('scroll'));
    fixture.detectChanges();
    expect(el.querySelector('header')?.classList).not.toContain('fixed');
  });

  it('opens and closes the mobile menu from the hamburger button', () => {
    const button = el.querySelector<HTMLButtonElement>('.hamburger-btn')!;
    expect(button.getAttribute('aria-expanded')).toBe('false');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('true');
    expect(el.querySelector('header')?.classList).toContain('open');

    button.click();
    fixture.detectChanges();
    expect(button.getAttribute('aria-expanded')).toBe('false');
  });

  it('scrolls to the section and closes the menu when a link is tapped', () => {
    const target = document.createElement('section');
    target.id = 'kort';
    target.scrollIntoView = vi.fn();
    document.body.appendChild(target);

    el.querySelector<HTMLButtonElement>('.hamburger-btn')!.click();
    fixture.detectChanges();

    const link = Array.from(el.querySelectorAll<HTMLAnchorElement>('.nav a')).find(a => a.textContent?.trim() === 'Kort')!;
    const click = new MouseEvent('click', { bubbles: true, cancelable: true });
    link.dispatchEvent(click);
    fixture.detectChanges();

    expect(click.defaultPrevented).toBe(true);
    expect(target.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth' });
    expect(el.querySelector('header')?.classList).not.toContain('open');

    target.remove();
  });
});

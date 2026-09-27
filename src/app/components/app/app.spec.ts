import { TestBed } from '@angular/core/testing';
import { provideDanishLocale } from '../../locale';
import { App } from './app';

describe('App', () => {
  it('renders the sections in the agreed order, with every nav target present', () => {
    TestBed.configureTestingModule({ providers: [provideDanishLocale()] });
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const ids = Array.from(el.querySelectorAll('main section[id]')).map(s => s.id);
    expect(ids).toEqual(['home', 'info', 'kort', 'oensker', 'svar']);

    for (const link of Array.from(el.querySelectorAll<HTMLAnchorElement>('.nav a'))) {
      expect(el.querySelector(link.getAttribute('href')!)).not.toBeNull();
    }

    expect(el.querySelector('main + app-footer')).not.toBeNull();
    expect(el.querySelector('app-toast')).not.toBeNull();
  });
});

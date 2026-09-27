import { TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { Wishlists } from './wishlists';

describe('Wishlists', () => {
  it('renders one card per wish list that opens in a new tab', () => {
    const fixture = TestBed.createComponent(Wishlists);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const cards = Array.from(el.querySelectorAll<HTMLAnchorElement>('a.wish'));
    expect(cards).toHaveLength(3);

    cards.forEach((card, i) => {
      const list = invitation.wishlists[i];
      expect(card.getAttribute('href')).toBe(list.url);
      expect(card.getAttribute('target')).toBe('_blank');
      expect(card.getAttribute('rel')).toBe('noopener');
      expect(card.querySelector('.wish__avatar')?.textContent?.trim()).toBe(list.initials);
      expect(card.textContent).toContain(list.name);
      expect(card.textContent).toContain(list.text);
    });
  });
});

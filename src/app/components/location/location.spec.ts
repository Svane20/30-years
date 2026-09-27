import { TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { LocationSection } from './location';

describe('LocationSection', () => {
  it('embeds the map and links to Google Maps in a new tab', () => {
    const fixture = TestBed.createComponent(LocationSection);
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;

    const iframe = el.querySelector('iframe')!;
    expect(iframe.getAttribute('src')).toBe(invitation.venue.mapEmbedUrl);
    expect(iframe.getAttribute('loading')).toBe('lazy');
    expect(iframe.getAttribute('title')).toBe(`Kort over ${invitation.venue.name}`);

    expect(el.textContent).toContain(invitation.venue.name);
    expect(el.textContent).toContain(invitation.venue.address);

    const link = el.querySelector<HTMLAnchorElement>('a.btn')!;
    expect(link.textContent?.trim()).toBe('Åbn i Google Maps');
    expect(link.getAttribute('href')).toBe(invitation.venue.mapsUrl);
    expect(link.getAttribute('target')).toBe('_blank');
    expect(link.getAttribute('rel')).toBe('noopener');
  });
});

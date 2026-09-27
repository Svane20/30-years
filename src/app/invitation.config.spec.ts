import { invitation } from './invitation.config';

describe('invitation config', () => {
  it('has exactly three wish lists, each with a name, initials, text and an https url', () => {
    expect(invitation.wishlists).toHaveLength(3);
    for (const list of invitation.wishlists) {
      expect(list.name.trim()).not.toBe('');
      expect(list.initials.trim()).not.toBe('');
      expect(list.text.trim()).not.toBe('');
      expect(list.url.startsWith('https://')).toBe(true);
    }
  });

  it('has three slides, each with a photo of Kasper, of Mette and of them together', () => {
    expect(invitation.slides).toHaveLength(3);
    for (const slide of invitation.slides) {
      expect(Object.keys(slide).sort()).toEqual(['kasper', 'mette', 'together']);
      for (const photo of [slide.kasper, slide.mette, slide.together]) {
        expect(photo.src.startsWith('assets/images/photos/')).toBe(true);
        expect(photo.alt.trim()).not.toBe('');
      }
    }
  });

  it('never repeats a photo', () => {
    const srcs = invitation.slides.flatMap(s => [s.kasper.src, s.mette.src, s.together.src]).filter(src => !src.includes('placeholder'));
    expect(new Set(srcs).size).toBe(srcs.length);
  });

  it('has a valid party date', () => {
    expect(Number.isNaN(invitation.date.getTime())).toBe(false);
  });

  it('has an RSVP deadline before the party date', () => {
    expect(invitation.rsvpDeadline.getTime()).toBeLessThan(invitation.date.getTime());
  });

  it('only embeds maps from google.com', () => {
    expect(new URL(invitation.venue.mapEmbedUrl).hostname.endsWith('google.com')).toBe(true);
    expect(new URL(invitation.venue.mapsUrl).hostname.endsWith('google.com')).toBe(true);
  });

  it('has an empty RSVP endpoint or a Google Apps Script URL', () => {
    const endpoint = invitation.rsvpEndpoint;
    expect(endpoint === '' || endpoint.startsWith('https://script.google.com/')).toBe(true);
  });
});

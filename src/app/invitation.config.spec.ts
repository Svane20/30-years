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

  it('has at least three photos, each with a src and alt text', () => {
    expect(invitation.photos.length).toBeGreaterThanOrEqual(3);
    for (const photo of invitation.photos) {
      expect(photo.src.startsWith('assets/images/photos/')).toBe(true);
      expect(photo.alt.trim()).not.toBe('');
    }
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

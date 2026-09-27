import { Invitation } from './invitation.model';

// Venue is real; date, time, deadline, endpoint, photos and wish lists are placeholders –
// replace them before sharing the link.
export const invitation = {
  names: 'Kasper & Mette',
  date: new Date('2026-11-14T18:00:00'),
  endTime: 'til sent',
  venue: {
    name: 'Årslev Forsamlingshus',
    address: 'Bystævnet 13, 5792 Årslev',
    mapEmbedUrl: 'https://maps.google.com/maps?q=%C3%85rslev%20Forsamlingshus%2C%20Byst%C3%A6vnet%2013%2C%205792%20%C3%85rslev&z=16&output=embed',
    mapsUrl: 'https://www.google.com/maps/place/%C3%85rslev+Forsamlingshus/@55.2977523,10.4533056,17z',
  },
  rsvpDeadline: new Date('2026-11-01T23:59:59'),
  rsvpEndpoint: '',
  photos: [
    { src: 'assets/images/photos/placeholder-1.svg', alt: 'Pladsholder – foto 1' },
    { src: 'assets/images/photos/placeholder-2.svg', alt: 'Pladsholder – foto 2' },
    { src: 'assets/images/photos/placeholder-3.svg', alt: 'Pladsholder – foto 3' },
  ],
  wishlists: [
    { name: 'Kasper', initials: 'K', text: 'Hvis du vil forkæle mig', url: 'https://example.com/kasper' },
    { name: 'Mette', initials: 'M', text: 'Hvis du vil forkæle mig', url: 'https://example.com/mette' },
    { name: 'Fælles', initials: 'K&M', text: 'Til os begge', url: 'https://example.com/faelles' },
  ],
} satisfies Invitation;

import { Invitation } from './invitation.model';

// Venue, date, start time, deadline, RSVP endpoint and wish lists are real; most photos are placeholders –
// replace them before sharing the link.
export const invitation = {
  names: 'Kasper & Mette',
  date: new Date('2027-01-23T11:00:00'),
  venue: {
    name: 'Årslev Forsamlingshus',
    address: 'Bystævnet 13, 5792 Årslev',
    mapEmbedUrl:
      'https://maps.google.com/maps?q=%C3%85rslev%20Forsamlingshus%2C%20Byst%C3%A6vnet%2013%2C%205792%20%C3%85rslev&z=16&output=embed',
    mapsUrl:
      'https://www.google.com/maps/place/%C3%85rslev+Forsamlingshus/@55.2977523,10.4533056,17z/data=!3m1!4b1!4m6!3m5!1s0x464d26b9bf6b3f11:0x3758869b7030f8b6!8m2!3d55.2977523!4d10.4533056!16s%2Fg%2F1thkvwh1?entry=ttu&g_ep=EgoyMDI2MDkyMy4wIKXMDSoASAFQAw%3D%3D',
  },
  rsvpDeadline: new Date('2027-01-02T23:59:59'),
  rsvpEndpoint: 'https://script.google.com/macros/s/AKfycbyCcoIiXKV2aoA5rym13XK5Y7mnjQ8i2JX5dcPKmrX5-q3BoBD0-yffgPqgvZaGa3Vf4g/exec',
  slides: [
    {
      kasper: { src: 'assets/images/photos/kasper-barn.jpg', full: 'assets/images/photos/kasper-barn.jpg', alt: 'Kasper som barn' },
      mette: { src: 'assets/images/photos/placeholder-mette.svg', full: 'assets/images/photos/placeholder-mette.svg', alt: 'Pladsholder – Mette' },
      together: { src: 'assets/images/photos/placeholder-sammen.svg', full: 'assets/images/photos/placeholder-sammen.svg', alt: 'Pladsholder – Kasper og Mette' },
    },
    {
      kasper: { src: 'assets/images/photos/kasper-cycling.jpg', full: 'assets/images/photos/kasper-cycling-full.jpg', alt: 'Kasper med sin racercykel på toppen af Mont Ventoux' },
      mette: { src: 'assets/images/photos/placeholder-mette.svg', full: 'assets/images/photos/placeholder-mette.svg', alt: 'Pladsholder – Mette' },
      together: { src: 'assets/images/photos/placeholder-sammen.svg', full: 'assets/images/photos/placeholder-sammen.svg', alt: 'Pladsholder – Kasper og Mette' },
    },
    {
      kasper: { src: 'assets/images/photos/kasper-parachuting.jpg', full: 'assets/images/photos/kasper-parachuting-full.jpg', alt: 'Kasper i frit fald under et faldskærmsudspring' },
      mette: { src: 'assets/images/photos/placeholder-mette.svg', full: 'assets/images/photos/placeholder-mette.svg', alt: 'Pladsholder – Mette' },
      together: { src: 'assets/images/photos/placeholder-sammen.svg', full: 'assets/images/photos/placeholder-sammen.svg', alt: 'Pladsholder – Kasper og Mette' },
    },
  ],
  wishlists: [
    { name: 'Kasper', initials: 'K', text: 'Hvis du vil forkæle mig', url: 'https://onskeskyen.dk/s/eu2gfa' },
    { name: 'Mette', initials: 'M', text: 'Hvis du vil forkæle mig', url: 'https://onskeskyen.dk/s/eu2f57' },
    { name: 'Fælles', initials: 'K&M', text: 'Til os begge', url: 'https://onskeskyen.dk/s/eu2gpn' },
  ],
} satisfies Invitation;

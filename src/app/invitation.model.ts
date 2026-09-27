export interface Venue {
  name: string;
  address: string;
  /** Google Maps embed URL for the iframe (no API key). */
  mapEmbedUrl: string;
  /** Google Maps link opened by the "Åbn i Google Maps" button. */
  mapsUrl: string;
}

export interface Photo {
  /** Polaroid-sized (5:6 crop, ~800×960) path under public/, e.g. 'assets/images/photos/1.jpg'. */
  src: string;
  /** Whole photo for the full-screen view, long edge ≤ 1600px. */
  full: string;
  alt: string;
}

/** One slideshow slide: a polaroid of each, shown together. */
export interface Slide {
  kasper: Photo;
  mette: Photo;
  together: Photo;
}

export interface Wishlist {
  name: string;
  /** Shown in the round avatar, e.g. 'K' or 'K&M'. */
  initials: string;
  text: string;
  url: string;
}

export interface Invitation {
  names: string;
  /** Party start in local time. There is no end time. */
  date: Date;
  venue: Venue;
  rsvpDeadline: Date;
  /** Google Apps Script web app URL; empty until deployed. */
  rsvpEndpoint: string;
  /** Exactly three. */
  slides: Slide[];
  /** Exactly three: Kasper, Mette, Fælles. */
  wishlists: Wishlist[];
}

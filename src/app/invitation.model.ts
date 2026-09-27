export interface Venue {
  name: string;
  address: string;
  /** Google Maps embed URL for the iframe (no API key). */
  mapEmbedUrl: string;
  /** Google Maps link opened by the "Åbn i Google Maps" button. */
  mapsUrl: string;
}

export interface Photo {
  /** Path under public/, e.g. 'assets/images/photos/1.jpg'. */
  src: string;
  alt: string;
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
  /** Party start in local time. */
  date: Date;
  endTime: string;
  venue: Venue;
  rsvpDeadline: Date;
  /** Google Apps Script web app URL; empty until deployed. */
  rsvpEndpoint: string;
  /** At least three. */
  photos: Photo[];
  /** Exactly three: Kasper, Mette, Fælles. */
  wishlists: Wishlist[];
}

import { Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { invitation } from '../../invitation.config';

@Component({
  selector: 'app-location',
  styleUrl: './location.scss',
  templateUrl: './location.html',
})
export class LocationSection {
  protected readonly venue = invitation.venue;
  // Trusted: the URL comes from our own config, and the config test pins it to google.com.
  protected readonly mapEmbedUrl = inject(DomSanitizer).bypassSecurityTrustResourceUrl(invitation.venue.mapEmbedUrl);
}

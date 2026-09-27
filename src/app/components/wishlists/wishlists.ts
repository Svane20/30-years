import { Component } from '@angular/core';
import { invitation } from '../../invitation.config';

@Component({
  selector: 'app-wishlists',
  styleUrl: './wishlists.scss',
  templateUrl: './wishlists.html',
})
export class Wishlists {
  protected readonly wishlists = invitation.wishlists;
}

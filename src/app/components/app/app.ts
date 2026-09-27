import { Component } from '@angular/core';
import { Footer } from '../footer/footer';
import { Header } from '../header/header';
import { Hero } from '../hero/hero';
import { InvitationDetails } from '../invitation/invitation';
import { LocationSection } from '../location/location';
import { Rsvp } from '../rsvp/rsvp';
import { Wishlists } from '../wishlists/wishlists';

@Component({
  imports: [Header, Hero, InvitationDetails, LocationSection, Wishlists, Rsvp, Footer],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}

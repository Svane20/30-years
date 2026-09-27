import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Hero } from '../hero/hero';
import { InvitationDetails } from '../invitation/invitation';

@Component({
  imports: [Header, Hero, InvitationDetails],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}

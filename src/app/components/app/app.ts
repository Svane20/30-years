import { Component } from '@angular/core';
import { Header } from '../header/header';
import { Hero } from '../hero/hero';

@Component({
  imports: [Header, Hero],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {}

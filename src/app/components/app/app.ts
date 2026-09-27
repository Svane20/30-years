import { Component, signal } from '@angular/core';
import { Header } from '../header/header';

@Component({
  imports: [Header],
  selector: 'app-root',
  styleUrl: './app.scss',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('30-years');
}

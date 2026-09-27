import { Component, HostListener, signal } from '@angular/core';

@Component({
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  public isFixed = signal<boolean>(false);

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isFixed.set(window.scrollY > 100);
  }
}

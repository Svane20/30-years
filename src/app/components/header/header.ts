import { DOCUMENT } from '@angular/common';
import { Component, HostListener, inject, signal } from '@angular/core';

interface NavLink {
  id: string;
  label: string;
}

@Component({
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  private readonly document = inject(DOCUMENT);

  public readonly links: NavLink[] = [
    { id: 'info', label: 'Info' },
    { id: 'kort', label: 'Kort' },
    { id: 'oensker', label: 'Ønsker' },
    { id: 'svar', label: 'Svar' },
  ];

  public readonly isFixed = signal<boolean>(false);
  public readonly isNavOpen = signal<boolean>(false);

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    this.isFixed.set(window.scrollY > 100);
  }

  public toggleNav(): void {
    this.isNavOpen.update(open => !open);
  }

  public scrollTo(id: string, event: Event): void {
    event.preventDefault();
    this.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    this.isNavOpen.set(false);
  }
}

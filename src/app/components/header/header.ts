import { Component, HostListener, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  imports: [RouterLink],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {
  public isFixed = signal<boolean>(false);

  @HostListener('window:scroll', [])
  onWindowScroll(): void {
    if (window.scrollY === 0) {
      this.activeFragment.set('home');
    }

    if (window.scrollY > 100) {
      this.isFixed.set(true);
    } else {
      this.isFixed.set(false);
    }
  }

  public activeFragment = signal<string>('home');
  public isNavOpen = signal<boolean>(false);

  public isActive(fragment: string): boolean {
    return this.activeFragment() === fragment;
  }

  public toggleNav(): void {
    this.isNavOpen.update(open => !open);
  }

  public closeNavOnLinkClick(): void {
    if (window.innerWidth < 768) {
      this.isNavOpen.set(false);
    }
  }
}

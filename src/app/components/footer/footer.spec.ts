import { TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { Footer } from './footer';

describe('Footer', () => {
  it('signs off with the initials and the party year', () => {
    const fixture = TestBed.createComponent(Footer);
    fixture.detectChanges();
    const text = (fixture.nativeElement as HTMLElement).textContent ?? '';
    expect(text).toContain('Vi glæder os til at se dig/jer!');
    expect(text).toContain(`K & M · ${invitation.date.getFullYear()}`);
  });
});

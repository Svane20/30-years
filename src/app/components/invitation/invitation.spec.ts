import { formatDate } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { provideDanishLocale } from '../../locale';
import { InvitationDetails } from './invitation';

const ONE_DAY_2H_3M_4S = ((24 + 2) * 3600 + 3 * 60 + 4) * 1000;

describe('InvitationDetails', () => {
  let fixture: ComponentFixture<InvitationDetails>;
  let el: HTMLElement;

  function create(now: Date): void {
    vi.setSystemTime(now);
    TestBed.configureTestingModule({ providers: [provideDanishLocale()] });
    fixture = TestBed.createComponent(InvitationDetails);
    fixture.detectChanges();
    el = fixture.nativeElement;
  }

  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('invites to brunch', () => {
    create(new Date(invitation.date.getTime() - ONE_DAY_2H_3M_4S));
    expect(el.querySelector('h2')?.textContent?.trim()).toBe('Kom til brunch');
  });

  it('shows the weekday, date, time and venue in Danish', () => {
    create(new Date(invitation.date.getTime() - ONE_DAY_2H_3M_4S));
    const text = el.textContent ?? '';
    expect(text).toContain(formatDate(invitation.date, 'EEEE', 'da-DK'));
    expect(text).toContain(formatDate(invitation.date, 'd. MMMM', 'da-DK'));
    expect(text).toContain(invitation.venue.name);
  });

  it('shows only the start time, since the party has no end time', () => {
    create(new Date(invitation.date.getTime() - ONE_DAY_2H_3M_4S));
    const time = Array.from(el.querySelectorAll('.facts div')).find(d => d.querySelector('dt')?.textContent?.trim() === 'Tid');
    expect(time?.querySelector('dd')?.textContent?.trim()).toBe(formatDate(invitation.date, 'HH:mm', 'da-DK'));
  });

  it('shows a live countdown with padded hours, minutes and seconds', () => {
    create(new Date(invitation.date.getTime() - ONE_DAY_2H_3M_4S));
    const values = () => Array.from(el.querySelectorAll('.countdown b')).map(b => b.textContent?.trim());
    expect(values()).toEqual(['1', '02', '03', '04']);

    vi.advanceTimersByTime(1000);
    fixture.detectChanges();
    expect(values()).toEqual(['1', '02', '03', '03']);
  });

  it('shows the party-day message on the day', () => {
    create(invitation.date);
    expect(el.querySelector('.countdown')).toBeNull();
    expect(el.textContent).toContain('I dag er dagen! 🎉');
  });
});

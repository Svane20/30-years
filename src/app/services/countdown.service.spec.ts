import { TestBed } from '@angular/core/testing';
import { invitation } from '../invitation.config';
import { computeRemaining, CountdownService } from './countdown.service';

const target = new Date('2026-11-14T18:00:00');
const at = (iso: string) => new Date(iso);

describe('computeRemaining', () => {
  it('splits the time left into days, hours, minutes and seconds', () => {
    expect(computeRemaining(at('2026-11-13T15:56:56'), target)).toEqual({ days: 1, hours: 2, minutes: 3, seconds: 4, isToday: false });
  });

  it('is not the party day one second before midnight', () => {
    expect(computeRemaining(at('2026-11-13T23:59:59'), target).isToday).toBe(false);
  });

  it('is the party day from midnight on the party date', () => {
    const r = computeRemaining(at('2026-11-14T00:00:00'), target);
    expect(r.isToday).toBe(true);
    expect(r.hours).toBe(18);
  });

  it('is zero at the start of the party', () => {
    expect(computeRemaining(target, target)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true });
  });

  it('clamps to zero after the party has started', () => {
    expect(computeRemaining(at('2026-11-15T02:00:00'), target)).toEqual({ days: 0, hours: 0, minutes: 0, seconds: 0, isToday: true });
  });
});

describe('CountdownService', () => {
  afterEach(() => vi.useRealTimers());

  it('ticks every second towards the party date', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(invitation.date.getTime() - 10_000));

    const service = TestBed.inject(CountdownService);
    expect(service.remaining().seconds).toBe(10);

    vi.advanceTimersByTime(3000);
    expect(service.remaining().seconds).toBe(7);
  });
});

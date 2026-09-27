import { TestBed } from '@angular/core/testing';
import { TOAST_DURATION_MS, ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    vi.useFakeTimers();
    service = TestBed.inject(ToastService);
  });

  afterEach(() => vi.useRealTimers());

  it('shows nothing until asked', () => {
    expect(service.current()).toBeNull();
  });

  it('shows a notification', () => {
    service.show({ kind: 'success', title: 'Tak, Anna! 🎉', message: 'Vi glæder os.' });
    expect(service.current()).toEqual({ kind: 'success', title: 'Tak, Anna! 🎉', message: 'Vi glæder os.' });
  });

  it('hides it by itself after 6 seconds', () => {
    expect(TOAST_DURATION_MS).toBe(6000);
    service.show({ kind: 'success', title: 'Tak', message: '' });
    vi.advanceTimersByTime(TOAST_DURATION_MS - 1);
    expect(service.current()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(service.current()).toBeNull();
  });

  it('keeps a notification with a button until it is used or closed', () => {
    service.show({ kind: 'warning', title: 'Anna er allerede på listen', message: '', action: { label: 'Opdater mit svar', run: () => {} } });
    vi.advanceTimersByTime(TOAST_DURATION_MS * 5);
    expect(service.current()?.title).toBe('Anna er allerede på listen');
  });

  it('runs the button’s action and closes the notification', () => {
    const run = vi.fn<() => void>();
    service.show({ kind: 'warning', title: 'Anna', message: '', action: { label: 'Opdater mit svar', run } });
    service.runAction();
    expect(run).toHaveBeenCalledTimes(1);
    expect(service.current()).toBeNull();
  });

  it('can be closed by hand', () => {
    service.show({ kind: 'error', title: 'Fejl', message: '' });
    service.dismiss();
    expect(service.current()).toBeNull();
  });

  it('replaces a notification that is still showing, and gives the new one the full 6 seconds', () => {
    service.show({ kind: 'error', title: 'Fejl', message: '' });
    vi.advanceTimersByTime(5000);
    service.show({ kind: 'success', title: 'Tak', message: '' });
    expect(service.current()?.title).toBe('Tak');

    vi.advanceTimersByTime(5000);
    expect(service.current()?.title).toBe('Tak');
    vi.advanceTimersByTime(1000);
    expect(service.current()).toBeNull();
  });
});

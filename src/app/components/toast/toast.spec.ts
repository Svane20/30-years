import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ToastService } from '../../services/toast.service';
import { ToastBar } from './toast';

describe('ToastBar', () => {
  let fixture: ComponentFixture<ToastBar>;
  let el: HTMLElement;
  let toasts: ToastService;

  beforeEach(() => {
    fixture = TestBed.createComponent(ToastBar);
    toasts = TestBed.inject(ToastService);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  const show = (kind: 'success' | 'error') => {
    toasts.show({ kind, title: kind === 'success' ? 'Tak, Anna! 🎉' : 'Dit svar blev ikke sendt.', message: 'Besked' });
    fixture.detectChanges();
  };

  it('renders nothing when there is no notification', () => {
    expect(el.querySelector('.toast')).toBeNull();
  });

  it('shows a success notification politely to screen readers', () => {
    show('success');
    const toast = el.querySelector('.toast')!;
    expect(toast.classList).toContain('toast--success');
    expect(toast.getAttribute('role')).toBe('status');
    expect(toast.querySelector('.toast__title')?.textContent?.trim()).toBe('Tak, Anna! 🎉');
    expect(toast.querySelector('.toast__message')?.textContent?.trim()).toBe('Besked');
  });

  it('announces an error notification immediately', () => {
    show('error');
    const toast = el.querySelector('.toast')!;
    expect(toast.classList).toContain('toast--error');
    expect(toast.getAttribute('role')).toBe('alert');
  });

  it('shows a warning with an action button that runs the action', () => {
    const run = vi.fn<() => void>();
    toasts.show({ kind: 'warning', title: 'Anna Hansen er allerede på listen', message: 'Hvis det er dig…', action: { label: 'Opdater mit svar', run } });
    fixture.detectChanges();
    const toast = el.querySelector('.toast')!;
    expect(toast.classList).toContain('toast--warning');
    expect(toast.getAttribute('role')).toBe('status');
    const button = toast.querySelector<HTMLButtonElement>('.toast__action')!;
    expect(button.textContent?.trim()).toBe('Opdater mit svar');
    button.click();
    fixture.detectChanges();
    expect(run).toHaveBeenCalledTimes(1);
    expect(el.querySelector('.toast')).toBeNull();
  });

  it('has no action button when there is no action', () => {
    show('success');
    expect(el.querySelector('.toast__action')).toBeNull();
  });

  it('closes from its close button', () => {
    show('success');
    const close = el.querySelector<HTMLButtonElement>('.toast__close')!;
    expect(close.getAttribute('aria-label')).toBe('Luk besked');
    close.click();
    fixture.detectChanges();
    expect(el.querySelector('.toast')).toBeNull();
  });
});

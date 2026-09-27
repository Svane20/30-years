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

  it('closes from its close button', () => {
    show('success');
    const close = el.querySelector<HTMLButtonElement>('.toast__close')!;
    expect(close.getAttribute('aria-label')).toBe('Luk besked');
    close.click();
    fixture.detectChanges();
    expect(el.querySelector('.toast')).toBeNull();
  });
});

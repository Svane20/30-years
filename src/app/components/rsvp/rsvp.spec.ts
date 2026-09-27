import { formatDate } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { provideDanishLocale } from '../../locale';
import { RsvpService } from '../../services/rsvp.service';
import { Rsvp } from './rsvp';

describe('Rsvp', () => {
  let fixture: ComponentFixture<Rsvp>;
  let el: HTMLElement;
  let submit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submit = vi.fn().mockResolvedValue(undefined);
    TestBed.configureTestingModule({ providers: [provideDanishLocale(), { provide: RsvpService, useValue: { submit } }] });
    fixture = TestBed.createComponent(Rsvp);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  const query = <T extends Element>(selector: string) => el.querySelector<T>(selector);
  const text = () => el.textContent ?? '';

  function type(selector: string, value: string): void {
    const input = query<HTMLInputElement | HTMLTextAreaElement>(selector)!;
    input.value = value;
    input.dispatchEvent(new Event('input'));
    input.dispatchEvent(new Event('blur'));
    fixture.detectChanges();
  }

  function clickButton(label: string): void {
    const button = Array.from(el.querySelectorAll('button')).find(b => b.textContent?.includes(label))!;
    button.click();
    fixture.detectChanges();
  }

  async function submitForm(): Promise<void> {
    query('form')!.dispatchEvent(new Event('submit'));
    await new Promise(resolve => setTimeout(resolve));
    fixture.detectChanges();
  }

  it('shows the RSVP deadline', () => {
    expect(text()).toContain(`Svar venligst senest ${formatDate(invitation.rsvpDeadline, 'd. MMMM', 'da-DK')}`);
  });

  it('requires a name and an answer before sending', async () => {
    await submitForm();
    expect(text()).toContain('Skriv venligst dit navn');
    expect(text()).toContain('Vælg venligst ja eller nej');
    expect(submit).not.toHaveBeenCalled();
  });

  it('rejects a whitespace-only name', async () => {
    type('#rsvp-name', '   ');
    clickButton('Desværre ikke');
    await submitForm();
    expect(text()).toContain('Skriv venligst dit navn');
    expect(submit).not.toHaveBeenCalled();
  });

  it('only asks for the number of people when attending', () => {
    expect(query('#rsvp-count')).toBeNull();
    clickButton('Ja, jeg kommer');
    expect(query('#rsvp-count')).not.toBeNull();
    clickButton('Desværre ikke');
    expect(query('#rsvp-count')).toBeNull();
  });

  it('rejects a people count outside 1–10 when attending', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Ja, jeg kommer');
    type('#rsvp-count', '11');
    await submitForm();
    expect(text()).toContain('Vælg mellem 1 og 10 personer');
    expect(submit).not.toHaveBeenCalled();
  });

  it('ignores an invalid count once the guest declines', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Ja, jeg kommer');
    type('#rsvp-count', '');
    clickButton('Desværre ikke');
    await submitForm();
    expect(submit).toHaveBeenCalledWith({ name: 'Anna', attending: false, count: 0, message: '' });
  });

  it('rejects a message longer than 500 characters', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');
    fixture.componentInstance.form.controls.message.setValue('x'.repeat(501));
    await submitForm();
    expect(text()).toContain('Højst 500 tegn');
    expect(submit).not.toHaveBeenCalled();
  });

  it('sends the trimmed values', async () => {
    type('#rsvp-name', '  Anna  ');
    clickButton('Ja, jeg kommer');
    type('#rsvp-count', '2');
    type('#rsvp-message', '  Glæder mig  ');
    await submitForm();
    expect(submit).toHaveBeenCalledWith({ name: 'Anna', attending: true, count: 2, message: 'Glæder mig' });
  });

  it('disables the button while sending and ignores a second submit', async () => {
    let finish!: () => void;
    submit.mockReturnValue(new Promise<void>(resolve => (finish = resolve)));
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');

    await submitForm();
    const button = query<HTMLButtonElement>('button[type="submit"]')!;
    expect(button.disabled).toBe(true);
    expect(button.textContent?.trim()).toBe('Sender…');

    await submitForm();
    expect(submit).toHaveBeenCalledTimes(1);

    finish();
    await new Promise(resolve => setTimeout(resolve));
  });

  it('thanks an attending guest by name', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Ja, jeg kommer');
    await submitForm();
    expect(query('form')).toBeNull();
    expect(text()).toContain('Tak, Anna! 🎉');
    expect(text()).toContain('Vi glæder os til at se dig.');
  });

  it('moves focus to the thank-you message so screen readers announce it', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Ja, jeg kommer');
    await submitForm();
    await fixture.whenStable();
    expect(document.activeElement).toBe(query('.thanks'));
  });

  it('keeps the honeypot free of labels that browsers autofill', () => {
    const honeypot = query<HTMLInputElement>('.hp input')!;
    const label = query('.hp label')!;
    const hints = [honeypot.id, honeypot.name, honeypot.getAttribute('autocomplete') ?? '', label.textContent ?? ''].join(' ').toLowerCase();
    for (const word of ['website', 'url', 'email', 'mail', 'phone', 'name', 'address']) {
      expect(hints).not.toContain(word);
    }
    expect(honeypot.getAttribute('autocomplete')).toBe('off');
  });

  it('answers a declining guest kindly', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');
    await submitForm();
    expect(text()).toContain('Ærgerligt, Anna');
    expect(text()).toContain('Vi kommer til at savne dig!');
  });

  it('shows the error message when the service rejects and keeps the input', async () => {
    submit.mockRejectedValue(new Error('RSVP endpoint is not configured'));
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');
    await submitForm();

    expect(query('[role="alert"]')?.textContent).toContain('Noget gik galt – prøv igen, eller skriv til os på SMS.');
    expect(query<HTMLInputElement>('#rsvp-name')!.value).toBe('Anna');
    expect(query<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
    expect(text()).not.toContain('Tak, Anna');
  });

  it('pretends success without sending when the honeypot is filled', async () => {
    type('#rsvp-name', 'Bot');
    clickButton('Desværre ikke');
    fixture.componentInstance.form.controls.website.setValue('http://spam.example');
    await submitForm();
    expect(submit).not.toHaveBeenCalled();
    expect(text()).toContain('Ærgerligt, Bot');
  });

  it('lets the guest send a new answer', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');
    await submitForm();

    clickButton('Send et nyt svar');
    expect(query<HTMLInputElement>('#rsvp-name')!.value).toBe('');
    expect(text()).not.toContain('Skriv venligst dit navn');
  });
});

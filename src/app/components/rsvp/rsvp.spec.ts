import { formatDate } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { invitation } from '../../invitation.config';
import { provideDanishLocale } from '../../locale';
import { DuplicateNameError, RsvpService } from '../../services/rsvp.service';
import { ToastService } from '../../services/toast.service';
import { Rsvp } from './rsvp';

describe('Rsvp', () => {
  let fixture: ComponentFixture<Rsvp>;
  let el: HTMLElement;
  let submit: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    submit = vi.fn().mockResolvedValue({ updated: false });
    TestBed.configureTestingModule({ providers: [provideDanishLocale(), { provide: RsvpService, useValue: { submit } }] });
    fixture = TestBed.createComponent(Rsvp);
    fixture.detectChanges();
    el = fixture.nativeElement;
  });

  const query = <T extends Element>(selector: string) => el.querySelector<T>(selector);
  const toast = () => TestBed.inject(ToastService).current();
  const formIsEmpty = () =>
    query<HTMLInputElement>('#rsvp-name')!.value === '' &&
    query<HTMLTextAreaElement>('#rsvp-message')!.value === '' &&
    !el.querySelector('.toggle button.on');
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

  it('asks for a first and last name', async () => {
    type('#rsvp-name', 'Anna');
    clickButton('Desværre ikke');
    await submitForm();
    expect(text()).toContain('Skriv venligst dit fulde navn (fornavn og efternavn)');
    expect(text()).not.toContain('Skriv venligst dit navn');
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
    type('#rsvp-name', 'Anna Hansen');
    clickButton('Ja, jeg kommer');
    type('#rsvp-count', '11');
    await submitForm();
    expect(text()).toContain('Vælg mellem 1 og 10 personer');
    expect(submit).not.toHaveBeenCalled();
  });

  it('ignores an invalid count once the guest declines', async () => {
    type('#rsvp-name', 'Anna Hansen');
    clickButton('Ja, jeg kommer');
    type('#rsvp-count', '');
    clickButton('Desværre ikke');
    await submitForm();
    expect(submit).toHaveBeenCalledWith({ name: 'Anna Hansen', attending: false, count: 0, message: '' });
  });

  it('rejects a message longer than 500 characters', async () => {
    type('#rsvp-name', 'Anna Hansen');
    clickButton('Desværre ikke');
    fixture.componentInstance.form.controls.message.setValue('x'.repeat(501));
    await submitForm();
    expect(text()).toContain('Højst 500 tegn');
    expect(submit).not.toHaveBeenCalled();
  });

  it('sends the trimmed values', async () => {
    type('#rsvp-name', '  Anna   Hansen  ');
    clickButton('Ja, jeg kommer');
    type('#rsvp-count', '2');
    type('#rsvp-message', '  Glæder mig  ');
    await submitForm();
    expect(submit).toHaveBeenCalledWith({ name: 'Anna Hansen', attending: true, count: 2, message: 'Glæder mig' });
  });

  it('disables the button while sending and ignores a second submit', async () => {
    let finish!: () => void;
    submit.mockReturnValue(new Promise(resolve => (finish = () => resolve({ updated: false }))));
    type('#rsvp-name', 'Anna Hansen');
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

  it('keeps the honeypot free of labels that browsers autofill', () => {
    const honeypot = query<HTMLInputElement>('.hp input')!;
    const label = query('.hp label')!;
    const hints = [honeypot.id, honeypot.name, honeypot.getAttribute('autocomplete') ?? '', label.textContent ?? '']
      .join(' ')
      .toLowerCase();
    for (const word of ['website', 'url', 'email', 'mail', 'phone', 'name', 'address']) {
      expect(hints).not.toContain(word);
    }
    expect(honeypot.getAttribute('autocomplete')).toBe('off');
  });

  it('thanks an attending guest in a notification and clears the form', async () => {
    type('#rsvp-name', '  Anna Hansen ');
    clickButton('Ja, jeg kommer');
    type('#rsvp-message', 'Glæder mig');
    await submitForm();
    expect(toast()).toEqual({ kind: 'success', title: 'Tak, Anna! 🎉', message: 'Vi glæder os til at se dig til brunch.' });
    expect(query('form')).not.toBeNull();
    expect(formIsEmpty()).toBe(true);
    expect(query('#rsvp-count')).toBeNull();
    expect(text()).not.toContain('Skriv venligst dit navn');
  });

  it('answers a declining guest kindly in a notification and clears the form', async () => {
    type('#rsvp-name', 'Anna Hansen');
    clickButton('Desværre ikke');
    await submitForm();
    expect(toast()).toEqual({
      kind: 'success',
      title: 'Tak for dit svar, Anna.',
      message: 'Ærgerligt, at du ikke kan komme – vi kommer til at savne dig!',
    });
    expect(formIsEmpty()).toBe(true);
  });

  it('shows an error notification and keeps what the guest typed when sending fails', async () => {
    submit.mockRejectedValue(new Error('RSVP endpoint is not configured'));
    type('#rsvp-name', 'Anna Hansen');
    clickButton('Desværre ikke');
    await submitForm();

    expect(toast()).toEqual({
      kind: 'error',
      title: 'Dit svar blev ikke sendt.',
      message: 'Prøv igen om lidt, eller skriv til os på SMS.',
    });
    expect(query<HTMLInputElement>('#rsvp-name')!.value).toBe('Anna Hansen');
    expect(query('.toggle button.on')?.textContent).toContain('Desværre ikke');
    expect(query<HTMLButtonElement>('button[type="submit"]')!.disabled).toBe(false);
  });

  it('can be sent again after an error', async () => {
    submit.mockRejectedValueOnce(new Error('timeout'));
    type('#rsvp-name', 'Anna Hansen');
    clickButton('Desværre ikke');
    await submitForm();
    await submitForm();
    expect(submit).toHaveBeenCalledTimes(2);
    expect(toast()?.kind).toBe('success');
    expect(formIsEmpty()).toBe(true);
  });

  it('pretends success without sending when the honeypot is filled', async () => {
    type('#rsvp-name', 'Bot Botsen');
    clickButton('Desværre ikke');
    fixture.componentInstance.form.controls.website.setValue('http://spam.example');
    await submitForm();
    expect(submit).not.toHaveBeenCalled();
    expect(toast()?.title).toBe('Tak for dit svar, Bot.');
  });

  describe('when the name is already on the list', () => {
    beforeEach(() => submit.mockRejectedValueOnce(new DuplicateNameError()));

    async function sendDuplicate(attending: boolean): Promise<void> {
      type('#rsvp-name', 'Anna Hansen');
      clickButton(attending ? 'Ja, jeg kommer' : 'Desværre ikke');
      await submitForm();
    }

    it('warns and offers to update the answer, keeping what the guest typed', async () => {
      await sendDuplicate(true);
      const shown = toast()!;
      expect(shown.kind).toBe('warning');
      expect(shown.title).toBe('Anna Hansen er allerede på listen');
      expect(shown.message).toBe('Hvis det er dig, kan du opdatere dit svar. Ellers skriv venligst dit fulde navn, fx med mellemnavn.');
      expect(shown.action?.label).toBe('Opdater mit svar');
      expect(query<HTMLInputElement>('#rsvp-name')!.value).toBe('Anna Hansen');
    });

    it('updates the existing answer when asked, confirms it and clears the form', async () => {
      await sendDuplicate(false);
      submit.mockResolvedValueOnce({ updated: true });
      toast()!.action!.run();
      await new Promise(resolve => setTimeout(resolve));
      fixture.detectChanges();

      expect(submit).toHaveBeenLastCalledWith({ name: 'Anna Hansen', attending: false, count: 0, message: '' }, { update: true });
      expect(toast()).toEqual({
        kind: 'success',
        title: 'Dit svar er opdateret, Anna.',
        message: 'Ærgerligt, at du ikke kan komme – vi kommer til at savne dig!',
      });
      expect(formIsEmpty()).toBe(true);
    });

    it('shows the error notification if the update fails', async () => {
      await sendDuplicate(true);
      submit.mockRejectedValueOnce(new Error('timeout'));
      toast()!.action!.run();
      await new Promise(resolve => setTimeout(resolve));
      fixture.detectChanges();
      expect(toast()?.kind).toBe('error');
      expect(query<HTMLInputElement>('#rsvp-name')!.value).toBe('Anna Hansen');
    });
  });
});

import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, ReactiveFormsModule, ValidatorFn, Validators } from '@angular/forms';
import { invitation } from '../../invitation.config';
import { DuplicateNameError, RsvpResponse, RsvpService } from '../../services/rsvp.service';
import { ToastService } from '../../services/toast.service';

type RsvpState = 'idle' | 'sending';
type Field = 'name' | 'attending' | 'count' | 'message';

const notBlank: ValidatorFn = control => (typeof control.value === 'string' && control.value.trim() !== '' ? null : { required: true });

/** First and last name, so two guests called Kasper don't end up as the same row. */
const fullName: ValidatorFn = control =>
  typeof control.value === 'string' && control.value.trim().split(/\s+/).length < 2 && control.value.trim() !== ''
    ? { fullName: true }
    : null;

const tidyName = (name: string) => name.trim().replace(/\s+/g, ' ');
const firstName = (name: string) => name.split(' ')[0];

@Component({
  imports: [ReactiveFormsModule, DatePipe],
  selector: 'app-rsvp',
  styleUrl: './rsvp.scss',
  templateUrl: './rsvp.html',
})
export class Rsvp {
  private readonly rsvp = inject(RsvpService);
  private readonly toasts = inject(ToastService);
  private readonly submitAttempted = signal(false);

  protected readonly deadline = invitation.rsvpDeadline;

  public readonly state = signal<RsvpState>('idle');

  public readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [notBlank, fullName, Validators.maxLength(100)] }),
    attending: new FormControl<boolean | null>(null, Validators.required),
    count: new FormControl(1, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(1), Validators.max(10), Validators.pattern(/^\d+$/)],
    }),
    message: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(500)] }),
    website: new FormControl('', { nonNullable: true }),
  });

  constructor() {
    // The people count only matters for guests who are coming; a disabled control is excluded from validation.
    this.form.controls.attending.valueChanges.pipe(takeUntilDestroyed()).subscribe(attending => {
      if (attending === false) {
        this.form.controls.count.disable();
      } else {
        this.form.controls.count.enable();
      }
    });
  }

  public setAttending(value: boolean): void {
    this.form.controls.attending.setValue(value);
    this.form.controls.attending.markAsTouched();
  }

  public showError(field: Field): boolean {
    const control = this.form.controls[field];
    return control.invalid && (control.touched || this.submitAttempted());
  }

  public async submit(): Promise<void> {
    if (this.state() === 'sending') {
      return;
    }

    this.submitAttempted.set(true);
    this.form.markAllAsTouched();

    if (this.form.invalid) {
      return;
    }

    const { name, attending, count, message, website } = this.form.getRawValue();
    const isAttending = attending === true;
    const response: RsvpResponse = {
      name: tidyName(name),
      attending: isAttending,
      count: isAttending ? count : 0,
      message: message.trim(),
    };

    if (website) {
      this.succeed(response, false);
      return;
    }

    await this.send(response, false);
  }

  private async send(response: RsvpResponse, update: boolean): Promise<void> {
    this.state.set('sending');

    try {
      const result = await (update ? this.rsvp.submit(response, { update: true }) : this.rsvp.submit(response));
      this.succeed(response, result.updated);
    } catch (error) {
      // In both cases keep what the guest typed, so they can correct it or simply press send again.
      if (error instanceof DuplicateNameError) {
        this.toasts.show({
          kind: 'warning',
          title: `${response.name} er allerede på listen`,
          message: 'Hvis det er dig, kan du opdatere dit svar. Ellers skriv venligst dit fulde navn, fx med mellemnavn.',
          action: { label: 'Opdater mit svar', run: () => void this.send(response, true) },
        });
      } else {
        this.toasts.show({ kind: 'error', title: 'Dit svar blev ikke sendt.', message: 'Prøv igen om lidt, eller skriv til os på SMS.' });
      }
    } finally {
      this.state.set('idle');
    }
  }

  /** Thank the guest (by first name) in a notification and clear the form for the next person. */
  private succeed(response: RsvpResponse, updated: boolean): void {
    const name = firstName(response.name);
    const message = response.attending
      ? 'Vi glæder os til at se dig til brunch.'
      : 'Ærgerligt, at du ikke kan komme – vi kommer til at savne dig!';
    const title = updated ? `Dit svar er opdateret, ${name}.` : response.attending ? `Tak, ${name}! 🎉` : `Tak for dit svar, ${name}.`;

    this.toasts.show({ kind: 'success', title, message });
    this.form.reset();
    this.submitAttempted.set(false);
  }
}

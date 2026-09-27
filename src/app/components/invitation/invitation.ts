import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { invitation } from '../../invitation.config';
import { CountdownService } from '../../services/countdown.service';

@Component({
  imports: [DatePipe],
  selector: 'app-invitation',
  styleUrl: './invitation.scss',
  templateUrl: './invitation.html',
})
export class InvitationDetails {
  protected readonly invitation = invitation;
  protected readonly remaining = inject(CountdownService).remaining;

  protected pad(value: number): string {
    return value.toString().padStart(2, '0');
  }
}

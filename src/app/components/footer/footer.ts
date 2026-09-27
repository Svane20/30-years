import { Component } from '@angular/core';
import { invitation } from '../../invitation.config';

@Component({
  selector: 'app-footer',
  styleUrl: './footer.scss',
  templateUrl: './footer.html',
})
export class Footer {
  protected readonly year = invitation.date.getFullYear();
}

import { inject, Injectable, InjectionToken } from '@angular/core';
import { invitation } from '../invitation.config';

export interface RsvpResponse {
  name: string;
  attending: boolean;
  count: number;
  message: string;
}

export const RSVP_ENDPOINT = new InjectionToken<string>('RSVP_ENDPOINT', {
  providedIn: 'root',
  factory: () => invitation.rsvpEndpoint,
});

export const RSVP_TIMEOUT_MS = 10_000;

function isAccepted(body: unknown): boolean {
  return typeof body === 'object' && body !== null && (body as Record<string, unknown>)['ok'] === true;
}

@Injectable({ providedIn: 'root' })
export class RsvpService {
  private readonly endpoint = inject(RSVP_ENDPOINT);

  public async submit(response: RsvpResponse): Promise<void> {
    if (!this.endpoint) {
      throw new Error('RSVP endpoint is not configured');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), RSVP_TIMEOUT_MS);

    try {
      // text/plain keeps this a CORS "simple request"; Apps Script cannot answer a preflight.
      const res = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ ...response, count: response.attending ? response.count : 0 }),
        signal: controller.signal,
      });
      const body: unknown = await res.json().catch(() => null);

      if (!res.ok || !isAccepted(body)) {
        throw new Error('RSVP was not accepted');
      }
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

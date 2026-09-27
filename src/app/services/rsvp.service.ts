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

// Apps Script cold starts were measured at ~17 s (then ~1.5 s warm), and the script may wait up to
// 10 s for its lock, so a shorter timeout reports errors for answers that were actually saved.
export const RSVP_TIMEOUT_MS = 30_000;

/** The name is already on the list; resend with `{ update: true }` to replace that answer. */
export class DuplicateNameError extends Error {
  constructor() {
    super('This name is already on the list');
    this.name = 'DuplicateNameError';
  }
}

export interface RsvpResult {
  /** True when an existing answer with the same name was replaced. */
  updated: boolean;
}

function field(body: unknown, key: string): unknown {
  return typeof body === 'object' && body !== null ? (body as Record<string, unknown>)[key] : undefined;
}

@Injectable({ providedIn: 'root' })
export class RsvpService {
  private readonly endpoint = inject(RSVP_ENDPOINT);

  public async submit(response: RsvpResponse, options: { update?: boolean } = {}): Promise<RsvpResult> {
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
        body: JSON.stringify({ ...response, count: response.attending ? response.count : 0, ...(options.update ? { update: true } : {}) }),
        signal: controller.signal,
      });
      const body: unknown = await res.json().catch(() => null);

      if (res.ok && field(body, 'error') === 'duplicate') {
        throw new DuplicateNameError();
      }
      if (!res.ok || field(body, 'ok') !== true) {
        throw new Error('RSVP was not accepted');
      }

      return { updated: field(body, 'updated') === true };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

import { TestBed } from '@angular/core/testing';
import { DuplicateNameError, RSVP_ENDPOINT, RSVP_TIMEOUT_MS, RsvpResponse, RsvpService } from './rsvp.service';

const ENDPOINT = 'https://script.google.com/macros/s/test/exec';
const response: RsvpResponse = { name: 'Anna', attending: true, count: 2, message: 'Glæder mig' };

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('RsvpService', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  function setup(endpoint = ENDPOINT): RsvpService {
    TestBed.configureTestingModule({ providers: [{ provide: RSVP_ENDPOINT, useValue: endpoint }] });
    return TestBed.inject(RsvpService);
  }

  beforeEach(() => {
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('POSTs the response as text/plain JSON to avoid a CORS preflight', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await setup().submit(response);

    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe(ENDPOINT);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ 'Content-Type': 'text/plain;charset=utf-8' });
    expect(JSON.parse(init.body)).toEqual(response);
  });

  it('sends count 0 when not attending', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await setup().submit({ ...response, attending: false, count: 4 });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).count).toBe(0);
  });

  it('resolves as a new answer when the server answers ok: true', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await expect(setup().submit(response)).resolves.toEqual({ updated: false });
  });

  it('rejects with DuplicateNameError when the name is already on the list', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, error: 'duplicate' }));
    await expect(setup().submit(response)).rejects.toBeInstanceOf(DuplicateNameError);
  });

  it('asks the server to update the existing answer, and reports that it did', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true, updated: true }));
    await expect(setup().submit(response, { update: true })).resolves.toEqual({ updated: true });
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ ...response, update: true });
  });

  it('does not send the update flag for a normal answer', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }));
    await setup().submit(response);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).not.toHaveProperty('update');
  });

  it('rejects with a plain error when the server answers ok: false for another reason', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: false, error: 'invalid name' }));
    const rejection = setup().submit(response);
    await expect(rejection).rejects.toThrow();
    await expect(rejection).rejects.not.toBeInstanceOf(DuplicateNameError);
  });

  it('rejects when the response is not JSON', async () => {
    fetchMock.mockResolvedValue(new Response('<html>Error</html>', { status: 200 }));
    await expect(setup().submit(response)).rejects.toThrow();
  });

  it('rejects on an HTTP error status', async () => {
    fetchMock.mockResolvedValue(jsonResponse({ ok: true }, 500));
    await expect(setup().submit(response)).rejects.toThrow();
  });

  it('rejects on a network error', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    await expect(setup().submit(response)).rejects.toThrow();
  });

  it('rejects after the timeout when the server never answers', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((_resolve, reject) => {
          init.signal?.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
        }),
    );

    const assertion = expect(setup().submit(response)).rejects.toThrow();
    await vi.advanceTimersByTimeAsync(RSVP_TIMEOUT_MS);
    await assertion;
  });

  it('waits out a slow Apps Script cold start instead of reporting an error', async () => {
    vi.useFakeTimers();
    fetchMock.mockImplementation(
      (_url: string, init: RequestInit) =>
        new Promise((resolve, reject) => {
          const timer = setTimeout(() => resolve(jsonResponse({ ok: true })), 17_000); // measured on the live script
          init.signal?.addEventListener('abort', () => {
            clearTimeout(timer);
            reject(new DOMException('Aborted', 'AbortError'));
          });
        }),
    );

    const submitted = setup().submit(response);
    const outcome = submitted.then(
      () => 'resolved',
      () => 'rejected',
    );
    await vi.advanceTimersByTimeAsync(17_000);
    expect(await outcome).toBe('resolved');
  });

  it('rejects without calling fetch when the endpoint is empty', async () => {
    await expect(setup('').submit(response)).rejects.toThrow('RSVP endpoint is not configured');
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

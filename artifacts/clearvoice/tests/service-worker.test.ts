import fs from 'node:fs';
import path from 'node:path';
import { runInNewContext } from 'node:vm';
import { describe, expect, it, vi } from 'vitest';

type RequestLike = { method: string; url: string; mode: string };
type ServiceWorkerEvent = {
  request?: RequestLike;
  waitUntil: (promise: Promise<unknown>) => void;
  respondWith: (promise: Promise<Response>) => void;
};

function createServiceWorkerHarness() {
  const handlers = new Map<string, (event: ServiceWorkerEvent) => void>();
  const storedResponses = new Map<string, Response>();
  const fetchMock = vi.fn(async (request: RequestLike | string) => {
    const requestUrl = typeof request === 'string' ? request : request.url;
    if (requestUrl.endsWith('/index.html') || requestUrl.endsWith('/clearvoice/')) {
      return new Response('<html><link href="/clearvoice/assets/app.css"><script src="/clearvoice/assets/app.js"></script></html>', {
        headers: { 'content-type': 'text/html' },
      });
    }
    return new Response('asset');
  });
  const cache = {
    put: vi.fn(async (request: string | RequestLike, response: Response) => {
      storedResponses.set(typeof request === 'string' ? request : request.url, response.clone());
    }),
    addAll: vi.fn(async (urls: string[]) => {
      for (const url of urls) {
        const response = await fetchMock({ method: 'GET', mode: 'no-cors', url });
        storedResponses.set(url, response.clone());
      }
    }),
    match: vi.fn(async (request: string | RequestLike) => {
      const response = storedResponses.get(typeof request === 'string' ? request : request.url);
      return response?.clone();
    }),
  };
  const cachesApi = {
    open: vi.fn(async () => cache),
    match: cache.match,
    keys: vi.fn(async () => ['clearvoice-shell-v1']),
    delete: vi.fn(async () => true),
  };
  const self = {
    location: new URL('http://localhost/clearvoice/sw.js'),
    registration: { scope: 'http://localhost/clearvoice/' },
    addEventListener: vi.fn((type: string, handler: (event: ServiceWorkerEvent) => void) => {
      handlers.set(type, handler);
    }),
    skipWaiting: vi.fn(async () => undefined),
    clients: { claim: vi.fn(async () => undefined) },
  };

  const source = fs.readFileSync(path.resolve(import.meta.dirname, '../public/sw.js'), 'utf8');
  runInNewContext(source, {
    self,
    caches: cachesApi,
    fetch: fetchMock,
    URL,
    Response,
    console,
    Set,
  });

  return { handlers, cache, fetchMock, storedResponses };
}

describe('service worker runtime behavior', () => {
  it('installs the built shell and reopens navigation while offline', async () => {
    const harness = createServiceWorkerHarness();
    let installPromise: Promise<unknown> | undefined;
    harness.handlers.get('install')?.({
      waitUntil: (promise) => { installPromise = promise; },
      respondWith: () => undefined,
    });
    await installPromise;

    expect(harness.storedResponses.has('http://localhost/clearvoice/')).toBe(true);
    expect(harness.storedResponses.has('http://localhost/clearvoice/assets/app.js')).toBe(true);
    expect(harness.cache.addAll).toHaveBeenCalled();

    harness.fetchMock.mockRejectedValueOnce(new Error('offline'));
    let navigationResponse: Promise<Response> | undefined;
    harness.handlers.get('fetch')?.({
      request: { method: 'GET', mode: 'navigate', url: 'http://localhost/clearvoice/' },
      waitUntil: () => undefined,
      respondWith: (promise) => { navigationResponse = promise; },
    });
    const response = await navigationResponse;
    expect(response).toBeInstanceOf(Response);
    expect(await response?.text()).toContain('<html>');
  });

  it('does not turn an offline asset failure into application HTML', async () => {
    const harness = createServiceWorkerHarness();
    harness.fetchMock.mockRejectedValueOnce(new Error('offline'));
    let assetResponse: Promise<Response> | undefined;
    harness.handlers.get('fetch')?.({
      request: { method: 'GET', mode: 'no-cors', url: 'http://localhost/clearvoice/assets/missing.js' },
      waitUntil: () => undefined,
      respondWith: (promise) => { assetResponse = promise; },
    });

    await expect(assetResponse).rejects.toThrow('offline');
    expect(harness.cache.match).toHaveBeenCalled();
  });
});
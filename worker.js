import { onRequestPost as checkout } from './functions/api/checkout.js';
import { onRequestPost as billplzSetup } from './functions/api/billplz-setup.js';
import { onRequestPost as billplzCallback } from './functions/api/billplz-callback.js';
import { onRequestGet as paymentStatus } from './functions/api/payment-status.js';

function methodNotAllowed(allowed) {
  return new Response('Method Not Allowed', {
    status: 405,
    headers: { Allow: allowed, 'cache-control': 'no-store' }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const context = { request, env };

    if (url.pathname === '/api/checkout') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return checkout(context);
    }

    if (url.pathname === '/api/billplz-setup') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return billplzSetup(context);
    }

    if (url.pathname === '/api/billplz-callback') {
      if (request.method !== 'POST') return methodNotAllowed('POST');
      return billplzCallback(context);
    }

    if (url.pathname === '/api/payment-status') {
      if (request.method !== 'GET') return methodNotAllowed('GET');
      return paymentStatus(context);
    }

    return env.ASSETS.fetch(request);
  }
};

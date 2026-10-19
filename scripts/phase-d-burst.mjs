/**
 * Phase D burst probes — local rate-limit + catalogue load, mild prod catalogue only.
 * Usage:
 *   node scripts/phase-d-burst.mjs                 # local :4000
 *   node scripts/phase-d-burst.mjs --prod-shop     # mild prod product GETs only
 */
import { writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = new Set(process.argv.slice(2));
const PROD_SHOP = args.has('--prod-shop');
const LOCAL = 'http://localhost:4000';
const PROD = 'https://api-production-6622e.up.railway.app';

function summarize(statuses) {
  const counts = {};
  for (const s of statuses) counts[s] = (counts[s] || 0) + 1;
  return counts;
}

async function burst(label, count, concurrency, makeRequest) {
  const started = Date.now();
  const statuses = [];
  const latencies = [];
  let i = 0;

  async function worker() {
    while (i < count) {
      const n = i++;
      const t0 = Date.now();
      try {
        const res = await makeRequest(n);
        statuses.push(res.status);
        latencies.push(Date.now() - t0);
      } catch (error) {
        statuses.push(`ERR:${error.cause?.code || error.message}`);
        latencies.push(Date.now() - t0);
      }
    }
  }

  await Promise.all(Array.from({ length: Math.min(concurrency, count) }, () => worker()));
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.5)] ?? 0;
  const p95 = sorted[Math.floor(sorted.length * 0.95)] ?? 0;
  const max = sorted.at(-1) ?? 0;

  return {
    label,
    count,
    concurrency,
    elapsedMs: Date.now() - started,
    statuses: summarize(statuses),
    latencyMs: { p50, p95, max },
  };
}

async function runLocal() {
  const base = LOCAL;
  const health = await fetch(`${base}/api/health`).then((r) => r.json()).catch((e) => ({ error: String(e) }));

  const contact = await burst('local contact POST (expect 200 then 429 @6)', 8, 4, async (n) =>
    fetch(`${base}/api/contact`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.50',
      },
      body: JSON.stringify({
        name: 'Phase D Probe',
        email: `phase-d-${n}@example.com`,
        subject: 'Burst test',
        message: 'Automated Phase D contact rate-limit probe. Please ignore.',
      }),
    }),
  );

  const login = await burst('local login POST (expect 401 then 429 @21)', 25, 8, async (n) =>
    fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.51',
      },
      body: JSON.stringify({
        email: `phase-d-login-${n}@example.com`,
        password: 'wrong-password-phase-d',
      }),
    }),
  );

  const checkout = await burst('local checkout POST (expect 4xx then 429 @11)', 14, 6, async () =>
    fetch(`${base}/api/checkout`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-forwarded-for': '203.0.113.52',
      },
      body: JSON.stringify({
        items: [{ productId: 'missing-product', quantity: 1 }],
        email: 'phase-d-checkout@example.com',
        shippingAddress: {
          name: 'Phase D',
          line1: 'Test Street 1',
          city: 'Båstad',
          postalCode: '26936',
          country: 'SE',
        },
      }),
    }),
  );

  const shop = await burst('local products GET ×40 parallel', 40, 20, async (n) =>
    fetch(`${base}/api/products?limit=12&offset=${(n % 3) * 12}`),
  );

  return { target: base, health, results: [contact, login, checkout, shop] };
}

async function runProdShopMild() {
  const base = PROD;
  const health = await fetch(`${base}/api/health`).then((r) => r.json());
  const shop = await burst('prod products GET ×25 concurrency 10 (mild)', 25, 10, async (n) =>
    fetch(`${base}/api/products?limit=8&offset=${(n % 4) * 8}`),
  );
  const meta = await burst('prod products/meta ×10', 10, 5, async () =>
    fetch(`${base}/api/products/meta`),
  );
  return { target: base, health, results: [shop, meta], note: 'No contact/auth/checkout bursts against production.' };
}

function evaluate(report) {
  const findings = [];
  for (const r of report.results) {
    const s = r.statuses;
    if (r.label.includes('contact')) {
      if ((s[429] || 0) < 1) findings.push('WARN: contact did not 429 after burst (limit 5/15m)');
      else findings.push('OK: contact rate limit tripped');
    }
    if (r.label.includes('login')) {
      if ((s[429] || 0) < 1) findings.push('WARN: login did not 429 after burst (limit 20/15m)');
      else findings.push('OK: auth rate limit tripped');
    }
    if (r.label.includes('checkout')) {
      if ((s[429] || 0) < 1) findings.push('WARN: checkout did not 429 after burst (limit 10/15m)');
      else findings.push('OK: checkout rate limit tripped');
    }
    if (r.label.includes('products')) {
      const ok = (s[200] || 0) + (s[304] || 0);
      const err = Object.entries(s).filter(([k]) => k.startsWith('ERR') || Number(k) >= 500);
      if (err.length) findings.push(`WARN: shop errors ${JSON.stringify(Object.fromEntries(err))}`);
      else if (ok === r.count) findings.push(`OK: shop ${ok}/${r.count} HTTP 200 (p95 ${r.latencyMs.p95}ms)`);
      else findings.push(`INFO: shop statuses ${JSON.stringify(s)}`);
    }
  }
  return findings;
}

const report = PROD_SHOP ? await runProdShopMild() : await runLocal();
report.ranAt = new Date().toISOString();
report.findings = evaluate(report);

const outDir = path.join(__dirname, 'results');
const outFile = path.join(
  outDir,
  PROD_SHOP ? 'phase-d-burst-prod-shop.json' : 'phase-d-burst-local.json',
);
await writeFile(outFile, JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, null, 2));
console.log(`\nWrote ${outFile}`);

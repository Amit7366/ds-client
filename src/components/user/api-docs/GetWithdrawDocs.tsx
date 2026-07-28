'use client';

import { useEffect, useMemo, useState } from 'react';
import { CodeExamples, type CodeLanguage } from './CodeExamples';
import { RequestBodySchema, type SchemaField } from './RequestBodySchema';

function getAppOrigin() {
  if (typeof window !== 'undefined') return window.location.origin;
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}

const REQUEST_FIELDS: SchemaField[] = [
  {
    name: 'apiSecret',
    type: 'STRING',
    required: true,
    description:
      'Your API secret from the dashboard. Treat this like a password — never expose it in frontend code.',
  },
  {
    name: 'prefix',
    type: 'STRING',
    required: true,
    description: 'Your unique 5-character account prefix from the dashboard.',
  },
  {
    name: 'playerId',
    type: 'STRING',
    required: true,
    description:
      'Player identifier on your platform. Sent upstream as member_account with provider formatting applied server-side (same as Game Launch).',
  },
  {
    name: 'balance',
    type: 'NUMBER',
    required: true,
    description: 'Credit amount for the withdraw request (maps to credit_amount). Default: 0.',
  },
  {
    name: 'currencyCode',
    type: 'STRING',
    required: true,
    description: 'Currency code. Maps to currency_code. Default: BDT.',
  },
  {
    name: 'language',
    type: 'STRING',
    required: true,
    description: 'UI language code. Default: en.',
  },
  {
    name: 'homeUrl',
    type: 'STRING',
    required: true,
    description: 'Return / home URL. Maps to home_url. Default: http://localhost:3000.',
  },
  {
    name: 'platform',
    type: 'NUMBER',
    required: true,
    description: 'Platform identifier. Default: 1.',
  },
  {
    name: 'timestamp',
    type: 'STRING | NUMBER',
    required: true,
    description:
      'Unix ms or ISO-8601. Converted to ISO-8601 UTC for the provider. Default: current time.',
  },
  {
    name: 'transfer_id',
    type: 'STRING',
    required: true,
    description: 'Unique transfer reference. Default: auto-generated tx_<random>.',
  },
];

function buildLanguages(endpointUrl: string): {
  id: CodeLanguage;
  label: string;
  code: string;
}[] {
  const sampleBody = `{
    "apiSecret": "YOUR_API_SECRET",
    "prefix": "ABC12",
    "playerId": "player_1001",
    "balance": 0,
    "currencyCode": "INR",
    "language": "en",
    "homeUrl": "https://your-site.com/lobby",
    "platform": 2,
    "timestamp": "2026-07-28T17:40:00Z",
    "transfer_id": "tx_withdraw001"
  }`;

  return [
    {
      id: 'curl',
      label: 'cURL',
      code: `curl -X POST '${endpointUrl}' \\
  -H 'Content-Type: application/json' \\
  -d '${sampleBody.replace(/\n/g, '\\n')}'`,
    },
    {
      id: 'javascript',
      label: 'JavaScript',
      code: `const response = await fetch("${endpointUrl}", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    apiSecret: process.env.API_SECRET,
    prefix: "ABC12",
    playerId: "player_1001",
    balance: 0,
    currencyCode: "INR",
    language: "en",
    homeUrl: "https://your-site.com/lobby",
    platform: 2,
    timestamp: new Date().toISOString(),
    transfer_id: "tx_withdraw001",
  }),
});

const data = await response.json();

if (!data.success) {
  throw new Error(data.message || "Withdraw failed");
}

console.log(data.data.amount);`,
    },
    {
      id: 'nodejs',
      label: 'Node.js',
      code: `const payload = {
  apiSecret: process.env.API_SECRET,
  prefix: "ABC12",
  playerId: "player_1001",
  balance: 0,
  currencyCode: "INR",
  language: "en",
  homeUrl: "https://your-site.com/lobby",
  platform: 2,
  timestamp: new Date().toISOString(),
  transfer_id: "tx_withdraw001",
};

const response = await fetch("${endpointUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const data = await response.json();
if (!response.ok || !data.success) {
  throw new Error(data.message || "Withdraw failed");
}

console.log(data.data.amount);`,
    },
  ];
}

const SUCCESS_CODE = `{
  "success": true,
  "message": "Withdraw successful",
  "data": {
    "amount": "100.0",
    "status": true,
    "message": "✅ Withdraw successful"
  }
}`;

const ERRORS_CODE = `// 502 — Currency mismatch (must match Game Launch currency)
{
  "success": false,
  "message": "❌ Balance fetch failed",
  "details": {
    "status": false,
    "message": "❌ Balance fetch failed",
    "error": "Player currencies do not match USD,Players cannot change the currency."
  }
}

// 502 — Nothing left to withdraw
{
  "success": false,
  "message": "No balance to withdraw."
}

// 400 — Validation failed
{
  "success": false,
  "message": "Validation failed",
  "details": {
    "playerId": ["playerId is required"]
  }
}

// 401 — Invalid credentials
{
  "success": false,
  "message": "Invalid prefix or API secret"
}

// 403 — Account paused
{
  "success": false,
  "message": "Account is paused"
}`;

export function GetWithdrawDocs() {
  const [origin, setOrigin] = useState(
    () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  );

  useEffect(() => {
    setOrigin(getAppOrigin());
  }, []);

  const endpointUrl = `${origin}/api/game/v1/getwithdraw`;
  const languages = useMemo(() => buildLanguages(endpointUrl), [endpointUrl]);

  return (
    <div className="space-y-10">
      <section className="surface-card-premium p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-md bg-[var(--accent-soft)] px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-[var(--accent)]">
            POST
          </span>
          <code className="break-all font-mono text-sm text-[var(--fg)]">{endpointUrl}</code>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-[var(--fg-muted)]">
          Authenticate with your dashboard <strong className="text-[var(--fg)]">prefix</strong> and{' '}
          <strong className="text-[var(--fg)]">apiSecret</strong>. Pass a normal{' '}
          <code className="font-mono text-xs">playerId</code> — member account formatting is applied
          server-side (same as Game Launch). On success,{' '}
          <code className="font-mono text-xs">data.amount</code> is the withdrawn amount.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--fg-muted)]">
          <li>No JWT required — use body credentials for server-to-server calls.</li>
          <li>
            Use the <strong className="text-[var(--fg)]">same currency</strong> (and preferably
            platform) as the Game Launch that funded the player. A mismatch returns provider error
            like currency do not match.
          </li>
          <li>
            Use a unique <code className="font-mono text-xs">transfer_id</code> per withdraw attempt.
          </li>
          <li>Paused accounts receive HTTP 403; invalid credentials receive HTTP 401.</li>
        </ul>
      </section>

      <CodeExamples
        endpointUrl={endpointUrl}
        languages={languages}
        successCode={SUCCESS_CODE}
        errorsCode={ERRORS_CODE}
      />

      <RequestBodySchema fields={REQUEST_FIELDS} />

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-[var(--fg)]">Responses</h3>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            On success, <code className="font-mono text-xs">data</code> includes the withdrawn{' '}
            <code className="font-mono text-xs">amount</code>.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--success)]">
              200 Success
            </p>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Read <code className="font-mono text-xs">data.amount</code> for the withdrawn balance.
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
              4xx / 502 Errors
            </p>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Validation (400), credentials (401), paused (403), or provider failure (502). Check{' '}
              <code className="font-mono text-xs">message</code> and{' '}
              <code className="font-mono text-xs">details</code>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

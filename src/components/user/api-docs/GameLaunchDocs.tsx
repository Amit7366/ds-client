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
      'Your API secret (encryption key) from the dashboard. Treat this like a password — never expose it in frontend code.',
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
      'Player identifier on your platform. Sent upstream as member_account with provider code h94044 at the start and your account prefix at the end (e.g. player_1001 + prefix ABC12 → h94044player_1001ABC12).',
  },
  {
    name: 'gameCode',
    type: 'STRING',
    required: true,
    description: 'Game identifier. Sent upstream as game_uid.',
  },
  {
    name: 'balance',
    type: 'NUMBER',
    required: true,
    description:
      'Credit amount for the session (maps to credit_amount). Requires 10% of balance ≤ your GGR balance. Default: 0.',
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
    description: 'Return URL when the player exits. Maps to home_url. Default: http://localhost:3000.',
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
    description:
      'Unique transfer reference. Default: auto-generated tx_<random>. Reusing the same id returns error 10027.',
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
    "gameCode": "sweet-bonanza",
    "playerId": "player_1001",
    "balance": 100.5,
    "currencyCode": "BDT",
    "language": "en",
    "homeUrl": "https://your-site.com/lobby",
    "platform": 1,
    "timestamp": 1710000000000,
    "transfer_id": "tx_abc123"
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
    apiSecret: process.env.API_SECRET, // from your dashboard
    prefix: "ABC12",
    gameCode: "sweet-bonanza",
    playerId: "player_1001",
    balance: 100.5,
    currencyCode: "BDT",
    language: "en",
    homeUrl: "https://your-site.com/lobby",
    platform: 1,
    timestamp: Date.now(),
    transfer_id: "tx_abc123",
  }),
});

const data = await response.json();

if (!data.success) {
  throw new Error(data.message || "Game launch failed");
}

// Redirect the player to the launch URL
window.location.href = data.data.game_launch_url;`,
    },
    {
      id: 'nodejs',
      label: 'Node.js',
      code: `const payload = {
  apiSecret: process.env.API_SECRET,
  prefix: "ABC12",
  gameCode: "sweet-bonanza",
  playerId: "player_1001",
  balance: 100.5,
  currencyCode: "BDT",
  language: "en",
  homeUrl: "https://your-site.com/lobby",
  platform: 1,
  timestamp: Date.now(),
  transfer_id: "tx_abc123",
};

const response = await fetch("${endpointUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const data = await response.json();
if (!response.ok || !data.success) {
  throw new Error(data.message || "Game launch failed");
}

console.log(data.data.game_launch_url);`,
    },
  ];
}

const SUCCESS_CODE = `{
  "success": true,
  "message": "Game launch ready",
  "data": {
    "transaction_id": "75035507475ae21df91848d0c16e2bcf",
    "transfer_amount": "100",
    "game_launch_url": "https://jsgame.live/game/gamesUrl?id=67682958-f833-489f-bdcb-3b46fc18d304",
    "before_amount": "0.0",
    "currency": "INR",
    "transfer_id": "tx_test004",
    "transfer_status": 1,
    "after_amount": "100.0",
    "timestamp": 1785267789163
  }
}`;

const ERRORS_CODE = `// 502 — Transfer order already exists (reuse a new transfer_id)
{
  "success": false,
  "message": "The transfer order already exists",
  "details": {
    "code": 10027,
    "msg": "The transfer order already exists",
    "payload": {
      "currency": "INR",
      "timestamp": 1785260928369,
      "transfer_amount": "100",
      "before_amount": "0.0",
      "after_amount": "100.0",
      "transfer_id": "tx_test003",
      "transaction_id": "859176ebf6689d339b6f91018490d833",
      "transfer_status": 1
    }
  }
}

// 502 — Game is not available
{
  "success": false,
  "message": "Game is not available : …",
  "details": {
    "code": 10017,
    "msg": "Game is not available : …",
    "payload": ""
  }
}

// 400 — 10% of balance exceeds GGR balance
{
  "success": false,
  "message": "Balance exceeds available GGR balance",
  "details": {
    "balance": 500,
    "ggrRequired": 50,
    "ggrBalance": 100
  }
}

// 400 — Validation failed
{
  "success": false,
  "message": "Validation failed",
  "details": {
    "gameCode": ["gameCode is required"]
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

export function GameLaunchDocs() {
  const [origin, setOrigin] = useState(
    () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  );

  useEffect(() => {
    setOrigin(getAppOrigin());
  }, []);

  const endpointUrl = `${origin}/api/game/v1/gamelaunch`;
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
          <strong className="text-[var(--fg)]">apiSecret</strong>. After validation, the server returns the final session{' '}
          <code className="font-mono text-xs">payload</code>.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--fg-muted)]">
          <li>No JWT required — use body credentials for server-to-server calls.</li>
          {/* <li>
            Field mapping: <code className="font-mono text-xs">playerId</code> →{' '}
            <code className="font-mono text-xs">member_account</code> as{' '}
            <code className="font-mono text-xs">h94044</code> + playerId + your{' '}
            <code className="font-mono text-xs">prefix</code>,{' '}
            <code className="font-mono text-xs">gameCode</code> →{' '}
            <code className="font-mono text-xs">game_uid</code>,{' '}
            <code className="font-mono text-xs">balance</code> →{' '}
            <code className="font-mono text-xs">credit_amount</code>, etc.
          </li> */}
          <li>
            <code className="font-mono text-xs">balance</code> — 10% of balance cannot exceed your
            account GGR balance (HTTP 400).
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
            On success, <code className="font-mono text-xs">data</code> is the provider{' '}
            <code className="font-mono text-xs">payload</code>.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--success)]">
              200 Success
            </p>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Redirect the player to{' '}
              <code className="font-mono text-xs">data.game_launch_url</code>. Other fields include
              balances, currency, and transfer status.
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

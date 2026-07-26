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
      'Your API secret from the dashboard. Never expose it in frontend or client-side code.',
  },
  {
    name: 'prefix',
    type: 'STRING',
    required: true,
    description:
      'Your unique 5-character account prefix. Results are always scoped to this prefix only.',
  },
  {
    name: 'fromDate',
    type: 'STRING',
    required: false,
    description:
      'Optional lower bound for timestamp (inclusive). Use the same format as stored records, e.g. 2026-07-26 00:00:00.',
  },
  {
    name: 'toDate',
    type: 'STRING',
    required: false,
    description:
      'Optional upper bound for timestamp (inclusive). Use the same format as stored records, e.g. 2026-07-26 23:59:59.',
  },
  {
    name: 'member_account',
    type: 'STRING',
    required: false,
    description: 'Optional filter for a single player member_account.',
  },
  {
    name: 'game_uid',
    type: 'STRING',
    required: false,
    description: 'Optional filter for a specific game_uid.',
  },
  {
    name: 'page',
    type: 'NUMBER',
    required: false,
    description: 'Page number (default 1).',
  },
  {
    name: 'limit',
    type: 'NUMBER',
    required: false,
    description: 'Page size (default 50, max 200).',
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
    "fromDate": "2026-07-26 00:00:00",
    "toDate": "2026-07-26 23:59:59",
    "page": 1,
    "limit": 50
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
    fromDate: "2026-07-26 00:00:00",
    toDate: "2026-07-26 23:59:59",
    page: 1,
    limit: 50,
  }),
});

const data = await response.json();

if (!data.success) {
  throw new Error(data.message || "Fetch failed");
}

console.log(data.data.items);
console.log(data.data.pagination);`,
    },
    {
      id: 'nodejs',
      label: 'Node.js',
      code: `const payload = {
  apiSecret: process.env.API_SECRET,
  prefix: "ABC12",
  fromDate: "2026-07-26 00:00:00",
  toDate: "2026-07-26 23:59:59",
  page: 1,
  limit: 50,
};

const response = await fetch("${endpointUrl}", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify(payload),
});

const data = await response.json();
if (!response.ok || !data.success) {
  throw new Error(data.message || "Fetch failed");
}

console.log(data.data.items);`,
    },
  ];
}

const SUCCESS_CODE = `{
  "success": true,
  "message": "Transactions fetched",
  "data": {
    "items": [
      {
        "id": "64dd1ede5bfbec88441a1a3d",
        "agency_uid": "0b98f74aa493413ce882a9edef9f9ede",
        "serial_number": "96c9d590-2906-30eb-ba2d-99405702d5c7",
        "currency_code": "BDT",
        "game_uid": "1189baca156e1bbbecc3b26651a63565",
        "member_account": "h037adplayer_1001ABC12",
        "bet_amount": "1.00",
        "win_amount": "0.00",
        "timestamp": "2026-07-26 19:41:08",
        "game_round": "17297759004325589110"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 1,
      "totalPages": 1
    }
  }
}`;

const ERRORS_CODE = `// 400 — Validation failed
{
  "success": false,
  "message": "Validation failed",
  "details": {
    "prefix": ["prefix must be 5 characters"]
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

export function FetchingGameDocs() {
  const [origin, setOrigin] = useState(
    () => process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  );

  useEffect(() => {
    setOrigin(getAppOrigin());
  }, []);

  const endpointUrl = `${origin}/api/game/v1/transactions/fetch`;
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
          Fetch ingested game bet/win records from our database for your account. Authenticate with{' '}
          <strong className="text-[var(--fg)]">prefix</strong> and{' '}
          <strong className="text-[var(--fg)]">apiSecret</strong>. Results are always limited to your
          prefix — you cannot query another account.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-[var(--fg-muted)]">
          <li>No JWT required — use body credentials for server-to-server calls.</li>
          <li>Optional date range, member_account, and game_uid filters.</li>
          <li>Paginated response with page / limit (max 200 per page).</li>
        </ul>
      </section>

      <CodeExamples
        endpointUrl={endpointUrl}
        languages={languages}
        successCode={SUCCESS_CODE}
        errorsCode={ERRORS_CODE}
      />

      <RequestBodySchema
        fields={REQUEST_FIELDS}
        subtitle="Authenticate with prefix + apiSecret, then optionally filter and page results."
      />

      <section className="space-y-4">
        <div>
          <h3 className="text-xl font-semibold tracking-tight text-[var(--fg)]">Responses</h3>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            On success, <code className="font-mono text-xs">data.items</code> is the transaction list
            and <code className="font-mono text-xs">data.pagination</code> describes paging.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--success)]">
              200 Success
            </p>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Returns bet/win rows matching your prefix (and any optional filters), newest first.
            </p>
          </div>
          <div className="surface-card p-5">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--danger)]">
              4xx Errors
            </p>
            <p className="mt-2 text-sm text-[var(--fg-muted)]">
              Validation (400), invalid credentials (401), or paused account (403).
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

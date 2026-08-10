'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, formatApiError } from '@/lib/api';
import type { CreateUserPayload, ServiceType, User, UserStatus } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { TextField, SelectField } from '@/components/ui/Field';
import { PasswordField } from '@/components/ui/PasswordField';
import { useToast } from '@/components/providers/ToastProvider';
import { IconCheck, IconCopy } from '@/components/ui/Icons';

export function CreateUserForm() {
  const router = useRouter();
  const { pushToast } = useToast();
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    whitelistDomain: '',
    whitelistIp: '',
    ggrBalance: '0',
    ggrDeductionPercent: '8',
    status: 'active' as UserStatus,
    serviceType: 'staging' as ServiceType,
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<'secret' | 'prefix' | null>(null);
  const [createdSecret, setCreatedSecret] = useState<{
    apiSecret: string;
    prefix: string;
    email: string;
  } | null>(null);

  async function copyValue(value: string, kind: 'secret' | 'prefix', label: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(kind);
      pushToast({ type: 'success', title: 'Copied', message: `${label} copied to clipboard.` });
      window.setTimeout(() => setCopied(null), 1600);
    } catch {
      pushToast({ type: 'error', title: 'Copy failed', message: 'Could not access clipboard.' });
    }
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const payload: CreateUserPayload = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        password: form.password,
        whitelistDomain: form.whitelistDomain,
        whitelistIp: form.whitelistIp,
        ggrBalance: Number(form.ggrBalance) || 0,
        ggrDeductionPercent: Number(form.ggrDeductionPercent) || 0,
        status: form.status,
        serviceType: form.serviceType,
      };
      const data = await apiFetch<{ user: User; apiSecret: string }>('/users', {
        method: 'POST',
        body: payload,
      });
      setCreatedSecret({
        apiSecret: data.apiSecret,
        prefix: data.user.prefix,
        email: data.user.email,
      });
      pushToast({
        type: 'success',
        title: 'User created',
        message: 'Copy the API secret and prefix now.',
      });
    } catch (err) {
      const message = formatApiError(err, 'Failed to create user');
      setError(message);
      pushToast({ type: 'error', title: 'Create failed', message });
    } finally {
      setLoading(false);
    }
  }

  if (createdSecret) {
    return (
      <div className="mx-auto max-w-xl space-y-4 surface-card-premium border-[var(--warning)]/25 p-6">
        <h2 className="text-xl font-semibold text-[var(--fg)]">User created</h2>
        <p className="text-sm text-[var(--fg-muted)]">
          Account <strong>{createdSecret.email}</strong> is ready.
        </p>

        <div className="flex items-center justify-between rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2.5">
          <div>
            <p className="text-xs text-[var(--fg-muted)]">Prefix</p>
            <p className="font-mono text-sm font-semibold tracking-wider">{createdSecret.prefix}</p>
          </div>
          <Button
            variant="secondary"
            onClick={() => void copyValue(createdSecret.prefix, 'prefix', 'Prefix')}
          >
            {copied === 'prefix' ? <IconCheck className="h-4 w-4" /> : <IconCopy className="h-4 w-4" />}
            Copy
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--code-bg)]">
          <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
            <span className="text-xs text-[var(--fg-muted)]">API secret</span>
            <button
              type="button"
              onClick={() => void copyValue(createdSecret.apiSecret, 'secret', 'API secret')}
              className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[var(--accent)] hover:bg-white/10"
            >
              {copied === 'secret' ? (
                <>
                  <IconCheck className="h-3.5 w-3.5" /> Copied
                </>
              ) : (
                <>
                  <IconCopy className="h-3.5 w-3.5" /> Copy
                </>
              )}
            </button>
          </div>
          <pre className="overflow-x-auto p-4 font-mono text-xs text-[var(--code-fg)]">
            {createdSecret.apiSecret}
          </pre>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button onClick={() => router.push('/super-admin')}>Back to users</Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="mx-auto max-w-xl space-y-4 rounded-2xl surface-card-premium p-6"
    >
      <div>
        <h2 className="text-xl font-semibold">Add new user</h2>
        <p className="mt-1 text-sm text-[var(--fg-muted)]">
          Prefix and API secret are generated automatically.
        </p>
      </div>

      <TextField
        label="Full name"
        name="name"
        required
        value={form.name}
        onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
      />
      <TextField
        label="Email"
        name="email"
        type="email"
        required
        value={form.email}
        onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
      />
      <TextField
        label="Phone"
        name="phone"
        required
        value={form.phone}
        onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
      />
      <PasswordField
        label="Password"
        name="password"
        autoComplete="new-password"
        required
        value={form.password}
        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
        hint="Min 8 chars, with upper, lower, and number"
      />
      <TextField
        label="Whitelist domain"
        name="whitelistDomain"
        value={form.whitelistDomain}
        onChange={(e) => setForm((f) => ({ ...f, whitelistDomain: e.target.value }))}
        placeholder="api.partner.com"
      />
      <TextField
        label="Whitelist IP"
        name="whitelistIp"
        value={form.whitelistIp}
        onChange={(e) => setForm((f) => ({ ...f, whitelistIp: e.target.value }))}
        placeholder="203.0.113.10"
      />
      <TextField
        label="GGR balance"
        name="ggrBalance"
        type="number"
        min={0}
        step="any"
        value={form.ggrBalance}
        onChange={(e) => setForm((f) => ({ ...f, ggrBalance: e.target.value }))}
        hint="Can be updated later from the users list"
      />
      <TextField
        label="GGR deduction %"
        name="ggrDeductionPercent"
        type="number"
        min={0}
        max={100}
        step={1}
        value={form.ggrDeductionPercent}
        onChange={(e) => setForm((f) => ({ ...f, ggrDeductionPercent: e.target.value }))}
        hint="Integer 0–100. Default 8. Used for launch check and loss deductions."
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <SelectField
          label="Status"
          name="status"
          value={form.status}
          onChange={(e) =>
            setForm((f) => ({ ...f, status: e.target.value as UserStatus }))
          }
        >
          <option value="active">Active</option>
          <option value="pause">Pause</option>
        </SelectField>
        <SelectField
          label="Service type"
          name="serviceType"
          value={form.serviceType}
          onChange={(e) =>
            setForm((f) => ({ ...f, serviceType: e.target.value as ServiceType }))
          }
        >
          <option value="staging">Staging</option>
          <option value="live">Live</option>
        </SelectField>
      </div>

      {error ? (
        <div className="rounded-lg border border-[var(--danger)]/30 bg-[var(--danger-soft)] px-3 py-2 text-sm text-[var(--danger)]">
          {error}
        </div>
      ) : null}

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" onClick={() => router.push('/super-admin')}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          Create user
        </Button>
      </div>
    </form>
  );
}

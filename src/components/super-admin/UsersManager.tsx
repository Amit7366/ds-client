'use client';

import { FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { apiFetch, ApiClientError } from '@/lib/api';
import type { Pagination, UpdateUserPayload, User } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { TextField, SelectField } from '@/components/ui/Field';
import { ServiceBadge, StatusBadge } from '@/components/ui/Badge';
import { useToast } from '@/components/providers/ToastProvider';
import { useVisibilityPolling } from '@/hooks/useVisibilityPolling';
import {
  IconCopy,
  IconEye,
  IconEyeOff,
  IconKey,
  IconRefresh,
  IconCheck,
} from '@/components/ui/Icons';

type SecretModalState = {
  user: User;
  apiSecret: string;
  mode: 'reveal' | 'regenerate';
} | null;

export function UsersManager() {
  const { pushToast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<User | null>(null);
  const [secretModal, setSecretModal] = useState<SecretModalState>(null);
  const [confirmRegen, setConfirmRegen] = useState<User | null>(null);
  const [revealed, setRevealed] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    password: '',
    whitelistDomain: '',
    whitelistIp: '',
    ggrBalance: '0',
    status: 'active' as User['status'],
    serviceType: 'staging' as User['serviceType'],
  });
  const [saving, setSaving] = useState(false);

  const flashCopied = (key: string) => {
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600);
  };

  const copyText = async (value: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(value);
      flashCopied(key);
      pushToast({
        type: 'success',
        title: 'Copied',
        message: `${label} copied to clipboard.`,
      });
    } catch {
      pushToast({
        type: 'error',
        title: 'Copy failed',
        message: 'Could not access the clipboard.',
      });
    }
  };

  const loadUsers = useCallback(async (q = '', options?: { silent?: boolean }) => {
    const silent = options?.silent === true;
    if (!silent) setLoading(true);
    try {
      const params = new URLSearchParams({ page: '1', limit: '50' });
      if (q) params.set('search', q);
      const data = await apiFetch<{ items: User[]; pagination: Pagination }>(
        `/users?${params.toString()}`,
      );
      setUsers(data.items);
      setPagination(data.pagination);
    } catch (err) {
      if (!silent) {
        const message = err instanceof ApiClientError ? err.message : 'Failed to load users';
        pushToast({ type: 'error', title: 'Load failed', message });
      }
    } finally {
      if (!silent) setLoading(false);
    }
  }, [pushToast]);

  const searchRef = useRef(search);
  searchRef.current = search;
  const editingRef = useRef(editing);
  editingRef.current = editing;

  useEffect(() => {
    void loadUsers();
  }, [loadUsers]);

  // Refresh GGR column live without full-page reload / loading flash.
  useVisibilityPolling(() => {
    if (editingRef.current) return;
    void loadUsers(searchRef.current, { silent: true });
  }, 5000);

  function openEdit(user: User) {
    setEditing(user);
    setEditForm({
      name: user.name,
      phone: user.phone,
      password: '',
      whitelistDomain: user.whitelistDomain || '',
      whitelistIp: user.whitelistIp || '',
      ggrBalance: String(user.ggrBalance ?? 0),
      status: user.status,
      serviceType: user.serviceType,
    });
  }

  async function saveEdit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    try {
      const payload: UpdateUserPayload = {
        name: editForm.name,
        phone: editForm.phone,
        whitelistDomain: editForm.whitelistDomain,
        whitelistIp: editForm.whitelistIp,
        ggrBalance: Number(editForm.ggrBalance) || 0,
        status: editForm.status,
        serviceType: editForm.serviceType,
      };
      if (editForm.password.trim()) {
        payload.password = editForm.password;
      }
      await apiFetch(`/users/${editing.id}`, { method: 'PATCH', body: payload });
      pushToast({ type: 'success', title: 'User updated', message: 'Changes saved successfully.' });
      setEditing(null);
      await loadUsers();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Update failed';
      pushToast({ type: 'error', title: 'Update failed', message });
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus(user: User) {
    const next = user.status === 'active' ? 'pause' : 'active';
    try {
      await apiFetch(`/users/${user.id}`, {
        method: 'PATCH',
        body: { status: next },
      });
      pushToast({
        type: 'success',
        title: next === 'active' ? 'Activated' : 'Paused',
        message: `${user.name} is now ${next === 'active' ? 'active' : 'paused'}.`,
      });
      await loadUsers();
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Status update failed';
      pushToast({ type: 'error', title: 'Status update failed', message });
    }
  }

  async function revealSecret(user: User) {
    if (revealed[user.id]) {
      setRevealed((prev) => {
        const next = { ...prev };
        delete next[user.id];
        return next;
      });
      return;
    }

    setBusyId(user.id);
    try {
      const data = await apiFetch<{ apiSecret: string; apiSecretMasked: string }>(
        `/users/${user.id}/reveal-secret`,
        { method: 'POST' },
      );
      setRevealed((prev) => ({ ...prev, [user.id]: data.apiSecret }));
      setSecretModal({ user, apiSecret: data.apiSecret, mode: 'reveal' });
      pushToast({
        type: 'info',
        title: 'Secret revealed',
        message: 'Copy and store it securely.',
      });
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Reveal failed';
      pushToast({ type: 'error', title: 'Cannot reveal secret', message });
    } finally {
      setBusyId(null);
    }
  }

  async function regenerateSecret(user: User) {
    setBusyId(user.id);
    setConfirmRegen(null);
    try {
      const data = await apiFetch<{ apiSecret: string; user: User }>(
        `/users/${user.id}/regenerate-secret`,
        { method: 'POST' },
      );
      setRevealed((prev) => ({ ...prev, [user.id]: data.apiSecret }));
      setUsers((prev) =>
        prev.map((u) =>
          u.id === user.id
            ? { ...u, ...data.user, canRevealSecret: true }
            : u,
        ),
      );
      setSecretModal({ user: data.user, apiSecret: data.apiSecret, mode: 'regenerate' });
      pushToast({
        type: 'success',
        title: 'Secret regenerated',
        message: 'Previous secret is now invalid. Copy the new one.',
      });
    } catch (err) {
      const message = err instanceof ApiClientError ? err.message : 'Regeneration failed';
      pushToast({ type: 'error', title: 'Regeneration failed', message });
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--accent)]">Administration</p>
          <h2 className="mt-1 text-2xl font-semibold tracking-tight text-[var(--fg)] sm:text-3xl">Users</h2>
          <p className="mt-1 text-sm text-[var(--fg-muted)]">
            Manage accounts, prefixes, and API secrets.
            {pagination ? ` ${pagination.total} total.` : null}
          </p>
        </div>
        <Link href="/super-admin/users/new">
          <Button>Add user</Button>
        </Link>
      </div>

      <form
        className="flex flex-col gap-3 sm:flex-row"
        onSubmit={(e) => {
          e.preventDefault();
          void loadUsers(search);
        }}
      >
        <div className="flex-1">
          <TextField
            label="Search"
            name="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Name, email, prefix, or phone"
          />
        </div>
        <div className="flex items-end">
          <Button type="submit" variant="secondary" loading={loading}>
            Search
          </Button>
        </div>
      </form>

      <div className="surface-card-premium overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[var(--border)] bg-[var(--table-head)] text-xs uppercase tracking-wide text-[var(--fg-muted)]">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Prefix</th>
                <th className="px-4 py-3 font-medium">API secret</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">GGR</th>
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Whitelist</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--fg-muted)]">
                    Loading users…
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-[var(--fg-muted)]">
                    No users yet. Create the first account.
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const secretValue = revealed[user.id];
                  const displaySecret =
                    secretValue ||
                    user.apiSecretMasked ||
                    '••••••••••••••••••••••••••••••••';
                  const prefixCopied = copiedKey === `prefix-${user.id}`;
                  const secretCopied = copiedKey === `secret-${user.id}`;

                  return (
                    <tr
                      key={user.id}
                      className="border-b border-[var(--border)] align-top last:border-0"
                    >
                      <td className="px-4 py-3">
                        <div className="font-medium text-[var(--fg)]">{user.name}</div>
                        <div className="text-xs text-[var(--fg-muted)]">{user.email}</div>
                        <div className="text-xs text-[var(--fg-muted)]">{user.phone}</div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--table-head)] px-2 py-1.5">
                          <span className="font-mono text-xs font-semibold tracking-wider text-[var(--fg)]">
                            {user.prefix}
                          </span>
                          <button
                            type="button"
                            title="Copy prefix"
                            onClick={() =>
                              void copyText(user.prefix, 'Prefix', `prefix-${user.id}`)
                            }
                            className="rounded-md p-1 text-[var(--fg-muted)] transition hover:bg-[var(--bg-elevated)] hover:text-[var(--accent)]"
                          >
                            {prefixCopied ? (
                              <IconCheck className="h-3.5 w-3.5 text-[var(--success)]" />
                            ) : (
                              <IconCopy className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="min-w-[220px] space-y-2">
                          <div className="flex items-center gap-1.5 rounded-lg border border-[var(--border)] bg-[var(--code-bg)] px-2.5 py-2">
                            <IconKey className="h-3.5 w-3.5 shrink-0 text-[var(--accent)]" />
                            <code className="max-w-[160px] truncate font-mono text-[11px] text-[var(--code-fg)]">
                              {displaySecret}
                            </code>
                            <div className="ml-auto flex items-center gap-0.5">
                              <button
                                type="button"
                                title={secretValue ? 'Hide secret' : 'Reveal secret'}
                                disabled={busyId === user.id}
                                onClick={() => void revealSecret(user)}
                                className="rounded-md p-1 text-[var(--fg-muted)] transition hover:bg-[var(--bg-elevated)]/10 hover:text-white disabled:opacity-50"
                              >
                                {secretValue ? (
                                  <IconEyeOff className="h-3.5 w-3.5" />
                                ) : (
                                  <IconEye className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                title="Copy API secret"
                                disabled={!secretValue}
                                onClick={() =>
                                  secretValue &&
                                  void copyText(secretValue, 'API secret', `secret-${user.id}`)
                                }
                                className="rounded-md p-1 text-[var(--fg-muted)] transition hover:bg-[var(--bg-elevated)]/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                              >
                                {secretCopied ? (
                                  <IconCheck className="h-3.5 w-3.5 text-[var(--success)]" />
                                ) : (
                                  <IconCopy className="h-3.5 w-3.5" />
                                )}
                              </button>
                              <button
                                type="button"
                                title="Regenerate API secret"
                                disabled={busyId === user.id}
                                onClick={() => setConfirmRegen(user)}
                                className="rounded-md p-1 text-[var(--fg-muted)] transition hover:bg-[var(--bg-elevated)]/10 hover:text-[var(--warning)] disabled:opacity-50"
                              >
                                <IconRefresh
                                  className={`h-3.5 w-3.5 ${busyId === user.id ? 'animate-spin' : ''}`}
                                />
                              </button>
                            </div>
                          </div>
                          <p className="text-[11px] text-[var(--fg-muted)]">
                            {user.canRevealSecret === false
                              ? 'Regenerate once to enable reveal/copy.'
                              : secretValue
                                ? 'Visible until you hide it.'
                                : 'Reveal to view & copy.'}
                          </p>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-4 py-3 font-mono text-sm text-[var(--fg)]">
                        {Number(user.ggrBalance ?? 0).toLocaleString()}
                      </td>
                      <td className="px-4 py-3">
                        <ServiceBadge serviceType={user.serviceType} />
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--fg-muted)]">
                        <div>{user.whitelistDomain || '—'}</div>
                        <div>{user.whitelistIp || '—'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-2">
                          <Button variant="secondary" onClick={() => openEdit(user)}>
                            Edit
                          </Button>
                          <Button variant="secondary" onClick={() => void toggleStatus(user)}>
                            {user.status === 'active' ? 'Pause' : 'Activate'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editing ? (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-[var(--bg-elevated)] p-6 shadow-xl">
            <h3 className="text-lg font-semibold">Edit user</h3>
            <p className="mt-1 text-sm text-[var(--fg-muted)]">{editing.email}</p>
            <form onSubmit={saveEdit} className="mt-5 space-y-4">
              <TextField
                label="Name"
                name="name"
                required
                value={editForm.name}
                onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              />
              <TextField
                label="Phone"
                name="phone"
                required
                value={editForm.phone}
                onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
              />
              <TextField
                label="New password (optional)"
                name="password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm((f) => ({ ...f, password: e.target.value }))}
                hint="Leave blank to keep current password"
              />
              <TextField
                label="Whitelist domain"
                name="whitelistDomain"
                value={editForm.whitelistDomain}
                onChange={(e) =>
                  setEditForm((f) => ({ ...f, whitelistDomain: e.target.value }))
                }
                placeholder="example.com"
              />
              <TextField
                label="Whitelist IP"
                name="whitelistIp"
                value={editForm.whitelistIp}
                onChange={(e) => setEditForm((f) => ({ ...f, whitelistIp: e.target.value }))}
                placeholder="203.0.113.10"
              />
              <TextField
                label="GGR balance"
                name="ggrBalance"
                type="number"
                min={0}
                step="any"
                value={editForm.ggrBalance}
                onChange={(e) => setEditForm((f) => ({ ...f, ggrBalance: e.target.value }))}
              />
              <SelectField
                label="Status"
                name="status"
                value={editForm.status}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    status: e.target.value as User['status'],
                  }))
                }
              >
                <option value="active">Active</option>
                <option value="pause">Pause</option>
              </SelectField>
              <SelectField
                label="Service type"
                name="serviceType"
                value={editForm.serviceType}
                onChange={(e) =>
                  setEditForm((f) => ({
                    ...f,
                    serviceType: e.target.value as User['serviceType'],
                  }))
                }
              >
                <option value="staging">Staging</option>
                <option value="live">Live</option>
              </SelectField>
              <div className="flex justify-end gap-2 pt-2">
                <Button type="button" variant="secondary" onClick={() => setEditing(null)}>
                  Cancel
                </Button>
                <Button type="submit" loading={saving}>
                  Save changes
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {confirmRegen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-md rounded-2xl bg-[var(--bg-elevated)] p-6 shadow-xl">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--warning-soft)] text-[var(--warning)]">
              <IconRefresh className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-[var(--fg)]">Regenerate API secret?</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--fg-muted)]">
              This will invalidate the current secret for{' '}
              <span className="font-medium text-[var(--fg)]">{confirmRegen.email}</span>.
              Integrations using the old key will stop working until updated.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setConfirmRegen(null)}>
                Cancel
              </Button>
              <Button onClick={() => void regenerateSecret(confirmRegen)}>
                Regenerate
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {secretModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[var(--bg-elevated)] p-6 shadow-xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--warning)]">
                  {secretModal.mode === 'regenerate' ? 'New API secret' : 'API secret'}
                </p>
                <h3 className="mt-1 text-lg font-semibold text-[var(--fg)]">
                  {secretModal.user.name}
                </h3>
                <p className="mt-1 text-sm text-[var(--fg-muted)]">
                  Prefix{' '}
                  <span className="font-mono font-medium text-[var(--fg)]">
                    {secretModal.user.prefix}
                  </span>
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--accent-soft)] text-[var(--accent)]">
                <IconKey className="h-5 w-5" />
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-[var(--warning)]/30 bg-[var(--warning-soft)] px-3 py-2 text-sm text-[var(--warning)]">
              Store this securely. Anyone with this key can act as this user&apos;s integration.
            </div>

            <div className="mt-4 overflow-hidden rounded-xl border border-slate-800 bg-[var(--code-bg)]">
              <div className="flex items-center justify-between border-b border-white/10 px-3 py-2">
                <span className="text-xs text-[var(--fg-muted)]">HMAC API secret</span>
                <button
                  type="button"
                  onClick={() =>
                    void copyText(
                      secretModal.apiSecret,
                      'API secret',
                      `modal-secret-${secretModal.user.id}`,
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-[var(--accent)] transition hover:bg-[var(--bg-elevated)]/10"
                >
                  {copiedKey === `modal-secret-${secretModal.user.id}` ? (
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
              <pre className="overflow-x-auto p-4 font-mono text-xs leading-relaxed text-[var(--code-fg)]">
                {secretModal.apiSecret}
              </pre>
            </div>

            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <Button
                variant="secondary"
                onClick={() =>
                  void copyText(
                    secretModal.user.prefix,
                    'Prefix',
                    `modal-prefix-${secretModal.user.id}`,
                  )
                }
              >
                <IconCopy className="h-4 w-4" />
                Copy prefix
              </Button>
              <Button onClick={() => setSecretModal(null)}>Done</Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

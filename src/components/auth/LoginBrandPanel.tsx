export function LoginBrandPanel() {
  return (
    <aside className="login-brand" aria-label="ApiVexo">
      <div className="login-brand-orb login-brand-orb-a" />
      <div className="login-brand-orb login-brand-orb-b" />
      <div className="login-brand-grid" />

      <div className="relative z-10">
        <div className="inline-flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-teal-400/15 ring-1 ring-teal-300/30">
            <span className="font-mono text-sm font-semibold tracking-tight text-teal-300">AV</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">ApiVexo</span>
        </div>
      </div>

      <div className="relative z-10 max-w-md auth-stagger">
        <p className="text-xs font-medium uppercase tracking-[0.18em] text-teal-300/80">
          Operator console
        </p>
        <h2 className="mt-4 text-4xl font-semibold leading-[1.15] tracking-tight text-white xl:text-5xl">
          Secure access to your platform
        </h2>
        <p className="mt-5 text-base leading-relaxed text-slate-300/90">
          Sign in to manage players, games, and API operations with a calm, reliable workspace.
        </p>

        <ul className="mt-10 space-y-3 text-sm text-slate-300/85">
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-300" />
            Role-aware dashboards for admins and operators
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-300" />
            Session-aware access with clear security feedback
          </li>
          <li className="flex items-start gap-3">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-teal-200" />
            Built for everyday use—fast, quiet, precise
          </li>
        </ul>
      </div>

      <p className="relative z-10 text-xs text-slate-400">
        Protected workspace · Authorized personnel only
      </p>
    </aside>
  );
}

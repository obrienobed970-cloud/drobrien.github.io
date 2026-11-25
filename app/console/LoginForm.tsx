"use client";

import { login } from "./actions";
import { useFormAction } from "./useFormAction";
import MoleculeField from "@/components/MoleculeField";

export default function LoginForm() {
  const [state, onSubmit, pending] = useFormAction(login);
  return (
    <main className="login-shell">
      <MoleculeField density={0.6} />
      <form onSubmit={onSubmit} className="login-card glass">
        <span className="eyebrow">Restricted area</span>
        <h1>Admin sign in</h1>
        <p className="muted">Manage publications, the research digest and admin accounts.</p>
        <label>
          Email
          <input name="email" type="email" autoComplete="username" required autoFocus />
        </label>
        <label>
          Password
          <input name="password" type="password" autoComplete="current-password" required />
        </label>
        {state.error && <p className="form-error" role="alert">{state.error}</p>}
        <button className="btn" disabled={pending}>{pending ? "Signing in…" : "Sign in"}</button>
      </form>
    </main>
  );
}

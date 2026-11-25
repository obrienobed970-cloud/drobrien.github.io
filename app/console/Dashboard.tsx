"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useFormAction } from "./useFormAction";
import type { Admin, DigestPost, Publication } from "@/lib/db";
import {
  changePassword,
  createAdmin,
  deleteDigest,
  deletePublication,
  logout,
  removeAdmin,
  saveDigest,
  savePublication,
  type FormState,
} from "./actions";

type Props = {
  me: { id: string; email: string; name?: string };
  publications: Publication[];
  digest: DigestPost[];
  admins: Admin[];
};

const TABS = ["Publications", "Research digest", "Admins", "My account"] as const;
type Tab = (typeof TABS)[number];

export default function Dashboard({ me, publications, digest, admins }: Props) {
  const [tab, setTab] = useState<Tab>("Publications");
  const [pending, start] = useTransition();

  return (
    <div className="console">
      <header className="console-top">
        <div>
          <span className="eyebrow">Admin console</span>
          <h1>Welcome back{me.name ? `, ${me.name}` : ""}</h1>
          <p className="muted">Signed in as {me.email}</p>
        </div>
        <div className="console-actions">
          <a className="btn ghost" href="/" target="_blank" rel="noopener">View site ↗</a>
          <button className="btn ghost" disabled={pending} onClick={() => start(() => logout())}>Sign out</button>
        </div>
      </header>

      <nav className="tabs" role="tablist">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} className={tab === t ? "active" : ""} onClick={() => setTab(t)}>
            {t}
            {t === "Publications" && <span className="pill">{publications.length}</span>}
            {t === "Research digest" && <span className="pill">{digest.length}</span>}
            {t === "Admins" && <span className="pill">{admins.length}</span>}
          </button>
        ))}
      </nav>

      <section className="console-panel" key={tab}>
        {tab === "Publications" && <PublicationsPanel items={publications} />}
        {tab === "Research digest" && <DigestPanel items={digest} />}
        {tab === "Admins" && <AdminsPanel me={me} admins={admins} />}
        {tab === "My account" && <AccountPanel />}
      </section>
    </div>
  );
}

function Status({ state }: { state: FormState }) {
  if (state.error) return <p className="form-error" role="alert">{state.error}</p>;
  if (state.message) return <p className="form-ok" role="status">{state.message}</p>;
  return null;
}

/** Resets the form after a successful submit. */
function useResetOnSuccess(state: FormState, onDone?: () => void) {
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);
  return ref;
}

function DeleteButton({ onDelete, label }: { onDelete: () => Promise<unknown>; label: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      className="btn danger small"
      disabled={pending}
      onClick={() => {
        if (confirm(`Delete ${label}? This cannot be undone.`)) start(async () => void (await onDelete()));
      }}
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}

/* ---------- Publications ---------- */

function PublicationsPanel({ items }: { items: Publication[] }) {
  const [editing, setEditing] = useState<Publication | null>(null);
  const [state, onSubmit, pending] = useFormAction(savePublication);
  const ref = useResetOnSuccess(state, () => setEditing(null));

  return (
    <div className="panel-grid">
      <form ref={ref} onSubmit={onSubmit} className="card form" key={editing?._id ?? "new"}>
        <h2>{editing ? "Edit publication" : "Upload a publication"}</h2>
        <input type="hidden" name="id" value={editing?._id ?? ""} />
        <label>
          Full citation
          <textarea name="citation" rows={5} required defaultValue={editing?.citation} placeholder="Obed O.Z., … (2026). Title. Journal." />
        </label>
        <div className="row">
          <label>
            Year
            <input name="year" type="number" min={1950} max={2100} required defaultValue={editing?.year ?? new Date().getFullYear()} />
          </label>
          <label>
            Status
            <select name="status" defaultValue={editing?.status ?? "Published"}>
              <option>Published</option>
              <option>In press</option>
              <option>Accepted</option>
              <option>Under review</option>
              <option>Conference</option>
            </select>
          </label>
        </div>
        <label>
          <span>DOI <span className="muted">(optional)</span></span>
          <input name="doi" defaultValue={editing?.doi} placeholder="10.xxxx/xxxxx" />
        </label>
        <label>
          <span>Link <span className="muted">(optional, used when there is no DOI)</span></span>
          <input name="url" type="url" defaultValue={editing?.url} placeholder="https://…" />
        </label>
        <Status state={state} />
        <div className="row">
          <button className="btn" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Publish"}</button>
          {editing && <button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>}
        </div>
      </form>

      <div className="card list">
        <h2>Live publications</h2>
        {items.length === 0 && <p className="muted">No publications yet.</p>}
        {items.map((p) => (
          <div className="list-row" key={p._id}>
            <div>
              <span className="tag">{p.status} · {p.year}</span>
              <p>{p.citation}</p>
            </div>
            <div className="row-actions">
              <button className="btn ghost small" onClick={() => setEditing(p)}>Edit</button>
              <DeleteButton label="this publication" onDelete={() => deletePublication(p._id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Digest ---------- */

function DigestPanel({ items }: { items: DigestPost[] }) {
  const [editing, setEditing] = useState<DigestPost | null>(null);
  const [state, onSubmit, pending] = useFormAction(saveDigest);
  const ref = useResetOnSuccess(state, () => setEditing(null));
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="panel-grid">
      <form ref={ref} onSubmit={onSubmit} className="card form" key={editing?._id ?? "new"}>
        <h2>{editing ? "Edit digest post" : "New digest post"}</h2>
        <input type="hidden" name="id" value={editing?._id ?? ""} />
        <label>
          Article title
          <input name="title" required defaultValue={editing?.title} />
        </label>
        <label>
          Article URL or DOI link
          <input name="url" type="url" required defaultValue={editing?.url} placeholder="https://doi.org/…" />
        </label>
        <div className="row">
          <label>
            Topic
            <input name="topic" required defaultValue={editing?.topic} />
          </label>
          <label>
            Post date
            <input name="date" type="date" required defaultValue={editing?.date ?? today} />
          </label>
        </div>
        <label>
          Reading notes / student takeaway
          <textarea name="notes" rows={5} required defaultValue={editing?.notes} />
        </label>
        <Status state={state} />
        <div className="row">
          <button className="btn" disabled={pending}>{pending ? "Saving…" : editing ? "Save changes" : "Publish post"}</button>
          {editing && <button type="button" className="btn ghost" onClick={() => setEditing(null)}>Cancel</button>}
        </div>
      </form>

      <div className="card list">
        <h2>Live posts</h2>
        {items.length === 0 && <p className="muted">No posts yet.</p>}
        {items.map((p) => (
          <div className="list-row" key={p._id}>
            <div>
              <span className="tag">{p.topic} · {p.date}</span>
              <p><strong>{p.title}</strong></p>
            </div>
            <div className="row-actions">
              <button className="btn ghost small" onClick={() => setEditing(p)}>Edit</button>
              <DeleteButton label="this post" onDelete={() => deleteDigest(p._id)} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Admins ---------- */

function AdminsPanel({ me, admins }: { me: Props["me"]; admins: Admin[] }) {
  const [state, onSubmit, pending] = useFormAction(createAdmin);
  const ref = useResetOnSuccess(state);
  const [removeError, setRemoveError] = useState("");

  return (
    <div className="panel-grid">
      <form ref={ref} onSubmit={onSubmit} className="card form">
        <h2>Create an admin</h2>
        <p className="muted">New admins can upload content, manage posts and create further admins.</p>
        <label>
          <span>Name <span className="muted">(optional)</span></span>
          <input name="name" />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="off" />
        </label>
        <label>
          Temporary password
          <input name="password" type="password" minLength={6} required autoComplete="new-password" />
        </label>
        <Status state={state} />
        <button className="btn" disabled={pending}>{pending ? "Creating…" : "Create admin"}</button>
      </form>

      <div className="card list">
        <h2>Admins</h2>
        {removeError && <p className="form-error">{removeError}</p>}
        {admins.map((a) => (
          <div className="list-row" key={a._id}>
            <div>
              <p><strong>{a.name || a.email}</strong>{a._id === me.id && <span className="pill">you</span>}</p>
              <span className="muted small">{a.email} · added {a.createdAt.slice(0, 10)}</span>
            </div>
            {a._id !== me.id && (
              <div className="row-actions">
                <DeleteButton
                  label={a.email}
                  onDelete={async () => setRemoveError((await removeAdmin(a._id)).error ?? "")}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Account ---------- */

function AccountPanel() {
  const [state, onSubmit, pending] = useFormAction(changePassword);
  const ref = useResetOnSuccess(state);
  return (
    <form ref={ref} onSubmit={onSubmit} className="card form narrow">
      <h2>Change password</h2>
      <label>
        Current password
        <input name="current" type="password" required autoComplete="current-password" />
      </label>
      <label>
        New password
        <input name="next" type="password" minLength={6} required autoComplete="new-password" />
      </label>
      <label>
        Confirm new password
        <input name="confirm" type="password" minLength={6} required autoComplete="new-password" />
      </label>
      <Status state={state} />
      <button className="btn" disabled={pending}>{pending ? "Updating…" : "Update password"}</button>
    </form>
  );
}

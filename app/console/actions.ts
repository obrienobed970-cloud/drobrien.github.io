"use server";

import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { createSession, destroySession, requireAdmin } from "@/lib/auth";

export type FormState = { ok?: boolean; error?: string; message?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD = 6;
let DUMMY_HASH: string | undefined;

function str(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function httpUrl(value: string) {
  if (!value) return "";
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : null;
  } catch {
    return null;
  }
}

function adminUrl() {
  return "/" + (process.env.ADMIN_PATH ?? "").replace(/^\/+|\/+$/g, "");
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/console");
}

/* ---------- Auth ---------- */

export async function login(_: FormState, form: FormData): Promise<FormState> {
  const email = str(form, "email").toLowerCase();
  const password = String(form.get("password") ?? "");
  const db = await getDb();
  const admin = await db.collection("admins").findOne({ email });
  // Compare against a dummy hash when the email is unknown so timing doesn't reveal which emails exist.
  const hash = admin?.passwordHash ?? (DUMMY_HASH ??= await bcrypt.hash("not-a-real-password", 12));
  const valid = await bcrypt.compare(password, hash);
  if (!admin || !valid) return { error: "Incorrect email or password." };
  await createSession(String(admin._id));
  redirect(adminUrl());
}

export async function logout() {
  await destroySession();
  redirect(adminUrl());
}

/* ---------- Publications ---------- */

export async function savePublication(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  const citation = str(form, "citation");
  const year = Number(str(form, "year"));
  const status = str(form, "status") || "Published";
  const doi = str(form, "doi").replace(/^https?:\/\/(dx\.)?doi\.org\//i, "");
  const url = httpUrl(str(form, "url"));

  if (citation.length < 10) return { error: "Please enter the full citation." };
  if (!Number.isInteger(year) || year < 1950 || year > 2100) return { error: "Enter a valid year." };
  if (url === null) return { error: "The link must start with http:// or https://." };

  const doc = { citation, year, status, doi, url };
  const db = await getDb();
  if (id) {
    if (!ObjectId.isValid(id)) return { error: "Unknown publication." };
    await db.collection("publications").updateOne({ _id: new ObjectId(id) }, { $set: doc });
  } else {
    await db.collection("publications").insertOne({ ...doc, createdAt: new Date() });
  }
  refresh();
  return { ok: true, message: id ? "Publication updated." : "Publication published to the site." };
}

export async function deletePublication(id: string) {
  await requireAdmin();
  if (!ObjectId.isValid(id)) return;
  await (await getDb()).collection("publications").deleteOne({ _id: new ObjectId(id) });
  refresh();
}

/* ---------- Research digest ---------- */

export async function saveDigest(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const id = str(form, "id");
  const title = str(form, "title");
  const topic = str(form, "topic");
  const notes = str(form, "notes");
  const date = str(form, "date");
  const url = httpUrl(str(form, "url"));

  if (!title || !topic || !notes) return { error: "Title, topic and notes are required." };
  if (!url) return { error: "Enter a valid http(s) link or DOI URL." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return { error: "Choose a post date." };

  const doc = { title, topic, notes, date, url };
  const db = await getDb();
  if (id) {
    if (!ObjectId.isValid(id)) return { error: "Unknown post." };
    await db.collection("digest").updateOne({ _id: new ObjectId(id) }, { $set: doc });
  } else {
    await db.collection("digest").insertOne({ ...doc, createdAt: new Date() });
  }
  refresh();
  return { ok: true, message: id ? "Post updated." : "Post published to the digest." };
}

export async function deleteDigest(id: string) {
  await requireAdmin();
  if (!ObjectId.isValid(id)) return;
  await (await getDb()).collection("digest").deleteOne({ _id: new ObjectId(id) });
  refresh();
}

/* ---------- Account & admins ---------- */

export async function changePassword(_: FormState, form: FormData): Promise<FormState> {
  const me = await requireAdmin();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("next") ?? "");
  const confirm = String(form.get("confirm") ?? "");

  if (next.length < MIN_PASSWORD) return { error: `New password must be at least ${MIN_PASSWORD} characters.` };
  if (next !== confirm) return { error: "New passwords do not match." };

  const db = await getDb();
  const admin = await db.collection("admins").findOne({ _id: new ObjectId(me.id) });
  if (!admin || !(await bcrypt.compare(current, admin.passwordHash))) return { error: "Current password is incorrect." };

  await db.collection("admins").updateOne(
    { _id: admin._id },
    { $set: { passwordHash: await bcrypt.hash(next, 12), passwordChangedAt: new Date() } },
  );
  // Re-issue this session so it survives the invalidation of older tokens.
  await createSession(me.id);
  return { ok: true, message: "Password changed. Other sessions have been signed out." };
}

export async function createAdmin(_: FormState, form: FormData): Promise<FormState> {
  await requireAdmin();
  const email = str(form, "email").toLowerCase();
  const name = str(form, "name");
  const password = String(form.get("password") ?? "");

  if (!EMAIL_RE.test(email)) return { error: "Enter a valid email address." };
  if (password.length < MIN_PASSWORD) return { error: `Password must be at least ${MIN_PASSWORD} characters.` };

  const db = await getDb();
  if (await db.collection("admins").findOne({ email })) return { error: "An admin with that email already exists." };
  await db.collection("admins").insertOne({
    email,
    name,
    passwordHash: await bcrypt.hash(password, 12),
    createdAt: new Date(),
  });
  refresh();
  return { ok: true, message: `Admin ${email} created.` };
}

export async function removeAdmin(id: string): Promise<FormState> {
  const me = await requireAdmin();
  if (id === me.id) return { error: "You cannot remove your own account." };
  if (!ObjectId.isValid(id)) return { error: "Unknown admin." };
  const db = await getDb();
  if ((await db.collection("admins").countDocuments()) <= 1) return { error: "At least one admin must remain." };
  await db.collection("admins").deleteOne({ _id: new ObjectId(id) });
  refresh();
  return { ok: true };
}

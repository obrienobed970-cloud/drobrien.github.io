import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import { ObjectId } from "mongodb";
import { getDb } from "./db";

const COOKIE = "obed_admin";
const MAX_AGE = 60 * 60 * 8; // 8 hours

function secretKey() {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 32) throw new Error("AUTH_SECRET must be set to a random string of at least 32 characters.");
  return new TextEncoder().encode(s);
}

export async function createSession(adminId: string) {
  const token = await new SignJWT({})
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(adminId)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE}s`)
    .sign(secretKey());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function destroySession() {
  (await cookies()).delete(COOKIE);
}

/** Returns the signed-in admin, or null. Also checks the admin still exists, so deleted admins lose access immediately. */
export async function currentAdmin(): Promise<{ id: string; email: string; name?: string } | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub || !ObjectId.isValid(payload.sub)) return null;
    const db = await getDb();
    const admin = await db.collection("admins").findOne({ _id: new ObjectId(payload.sub) });
    if (!admin) return null;
    // Tokens issued before the last password change are invalid.
    if (admin.passwordChangedAt && payload.iat && payload.iat * 1000 < new Date(admin.passwordChangedAt).getTime() - 1000) return null;
    return { id: String(admin._id), email: admin.email, name: admin.name || undefined };
  } catch {
    return null;
  }
}

export async function requireAdmin() {
  const admin = await currentAdmin();
  if (!admin) throw new Error("Not authorised");
  return admin;
}

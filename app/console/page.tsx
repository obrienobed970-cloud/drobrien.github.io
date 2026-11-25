import type { Metadata } from "next";
import { currentAdmin } from "@/lib/auth";
import { listAdmins, listDigest, listPublications } from "@/lib/db";
import LoginForm from "./LoginForm";
import Dashboard from "./Dashboard";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Admin console",
  robots: { index: false, follow: false },
};

export default async function ConsolePage() {
  const admin = await currentAdmin();
  if (!admin) return <LoginForm />;

  const [publications, digest, admins] = await Promise.all([listPublications(), listDigest(), listAdmins()]);
  return <Dashboard me={admin} publications={publications} digest={digest} admins={admins} />;
}

import { MongoClient, type Db } from "mongodb";

const uri = process.env.MONGODB_URI || process.env.MONGODB_DB;
const dbName = process.env.MONGODB_NAME || "obed_research";

// Reuse one client across hot reloads and serverless invocations.
const globalForMongo = globalThis as unknown as { _mongo?: Promise<MongoClient> };

export async function getDb(): Promise<Db> {
  if (!uri) throw new Error("Set MONGODB_DB (or MONGODB_URI) to your MongoDB connection string.");
  const options = new URL(uri).searchParams.has("authSource") ? {} : { authSource: "admin" };
  globalForMongo._mongo ??= new MongoClient(uri, options).connect();
  return (await globalForMongo._mongo).db(dbName);
}

export type Publication = {
  _id: string;
  citation: string;
  year: number;
  status: string;
  doi?: string;
  url?: string;
  createdAt: string;
};

export type DigestPost = {
  _id: string;
  title: string;
  url: string;
  topic: string;
  notes: string;
  date: string;
};

export type Admin = {
  _id: string;
  email: string;
  name?: string;
  createdAt: string;
};

export async function listPublications(): Promise<Publication[]> {
  const db = await getDb();
  const docs = await db.collection("publications").find().sort({ year: -1, createdAt: -1 }).toArray();
  return docs.map((d) => ({
    _id: String(d._id),
    citation: d.citation,
    year: d.year,
    status: d.status,
    doi: d.doi || undefined,
    url: d.url || undefined,
    createdAt: new Date(d.createdAt).toISOString(),
  }));
}

export async function listDigest(): Promise<DigestPost[]> {
  const db = await getDb();
  const docs = await db.collection("digest").find().sort({ date: -1 }).toArray();
  return docs.map((d) => ({
    _id: String(d._id),
    title: d.title,
    url: d.url,
    topic: d.topic,
    notes: d.notes,
    date: d.date,
  }));
}

export async function listAdmins(): Promise<Admin[]> {
  const db = await getDb();
  const docs = await db.collection("admins").find({}, { projection: { passwordHash: 0 } }).sort({ createdAt: 1 }).toArray();
  return docs.map((d) => ({
    _id: String(d._id),
    email: d.email,
    name: d.name || undefined,
    createdAt: new Date(d.createdAt).toISOString(),
  }));
}

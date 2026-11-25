// Creates the first admin and seeds the existing publications and digest posts.
// Usage: npm run seed -- <admin-email> <admin-password>
// Safe to re-run: existing admins are left untouched and content is only seeded into empty collections.
import { MongoClient } from "mongodb";
import bcrypt from "bcryptjs";

const uri = process.env.MONGODB_URI || process.env.MONGODB_DB;
const dbName = process.env.MONGODB_NAME || "obed_research";
const [email, password] = process.argv.slice(2);

if (!uri) throw new Error("Set MONGODB_DB (or MONGODB_URI) in .env");
if (!email || !password) {
  console.error("Usage: npm run seed -- <admin-email> <admin-password>");
  process.exit(1);
}

const PUBLICATIONS = [
  { year: 2026, status: "Published", doi: "10.17159/0379-4350/2026/v80se1a11", citation: "Ismail, A., Moyinoluwa, O., Obed, O.Z., Abubakar, H.K, (2026). Recent Trends in Stereolithography Resin Formulation and Photoinitiator Systems with Sustainability Perspectives. South African Journal of Chemistry." },
  { year: 2026, status: "Published", doi: "10.1007/978-981-95-1991-0_4", citation: "Chauke, T.M.D., Monapathi, M.E., Mashifana, T., Okoli, B.J., Obed, O.Z., Modise, S.J. (2026). Optimization of Electrocoagulation Parameters for Chloride Removal in Galvanizing Wastewater Using Aluminum and Stainless-Steel Electrodes: A Mono-Variable Approach. Proceedings of the 2nd International Conference on Futuristic Materials for Sustainable Development Goals. FMSDG 2025. Springer Proceedings in Physics, vol 434. Springer, Singapore." },
  { year: 2025, status: "Published", doi: "10.5772/geet.20240068", citation: "Obed O.Z., Uthman T.O., Surgun S. 2025. Sustainable vat polymerization in additive manufacturing. Green Energy and Environmental Technology, 4(1):1–34." },
  { year: 2025, status: "Published", doi: "10.1016/j.rineng.2025.107002", citation: "Deborah C.T.M., Tebogo M., Mzimkhulu M.E., Bamidele O.J., Obed O.Z., Johannes M.S. 2025. Efficiency of chloride removal based on mono-variable experimental data in electrocoagulation with aluminium and stainless-steel electrodes. Results in Engineering." },
  { year: 2025, status: "Published", doi: "10.15666/aeer/2305_86778690", citation: "Obed O.Z., Joseph O.C., Johannes M., Fanyana M., Okoli B.J. 2025. Biodegradation potential of Bacillus subtilis subsp. spizizeni ATCC 6633 on polystyrene and polypropylene plastic waste. Applied Ecology and Environmental Research." },
];

const DIGEST = [
  { title: "Sustainable vat polymerization in additive manufacturing", topic: "Additive manufacturing", date: "2026-11-25", url: "https://doi.org/10.5772/geet.20240068", notes: "Starter reading recommendation: identify the main vat polymerisation methods and compare their sustainability challenges." },
  { title: "Biodegradation potential of Bacillus subtilis on plastic waste", topic: "Environmental chemistry", date: "2026-11-25", url: "https://doi.org/10.15666/aeer/2305_86778690", notes: "Starter reading recommendation: consider how experimental conditions influence microbial degradation of different plastics." },
];

const client = await new MongoClient(uri).connect();
try {
  const db = client.db(dbName);
  await db.collection("admins").createIndex({ email: 1 }, { unique: true });

  const normalized = email.trim().toLowerCase();
  if (await db.collection("admins").findOne({ email: normalized })) {
    console.log(`Admin ${normalized} already exists — left unchanged.`);
  } else {
    await db.collection("admins").insertOne({
      email: normalized,
      name: "O’Brien Obed",
      passwordHash: await bcrypt.hash(password, 12),
      createdAt: new Date(),
    });
    console.log(`Created admin ${normalized}.`);
  }

  // Spread createdAt so the original order is preserved within a year.
  const now = Date.now();
  if ((await db.collection("publications").countDocuments()) === 0) {
    await db.collection("publications").insertMany(PUBLICATIONS.map((p, i) => ({ ...p, url: "", createdAt: new Date(now - i * 1000) })));
    console.log(`Seeded ${PUBLICATIONS.length} publications.`);
  }
  if ((await db.collection("digest").countDocuments()) === 0) {
    await db.collection("digest").insertMany(DIGEST.map((d, i) => ({ ...d, createdAt: new Date(now - i * 1000) })));
    console.log(`Seeded ${DIGEST.length} digest posts.`);
  }
} finally {
  await client.close();
}

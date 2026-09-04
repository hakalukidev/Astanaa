// One-time bootstrap for the new Postgres-backed auth system: creates (or
// promotes) a super_admin account directly in the `users` table so someone
// can log in to /admin and start creating more admin users from the panel.
//
// Usage:
//   npm run seed:admin:pg -- you@example.com "a-strong-password"
//
// Requires DATABASE_URL to be set (this repo keeps it in .env, Prisma's
// default — npm run seed:admin:pg loads it automatically via `node --env-file`).

import { PrismaClient } from "@prisma/client";
import argon2 from "argon2";

const [, , emailArg, passwordArg] = process.argv;

if (!emailArg || !passwordArg) {
  console.error("Usage: npm run seed:admin:pg -- <email> <password>");
  process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const password = passwordArg;

if (password.length < 8) {
  console.error("Password must be at least 8 characters.");
  process.exit(1);
}

const db = new PrismaClient();

async function main() {
  const passwordHash = await argon2.hash(password);

  const user = await db.user.upsert({
    where: { email },
    update: { passwordHash, role: "SUPER_ADMIN" },
    create: { email, passwordHash, role: "SUPER_ADMIN", name: "Super Admin" },
  });

  console.log(`super_admin ready: ${user.email} (id: ${user.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

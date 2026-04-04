/**
 * Seed script: creates test admin and customer accounts.
 *
 * Usage:  npx tsx scripts/seed-test-users.ts
 */

import { Pool } from "pg";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const pool = new Pool({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || "governapi",
  user: process.env.DB_USER || "governapi_user",
  password: process.env.DB_PASSWORD || "newpassword123",
});

const SALT_ROUNDS = 12;

interface TestUser {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: string;
  companyName: string;
}

const testUsers: TestUser[] = [
  {
    email: "admin@governapi.com",
    password: "Admin123!",
    firstName: "Admin",
    lastName: "User",
    role: "admin",
    companyName: "GovernAPI Internal",
  },
  {
    email: "customer@governapi.com",
    password: "Customer123!",
    firstName: "Test",
    lastName: "Customer",
    role: "user",
    companyName: "Test Company",
  },
];

async function seed() {
  const client = await pool.connect();
  try {
    for (const user of testUsers) {
      // Check if user already exists
      const existing = await client.query(
        "SELECT id FROM users WHERE email = $1",
        [user.email]
      );
      if (existing.rows.length > 0) {
        console.log(`User ${user.email} already exists — skipping.`);
        continue;
      }

      const passwordHash = await bcrypt.hash(user.password, SALT_ROUNDS);
      const apiKey = `gapi_${crypto.randomBytes(16).toString("hex")}`;

      // Create company
      const companyResult = await client.query(
        `INSERT INTO companies (company_name, subscription_plan, subscription_status, api_key, status)
         VALUES ($1, 'starter', 'active', $2, 'active')
         RETURNING id`,
        [user.companyName, apiKey]
      );
      const companyId = companyResult.rows[0].id;

      // Create user
      await client.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, company_id, email_verified, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, true, true)`,
        [user.email, passwordHash, user.firstName, user.lastName, user.role, companyId]
      );

      console.log(`Created ${user.role}: ${user.email} / ${user.password}`);
    }
    console.log("\nDone.");
  } finally {
    client.release();
    await pool.end();
  }
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});

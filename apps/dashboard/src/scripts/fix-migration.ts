import { database } from "../infrastructure/database";
import * as fs from "fs";

async function fixMigration() {
  try {
    const sql = fs.readFileSync('/tmp/fix-tenant-type.sql', 'utf8');
    console.log('Fixing tenant_id type...');
    await database.query(sql);
    console.log('✅ Table recreated with VARCHAR tenant_id');
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Fix failed:', error.message);
    process.exit(1);
  }
}

fixMigration();

import { database } from "../infrastructure/database";
import * as fs from "fs";

async function runMigration() {
  try {
    const sql = fs.readFileSync('/tmp/compliance-history-migration.sql', 'utf8');
    
    console.log('Running migration...');
    await database.query(sql);
    
    console.log('✅ Migration completed successfully!');
    console.log('✅ Created table: compliance_assessment_history');
    console.log('✅ Created indexes for performance');
    
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  }
}

runMigration();

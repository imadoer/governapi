import { database } from '../src/infrastructure/database'

export async function cleanupTestData() {
  // Only clean tables that exist in your database
  await database.query('DELETE FROM api_keys WHERE tenant_id = $1', [1])
  await database.query('DELETE FROM api_requests WHERE tenant_id = $1', [1])
  // Remove reference to non-existent request_logs table
}

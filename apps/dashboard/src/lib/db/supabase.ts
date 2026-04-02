import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Database types
export type Api = {
  id: string;
  name: string;
  endpoint: string;
  type: string;
  classification: string;
  environment: string;
  discovered_at: string;
  last_seen: string;
  created_at: string;
};

export type Scan = {
  id: string;
  api_id: string;
  scan_type: string;
  status: string;
  results: any;
  started_at: string;
  completed_at: string;
  created_at: string;
};

export type Violation = {
  id: string;
  api_id: string;
  policy_name: string;
  severity: string;
  status: string;
  details: any;
  created_at: string;
};

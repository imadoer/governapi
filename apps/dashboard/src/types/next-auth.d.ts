import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      orgId: string | null;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    orgId: string | null;
  }
}

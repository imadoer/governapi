"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CustomerPortal() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to new login page
    router.push("/customer/login");
  }, [router]);

  return null;
}

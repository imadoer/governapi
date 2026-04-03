export async function handleScanSubmit(
  values: Record<string, string>,
  category: "api" | "infrastructure",
) {
  try {
    const companyStr = sessionStorage.getItem("company");
    const company = companyStr ? JSON.parse(companyStr) : null;

    if (!company?.id) {
      throw new Error("Company ID not found. Please log in again.");
    }

    const response = await fetch("/api/scanner", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-tenant-id": company.id.toString(),
      },
      body: JSON.stringify({
        ...values,
        category,
        target: values.target || values.provider || "Unknown",
      }),
    });

    const data = await response.json();

    if (data.success) {
      return data.scan;
    } else {
      throw new Error(data.error || "Scan failed");
    }
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Failed to start scan";
    throw new Error(msg);
  }
}

export async function fetchScanHistory() {
  try {
    const companyStr = sessionStorage.getItem("company");
    const company = companyStr ? JSON.parse(companyStr) : null;

    if (!company?.id) {
      return [];
    }

    const response = await fetch("/api/scanner", {
      headers: {
        "x-tenant-id": company.id.toString(),
      },
    });

    const data = await response.json();
    return data.scans || [];
  } catch (error) {
    console.error("Failed to fetch scan history:", error);
    return [];
  }
}

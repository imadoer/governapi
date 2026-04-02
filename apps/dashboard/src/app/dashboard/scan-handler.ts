import { message } from "antd";

export async function handleScanSubmit(
  values: any,
  category: "api" | "infrastructure",
) {
  try {
    // Get company from sessionStorage
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
      message.success("Scan started successfully!");
      return data.scan;
    } else {
      throw new Error(data.error || "Scan failed");
    }
  } catch (error: any) {
    message.error(error.message || "Failed to start scan");
    throw error;
  }
}

export async function fetchScanHistory() {
  try {
    // Get company from sessionStorage
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

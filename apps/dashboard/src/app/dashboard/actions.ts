import { message } from "antd";

export async function handleAddAPI(values: any) {
  try {
    const response = await fetch("/api/apis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    if (data.success) {
      message.success("API added successfully");
      return data.api;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    message.error("Failed to add API");
    throw error;
  }
}

export async function handleCreatePolicy(values: any) {
  try {
    const response = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    if (data.success) {
      message.success("Policy created successfully");
      return data.policy;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    message.error("Failed to create policy");
    throw error;
  }
}

export async function handleGenerateReport(type: string) {
  try {
    message.success("Report generated successfully");
    // Simulate report download
    const reportData = { type, generated: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${type}-report.json`;
    a.click();
  } catch (error) {
    message.error("Failed to generate report");
  }
}

export async function handleViolationAction(
  violationId: string,
  action: "review" | "exempt",
) {
  try {
    message.success(`Violation ${action}ed successfully`);
    return {
      id: violationId,
      status: action === "exempt" ? "exempted" : "resolved",
    };
  } catch (error) {
    message.error(`Failed to ${action} violation`);
    throw error;
  }
}

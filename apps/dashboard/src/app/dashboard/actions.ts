export async function handleAddAPI(values: Record<string, unknown>) {
  try {
    const response = await fetch("/api/apis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    if (data.success) {
      return data.api;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    throw error;
  }
}

export async function handleCreatePolicy(values: Record<string, unknown>) {
  try {
    const response = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    if (data.success) {
      return data.policy;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    throw error;
  }
}

export async function handleGenerateReport(type: string) {
  const reportData = { type, generated: new Date().toISOString() };
  const blob = new Blob([JSON.stringify(reportData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${type}-report.json`;
  a.click();
}

export async function handleViolationAction(
  violationId: string,
  action: "review" | "exempt",
) {
  return {
    id: violationId,
    status: action === "exempt" ? "exempted" : "resolved",
  };
}

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function analyzeWasteImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch(`${BASE_URL}/api/waste/analyze`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: "Unknown error" }));
    throw new Error(err.detail || `HTTP ${response.status}`);
  }

  return response.json();
}
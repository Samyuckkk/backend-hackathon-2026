import axios from "axios";

const api = axios.create({
  baseURL: "http://127.0.0.1:8000",
  timeout: 1200000,
});

export async function extractInvoiceText({ text, file }) {
  const formData = new FormData();

  if (text?.trim()) {
    formData.append("raw_text", text.trim());
  }

  if (file) {
    formData.append("file", file);
  }

  const response = await api.post("/upload-invoice", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
}

export async function analyzeInvoice(rawText) {
  const response = await api.post("/invoices", {
    raw_text: rawText,
  });

  return response.data;
}

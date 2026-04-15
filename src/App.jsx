import { useState } from "react";
import { analyzeInvoice, extractInvoiceText } from "./api/invoiceApi";

const initialResult = null;

function formatCurrency(amount) {
  const numericAmount = Number(amount);

  if (Number.isNaN(numericAmount)) {
    return amount ?? "-";
  }

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(numericAmount);
}

function formatDate(dateString) {
  if (!dateString) {
    return "-";
  }

  const date = new Date(dateString);
  if (Number.isNaN(date.getTime())) {
    return dateString;
  }

  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
  }).format(date);
}

export default function App() {
  const [inputMode, setInputMode] = useState("text");
  const [textValue, setTextValue] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [result, setResult] = useState(initialResult);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const canSubmit =
    status !== "extracting" &&
    status !== "analyzing" &&
    (inputMode === "text" ? Boolean(textValue.trim()) : Boolean(selectedFile));

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setResult(initialResult);

    try {
      setStatus("extracting");
      const extracted = await extractInvoiceText({
        text: inputMode === "text" ? textValue : "",
        file: inputMode === "file" ? selectedFile : null,
      });

      const rawText = extracted.raw_text?.trim();
      setExtractedText(rawText || "");

      if (!rawText) {
        throw new Error("No text could be extracted from the provided input.");
      }

      setStatus("analyzing");
      const analysis = await analyzeInvoice(rawText);
      setResult(analysis);
      setStatus("success");
    } catch (requestError) {
      const detail =
        requestError.response?.data?.detail ||
        requestError.response?.data?.error ||
        requestError.message ||
        "Something went wrong while processing the invoice.";

      setError(detail);
      setStatus("error");
    }
  }

  function handleModeChange(mode) {
    setInputMode(mode);
    setError("");
    setResult(initialResult);
    setExtractedText("");
  }

  function handleFileSelection(file) {
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const supportedTypes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!supportedTypes.includes(file.type)) {
      setError("Please upload a PDF, PNG, JPG, JPEG, or WEBP file.");
      setSelectedFile(null);
      return;
    }

    setError("");
    setSelectedFile(file);
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragActive(false);

    const file = event.dataTransfer.files?.[0];
    handleFileSelection(file);
  }

  function resetAll() {
    setTextValue("");
    setSelectedFile(null);
    setExtractedText("");
    setResult(initialResult);
    setError("");
    setStatus("idle");
  }

  return (
    <div className="page-shell">
      <div className="background-orb orb-one" />
      <div className="background-orb orb-two" />
      <div className="grid-overlay" />

      <main className="app-frame">
        <section className="hero-panel">
          <div className="hero-copy">
            <span className="eyebrow">Invoice intelligence workspace</span>
            <h1>Upload raw text, an image, or a PDF and turn it into structured invoice data.</h1>
            <p>
              The UI first sends your input to the extraction endpoint, then forwards the extracted
              text to the LLM invoice parser for final analysis.
            </p>
          </div>

          <div className="hero-stats">
            <div className="stat-card">
              <span>Option 1</span>
              <strong>Upload Invoice</strong>
              <p>Extracts invoice text from typed input, images, and PDFs.</p>
            </div>
            <div className="stat-card">
              <span>Option 2</span>
              <strong>Text Input Invoice</strong>
              <p>Sends the extracted text to the LLM and stores the structured result.</p>
            </div>
          </div>
        </section>

        <section className="workspace">
          <div className="panel input-panel">
            <div className="panel-header">
              <div>
                <span className="panel-kicker">Capture</span>
                <h2>Choose the invoice source</h2>
              </div>
              <button type="button" className="ghost-button" onClick={resetAll}>
                Reset
              </button>
            </div>

            <div className="mode-switch">
              <button
                type="button"
                className={inputMode === "text" ? "mode-pill active" : "mode-pill"}
                onClick={() => handleModeChange("text")}
              >
                Paste Text
              </button>
              <button
                type="button"
                className={inputMode === "file" ? "mode-pill active" : "mode-pill"}
                onClick={() => handleModeChange("file")}
              >
                Upload File
              </button>
            </div>

            <form className="input-form" onSubmit={handleSubmit}>
              {inputMode === "text" ? (
                <label className="text-area-shell">
                  <span>Invoice text</span>
                  <textarea
                    value={textValue}
                    onChange={(event) => setTextValue(event.target.value)}
                    placeholder="Paste invoice text here..."
                    rows={12}
                  />
                </label>
              ) : (
                <div
                  className={dragActive ? "drop-zone active" : "drop-zone"}
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragActive(true);
                  }}
                  onDragLeave={(event) => {
                    event.preventDefault();
                    setDragActive(false);
                  }}
                  onDrop={handleDrop}
                >
                  <input
                    id="invoice-file"
                    type="file"
                    accept=".pdf,image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(event) => handleFileSelection(event.target.files?.[0])}
                  />
                  <label htmlFor="invoice-file" className="drop-zone-content">
                    <span className="upload-badge">PDF or image</span>
                    <strong>Drag and drop your invoice here</strong>
                    <p>Or click to browse for a PDF, PNG, JPG, JPEG, or WEBP file.</p>
                    {selectedFile ? <em>{selectedFile.name}</em> : null}
                  </label>
                </div>
              )}

              <button type="submit" className="primary-button" disabled={!canSubmit}>
                {status === "extracting"
                  ? "Extracting text..."
                  : status === "analyzing"
                    ? "Analyzing invoice..."
                    : "Process invoice"}
              </button>
            </form>

            {error ? <div className="status-banner error">{error}</div> : null}
            {status === "success" ? (
              <div className="status-banner success">Invoice extracted and analyzed successfully.</div>
            ) : null}
          </div>

          <div className="panel results-panel">
            <div className="result-grid">
              <article className="result-card extracted-card">
                <div className="panel-header">
                  <div>
                    <span className="panel-kicker">Extraction</span>
                    <h2>Extracted text</h2>
                  </div>
                </div>
                <pre>{extractedText || "Your extracted invoice text will appear here."}</pre>
              </article>

              <article className="result-card analysis-card">
                <div className="panel-header">
                  <div>
                    <span className="panel-kicker">Analysis</span>
                    <h2>Structured invoice result</h2>
                  </div>
                </div>

                {result ? (
                  <div className="analysis-content">
                    <div className="summary-grid">
                      <div className="summary-tile">
                        <span>Vendor</span>
                        <strong>{result.vendor || "-"}</strong>
                      </div>
                      <div className="summary-tile">
                        <span>Total amount</span>
                        <strong>{formatCurrency(result.amount)}</strong>
                      </div>
                      <div className="summary-tile">
                        <span>Due date</span>
                        <strong>{formatDate(result.due_date)}</strong>
                      </div>
                      <div className="summary-tile">
                        <span>Invoice ID</span>
                        <strong>#{result.invoice_id}</strong>
                      </div>
                    </div>

                    <div className="line-items">
                      <div className="line-items-header">
                        <h3>Line items</h3>
                        <span>{result.line_items?.length || 0} entries</span>
                      </div>
                      <div className="line-item-list">
                        {(result.line_items || []).map((item, index) => (
                          <div className="line-item" key={`${item.description}-${index}`}>
                            <span>{item.description}</span>
                            <strong>{formatCurrency(item.amount)}</strong>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="empty-state">
                    <p>No analysis yet. Submit text or a file to see the parsed invoice data here.</p>
                  </div>
                )}
              </article>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

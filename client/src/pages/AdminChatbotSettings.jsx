import React, { useCallback, useEffect, useState } from "react";
import { API_BASE_URL } from "../config/api";

const API_BASE = `${API_BASE_URL}/api/dashboard/internal/chatbot`;

function AdminChatbotSettings() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [manualText, setManualText] = useState("");
  const [documents, setDocuments] = useState([]);
  const [loadingList, setLoadingList] = useState(false);
  const [busy, setBusy] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  const extractDocuments = (payload) => {
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload?.documents)) return payload.documents;
    if (Array.isArray(payload?.files)) return payload.files;
    if (Array.isArray(payload?.data)) return payload.data;
    return [];
  };

  const getDocumentInfo = (documentItem, index) => {
    if (typeof documentItem === "string") {
      return {
        name: documentItem,
        meta: "",
        key: `${documentItem}-${index}`,
      };
    }

    if (documentItem && typeof documentItem === "object") {
      const name =
        documentItem.filename ||
        documentItem.name ||
        documentItem.file ||
        `Document ${index + 1}`;
      const chunks = documentItem.chunks ?? documentItem.chunkCount;
      const count = documentItem.count;
      const metaParts = [];

      if (typeof chunks === "number") metaParts.push(`chunks: ${chunks}`);
      if (typeof count === "number") metaParts.push(`count: ${count}`);

      return {
        name,
        meta: metaParts.join(" | "),
        key: `${name}-${index}`,
      };
    }

    const fallback = String(documentItem ?? `Document ${index + 1}`);
    return {
      name: fallback,
      meta: "",
      key: `${fallback}-${index}`,
    };
  };

  const loadDocuments = useCallback(async () => {
    setLoadingList(true);
    setStatusMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/list`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!response.ok) throw new Error("Failed to load documents");
      const data = await response.json();
      setDocuments(extractDocuments(data));
    } catch (_error) {
      setStatusMessage("Unable to fetch stored documents.");
    } finally {
      setLoadingList(false);
    }
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  const handleUpload = async () => {
    if (!selectedFile || busy) return;

    const formData = new FormData();
    formData.append("file", selectedFile);

    setBusy(true);
    setStatusMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "Upload failed");
      setStatusMessage("Document uploaded.");
      setSelectedFile(null);
      await loadDocuments();
    } catch (error) {
      setStatusMessage(error.message || "Upload failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleAddText = async () => {
    const text = manualText.trim();
    if (!text || busy) return;

    setBusy(true);
    setStatusMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ text }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "Failed to add text");
      setStatusMessage("Manual text added.");
      setManualText("");
      await loadDocuments();
    } catch (error) {
      setStatusMessage(error.message || "Failed to add text.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (name) => {
    if (!name || busy) return;

    setBusy(true);
    setStatusMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/delete/${encodeURIComponent(name)}`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "Delete failed");
      setStatusMessage(`Deleted: ${name}`);
      await loadDocuments();
    } catch (error) {
      setStatusMessage(error.message || "Delete failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleClearHistory = async () => {
    if (busy) return;

    setBusy(true);
    setStatusMessage("");
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/clear_history`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail || "Failed to clear memory");
      setStatusMessage("Chatbot memory cleared.");
    } catch (error) {
      setStatusMessage(error.message || "Failed to clear memory.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0f172a",
        color: "#f1f5f9",
        padding: "clamp(16px, 4vw, 32px)",
        fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <h1 style={{ marginTop: 0, marginBottom: "1rem", fontSize: "clamp(1.5rem, 4vw, 2rem)" }}>Admin Chatbot Settings</h1>

        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1.1rem" }}>Upload PDF/TXT</h2>
          <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", flexWrap: "wrap" }}>
            <input
              type="file"
              accept=".pdf,.txt"
              onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
              style={{ color: "#cbd5e1" }}
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={!selectedFile || busy}
              style={{
                border: "none",
                borderRadius: "6px",
                padding: "0.5rem 0.9rem",
                background: !selectedFile || busy ? "#475569" : "#2563eb",
                color: "white",
                cursor: !selectedFile || busy ? "not-allowed" : "pointer",
              }}
            >
              Upload
            </button>
          </div>
        </div>

        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1.1rem" }}>Add Manual Text</h2>
          <textarea
            value={manualText}
            onChange={(event) => setManualText(event.target.value)}
            placeholder="Paste text to add into knowledge base..."
            rows={6}
            style={{
              width: "100%",
              boxSizing: "border-box",
              background: "#0f172a",
              color: "#f1f5f9",
              border: "1px solid #334155",
              borderRadius: "8px",
              padding: "0.75rem",
              marginBottom: "0.6rem",
              resize: "vertical",
            }}
          />
          <button
            type="button"
            onClick={handleAddText}
            disabled={!manualText.trim() || busy}
            style={{
              border: "none",
              borderRadius: "6px",
              padding: "0.5rem 0.9rem",
              background: !manualText.trim() || busy ? "#475569" : "#2563eb",
              color: "white",
              cursor: !manualText.trim() || busy ? "not-allowed" : "pointer",
            }}
          >
            Add Text
          </button>
        </div>

        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "1rem",
            marginBottom: "1rem",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "0.5rem",
              marginBottom: "0.75rem",
            }}
          >
            <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Stored Documents</h2>
            <button
              type="button"
              onClick={loadDocuments}
              disabled={loadingList || busy}
              style={{
                border: "none",
                borderRadius: "6px",
                padding: "0.4rem 0.8rem",
                background: loadingList || busy ? "#475569" : "#334155",
                color: "white",
                cursor: loadingList || busy ? "not-allowed" : "pointer",
              }}
            >
              Refresh
            </button>
          </div>

          {loadingList ? (
            <p style={{ margin: 0, color: "#94a3b8" }}>Loading documents...</p>
          ) : documents.length === 0 ? (
            <p style={{ margin: 0, color: "#94a3b8" }}>No stored documents found.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              {documents.map((documentItem, index) => {
                const doc = getDocumentInfo(documentItem, index);
                return (
                <div
                  key={doc.key}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    borderRadius: "8px",
                    padding: "0.6rem 0.7rem",
                    gap: "0.6rem",
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: "#e2e8f0", wordBreak: "break-all" }}>{doc.name}</div>
                    {doc.meta && (
                      <div style={{ color: "#94a3b8", fontSize: "0.8rem", marginTop: "0.2rem" }}>
                        {doc.meta}
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDelete(doc.name)}
                    disabled={busy}
                    style={{
                      border: "none",
                      borderRadius: "6px",
                      padding: "0.35rem 0.65rem",
                      background: busy ? "#7f1d1d" : "#dc2626",
                      color: "white",
                      cursor: busy ? "not-allowed" : "pointer",
                    }}
                  >
                    Delete
                  </button>
                </div>
              );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            background: "#1e293b",
            border: "1px solid #334155",
            borderRadius: "10px",
            padding: "1rem",
          }}
        >
          <h2 style={{ marginTop: 0, marginBottom: "0.75rem", fontSize: "1.1rem" }}>Memory</h2>
          <button
            type="button"
            onClick={handleClearHistory}
            disabled={busy}
            style={{
              border: "none",
              borderRadius: "6px",
              padding: "0.5rem 0.9rem",
              background: busy ? "#7f1d1d" : "#ef4444",
              color: "white",
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            Clear Chatbot Memory
          </button>
        </div>

        {statusMessage && <p style={{ marginTop: "1rem", color: "#93c5fd" }}>{statusMessage}</p>}
      </div>
    </div>
  );
}

export default AdminChatbotSettings;

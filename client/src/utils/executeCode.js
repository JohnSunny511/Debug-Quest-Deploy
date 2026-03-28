// executeCode.js
import axios from "axios";
import { API_BASE_URL } from "../config/api";
import { clearStoredSession, isAuthError } from "./authSession";

// Judge0 language IDs
const LANGUAGE_MAP = {
  python: 71,
  javascript: 63,
  c: 50
};

// normalize dropdown language names
const normalizeLanguage = (lang) => {
  if (!lang) return "python";
  const lower = lang.toLowerCase();

  if (["python3", "py"].includes(lower)) return "python";
  if (["js", "node", "nodejs"].includes(lower)) return "javascript";
  if (["c99", "gcc"].includes(lower)) return "c";

  return lower;
};

export async function executeCode(language, code) {
  const normalizedLang = normalizeLanguage(language);
  const language_id = LANGUAGE_MAP[normalizedLang];

  if (!language_id) {
    throw new Error(`Unsupported language: ${language}`);
  }

  try {
    const token = localStorage.getItem("token");
    const response = await axios.post(`${API_BASE_URL}/api/execute`, {
      language_id,
      code,
    }, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    return response.data.output;

  } catch (err) {
    if (isAuthError(err)) {
      clearStoredSession();
      throw new Error("Session expired. Please sign in again.");
    }

    const message =
      err.response?.data?.detail ||
      err.response?.data?.error ||
      "Failed to execute code.";
    throw new Error(message);
  }
}

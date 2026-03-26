const getDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return "http://localhost:5000";
  }

  const { protocol, hostname, port, origin } = window.location;
  const isLocalHost = hostname === "localhost" || hostname === "127.0.0.1";
  const looksLikeFrontendDevPort = ["3000", "3001", "3002", "3003"].includes(port);

  if (isLocalHost && looksLikeFrontendDevPort) {
    return `${protocol}//${hostname}:5000`;
  }

  return origin;
};

const rawApiBaseUrl =
  process.env.REACT_APP_API_BASE_URL || getDefaultApiBaseUrl();

export const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

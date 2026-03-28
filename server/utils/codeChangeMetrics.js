function normalizeLanguage(language) {
  const lower = String(language || "").trim().toLowerCase();

  if (["python3", "py"].includes(lower)) return "python";
  if (["js", "node", "nodejs"].includes(lower)) return "javascript";
  if (["c99", "gcc"].includes(lower)) return "c";
  if (["plaintext"].includes(lower)) return "text";

  return lower || "text";
}

function normalizeLines(str) {
  return String(str || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => line.replace(/\s+$/, ""))
    .filter((line) => line.length > 0);
}

function tokenizePythonLine(line) {
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : "";
  const tokens =
    line
      .trim()
      .match(/[a-zA-Z_][a-zA-Z0-9_]*|\d+|==|!=|<=|>=|[+\-*/%=<>{}()[\];,.:"]|".*?"|'.*?'/g) || [];

  return [indent, ...tokens];
}

function tokenizeCLine(line) {
  return line.match(/[a-zA-Z_][a-zA-Z0-9_]*|\d+|==|!=|<=|>=|[+\-*/%=<>{}()[\];,]|".*?"|'.*?'/g) || [];
}

function tokenizeText(text) {
  return String(text || "").replace(/\r/g, "").trim().match(/[a-zA-Z0-9_]+|[^\s]/g) || [];
}

function getTokens(source, language) {
  const normalizedLanguage = normalizeLanguage(language);

  if (normalizedLanguage === "python") {
    return normalizeLines(source).flatMap(tokenizePythonLine);
  }

  if (normalizedLanguage === "c" || normalizedLanguage === "javascript") {
    return normalizeLines(source).flatMap((line) => tokenizeCLine(line.trim()));
  }

  return tokenizeText(source);
}

function computeChanges(origTokens, modTokens) {
  const m = origTokens.length;
  const n = modTokens.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i += 1) {
    for (let j = 1; j <= n; j += 1) {
      if (origTokens[i - 1] === modTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m;
  let j = n;
  let changes = 0;

  while (i > 0 && j > 0) {
    if (origTokens[i - 1] === modTokens[j - 1]) {
      i -= 1;
      j -= 1;
    } else if (dp[i][j] === dp[i - 1][j - 1]) {
      changes += 1;
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      changes += 1;
      i -= 1;
    } else {
      changes += 1;
      j -= 1;
    }
  }

  return changes + i + j;
}

function calculateChangeMetrics(original, modified, language) {
  const originalTokens = getTokens(original, language);
  const modifiedTokens = getTokens(modified, language);
  const changes = computeChanges(originalTokens, modifiedTokens);
  const baselineTokenCount = Math.max(originalTokens.length, 1);
  const percentage = Number(((changes / baselineTokenCount) * 100).toFixed(2));

  return {
    changes,
    originalTokenCount: originalTokens.length,
    modifiedTokenCount: modifiedTokens.length,
    percentage,
  };
}

module.exports = {
  calculateChangeMetrics,
  normalizeLanguage,
};

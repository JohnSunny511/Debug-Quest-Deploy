// Python change counter
function countCodeChangesPython(original, modified) {
  const normalize = (str) =>
    str
      .replace(/\r/g, "")
      .split("\n")
      .map((line) => line.replace(/\s+$/, ""))
      .filter((line) => line.length > 0);

 const tokenizeLine = (line) => {
  const indentMatch = line.match(/^(\s*)/);
  const indent = indentMatch ? indentMatch[1] : "";
  const tokens =
    line
      .trim()
      .match(/[a-zA-Z_][a-zA-Z0-9_]*|\d+|==|!=|<=|>=|[+\-*/%=<>{}()[\];,.:"]|".*?"|'.*?'/g) || [];
  return [indent, ...tokens];
};


  const origTokens = normalize(original).flatMap(tokenizeLine);
  const modTokens = normalize(modified).flatMap(tokenizeLine);
  return computeChanges(origTokens, modTokens);
}

// C change counter (no indentation handling)
function countCodeChangesC(original, modified) {
  const normalize = (str) =>
    str.replace(/\r/g, "").split("\n").map((line) => line.trim()).filter(Boolean);

  const tokenize = (line) =>
    line.match(/[a-zA-Z_][a-zA-Z0-9_]*|\d+|==|!=|<=|>=|[+\-*/%=<>{}()[\];,]|".*?"|'.*?'/g) || [];

  const origTokens = normalize(original).flatMap(tokenize);
  const modTokens = normalize(modified).flatMap(tokenize);
  return computeChanges(origTokens, modTokens);
}

// Plain text change counter (for admin-added text questions)
function countCodeChangesText(original, modified) {
  const normalize = (str) => String(str ?? "").replace(/\r/g, "").trim();

  const tokenize = (text) =>
    normalize(text).match(/[a-zA-Z0-9_]+|[^\s]/g) || [];

  const origTokens = tokenize(original);
  const modTokens = tokenize(modified);
  return computeChanges(origTokens, modTokens);
}

// LCS diff core logic
function computeChanges(origTokens, modTokens) {
  const m = origTokens.length;
  const n = modTokens.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (origTokens[i - 1] === modTokens[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  let i = m,
    j = n,
    changes = 0;
  while (i > 0 && j > 0) {
    if (origTokens[i - 1] === modTokens[j - 1]) {
      i--;
      j--;
    } else if (dp[i][j] === dp[i - 1][j - 1]) {
      changes++;
      i--;
      j--;
    } else if (dp[i - 1][j] > dp[i][j - 1]) {
      changes++;
      i--;
    } else {
      changes++;
      j--;
    }
  }

  changes += i + j;
  return changes;
}

// Dispatcher function
export function countChanges(original, modified, language) {
  switch (language.toLowerCase()) {
    case "python":
      return countCodeChangesPython(original, modified);
    case "c":
      return countCodeChangesC(original, modified);
    case "text":
    case "plaintext":
      return countCodeChangesText(original, modified);
    default:
      console.warn("Unsupported language:", language);
      return -1;
  }
}

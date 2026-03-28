function createTimestamp() {
  return new Date().toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function createDefaultPerformanceHistory(score = 100) {
  return [{ time: createTimestamp(), score }];
}

export function getUserProgressStorageKey(username, key) {
  return `debugQuest:${username}:${key}`;
}

export function readUserProgress(username, key, fallbackValue) {
  if (!username) return fallbackValue;

  const stored = localStorage.getItem(getUserProgressStorageKey(username, key));
  if (!stored) return fallbackValue;

  try {
    return JSON.parse(stored);
  } catch (_error) {
    return fallbackValue;
  }
}

export function readUserPerformanceScore(username, fallbackValue = 100) {
  if (!username) return fallbackValue;

  const raw = localStorage.getItem(getUserProgressStorageKey(username, "performanceScore"));
  const parsed = raw ? parseInt(raw, 10) : NaN;
  return Number.isFinite(parsed) ? parsed : fallbackValue;
}

export function applySubmissionProgress(username, { pointsDelta = 0, isCorrect = false, questionId = "" } = {}) {
  if (!username) return null;

  const currentScore = readUserPerformanceScore(username, 100);
  const nextScore = Math.max(0, currentScore + Number(pointsDelta || 0));
  const historyFallback = createDefaultPerformanceHistory(currentScore);
  const history = readUserProgress(username, "performanceHistory", historyFallback);
  const normalizedHistory = Array.isArray(history) && history.length > 0 ? [...history] : historyFallback;

  if (Number(pointsDelta || 0) !== 0) {
    normalizedHistory.push({ time: createTimestamp(), score: nextScore });
  }

  localStorage.setItem(getUserProgressStorageKey(username, "performanceScore"), String(nextScore));
  localStorage.setItem(
    getUserProgressStorageKey(username, "performanceHistory"),
    JSON.stringify(normalizedHistory.slice(-9))
  );

  const currentAccuracy = readUserProgress(username, "accuracyStats", { total: 0, correct: 0 });
  const nextAccuracy = {
    total: Number(currentAccuracy?.total || 0) + 1,
    correct: Number(currentAccuracy?.correct || 0) + (isCorrect ? 1 : 0),
  };
  localStorage.setItem(
    getUserProgressStorageKey(username, "accuracyStats"),
    JSON.stringify(nextAccuracy)
  );

  if (isCorrect && questionId) {
    const solvedQuestions = readUserProgress(username, "solvedQuestions", []);
    const nextSolvedQuestions = solvedQuestions.includes(questionId)
      ? solvedQuestions
      : [...solvedQuestions, questionId];
    localStorage.setItem(
      getUserProgressStorageKey(username, "solvedQuestions"),
      JSON.stringify(nextSolvedQuestions)
    );
  }

  return { nextScore };
}

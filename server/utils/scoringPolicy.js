const SUCCESS_POINTS = 10;
const WRONG_OUTPUT_PENALTY = 1;
const RUNTIME_FAILURE_PENALTY = 2;
const MAX_PENALTY_PER_CHALLENGE = 3;

function normalizeChallengeProgress(user) {
  return Array.isArray(user?.challengeProgress)
    ? user.challengeProgress.map((entry) => ({
        challengeKey: String(entry?.challengeKey || ""),
        failedAttempts: Number(entry?.failedAttempts || 0),
        penaltyPoints: Number(entry?.penaltyPoints || 0),
      }))
    : [];
}

function buildFailureScoreUpdate(user, challengeKey, failureType) {
  const progress = normalizeChallengeProgress(user);
  const entryIndex = progress.findIndex((entry) => entry.challengeKey === challengeKey);
  const currentEntry =
    entryIndex >= 0
      ? progress[entryIndex]
      : { challengeKey, failedAttempts: 0, penaltyPoints: 0 };

  const basePenalty =
    failureType === "runtime" ? RUNTIME_FAILURE_PENALTY : WRONG_OUTPUT_PENALTY;

  let pointsDelta = 0;
  if (currentEntry.failedAttempts >= 1) {
    const remainingPenalty = Math.max(
      0,
      MAX_PENALTY_PER_CHALLENGE - Number(currentEntry.penaltyPoints || 0)
    );
    pointsDelta = -Math.min(basePenalty, remainingPenalty);
  }

  const nextEntry = {
    challengeKey,
    failedAttempts: currentEntry.failedAttempts + 1,
    penaltyPoints: currentEntry.penaltyPoints + Math.abs(pointsDelta),
  };

  if (entryIndex >= 0) {
    progress[entryIndex] = nextEntry;
  } else {
    progress.push(nextEntry);
  }

  return {
    pointsDelta,
    nextPoints: Math.max(0, Number(user?.points || 0) + pointsDelta),
    challengeProgress: progress,
    failedAttempts: nextEntry.failedAttempts,
    penaltyPoints: nextEntry.penaltyPoints,
  };
}

module.exports = {
  SUCCESS_POINTS,
  buildFailureScoreUpdate,
};

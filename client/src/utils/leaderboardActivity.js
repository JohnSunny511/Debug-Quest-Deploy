const ACTIVITY_STORAGE_KEY = "debugQuestLeaderboardActivity";
const LAST_POINTS_STORAGE_KEY = "debugQuestLeaderboardLastKnownPoints";

const toLocalDateKey = (value = new Date()) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getTodayKey = () => toLocalDateKey(new Date());

const normalizeEntries = (value) => {
  if (!Array.isArray(value)) return [];

  return value
    .filter((entry) => entry && typeof entry.date === "string")
    .map((entry) => ({
      date: entry.date,
      count: Number(entry.count || 0),
    }));
};

export const readLocalLeaderboardActivity = () => {
  try {
    const raw = localStorage.getItem(ACTIVITY_STORAGE_KEY);
    if (!raw) return [];
    return normalizeEntries(JSON.parse(raw));
  } catch (_err) {
    return [];
  }
};

export const recordLocalLeaderboardActivity = () => {
  const today = getTodayKey();
  const current = readLocalLeaderboardActivity();
  const next = [...current];
  const existingIndex = next.findIndex((entry) => entry.date === today);

  if (existingIndex >= 0) {
    next[existingIndex] = {
      date: today,
      count: Number(next[existingIndex].count || 0) + 1,
    };
  } else {
    next.push({ date: today, count: 1 });
  }

  const trimmed = next
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .slice(-365);

  localStorage.setItem(ACTIVITY_STORAGE_KEY, JSON.stringify(trimmed));
  localStorage.setItem("debugQuestLeaderboardActivityUpdatedAt", String(Date.now()));

  return trimmed;
};

export const buildLeaderboardActivityWindow = (entries, daysToShow = 84) => {
  const map = new Map();

  normalizeEntries(entries).forEach((entry) => {
    map.set(entry.date, Number(entry.count || 0));
  });

  return Array.from({ length: daysToShow }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (daysToShow - index - 1));
    const date = toLocalDateKey(day);

    return {
      date,
      count: Number(map.get(date) || 0),
    };
  });
};

export const summarizeLeaderboardActivity = (entries) => {
  const activity = buildLeaderboardActivityWindow(entries);
  const totalSubmissions = activity.reduce(
    (sum, entry) => sum + Number(entry.count || 0),
    0
  );
  const activeDays = activity.filter((entry) => Number(entry.count || 0) > 0).length;

  let currentStreak = 0;
  for (let index = activity.length - 1; index >= 0; index -= 1) {
    if (Number(activity[index].count || 0) > 0) {
      currentStreak += 1;
    } else {
      break;
    }
  }

  return {
    activity,
    summary: {
      totalSubmissions,
      activeDays,
      currentStreak,
    },
  };
};

export const syncLocalActivityFromScore = (username, points) => {
  if (!username) return readLocalLeaderboardActivity();

  const safePoints = Number(points || 0);

  try {
    const raw = localStorage.getItem(LAST_POINTS_STORAGE_KEY);
    const snapshots = raw ? JSON.parse(raw) : {};
    const previousPoints = Number(snapshots?.[username] || 0);
    const gainedPoints = safePoints - previousPoints;

    if (gainedPoints >= 10) {
      const solvesToAdd = Math.floor(gainedPoints / 10);
      for (let index = 0; index < solvesToAdd; index += 1) {
        recordLocalLeaderboardActivity();
      }
    }

    snapshots[username] = safePoints;
    localStorage.setItem(LAST_POINTS_STORAGE_KEY, JSON.stringify(snapshots));
  } catch (_err) {
    return readLocalLeaderboardActivity();
  }

  return readLocalLeaderboardActivity();
};

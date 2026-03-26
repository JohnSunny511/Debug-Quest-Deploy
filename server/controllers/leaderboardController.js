const User = require('../models/User');

function toLocalDateKey(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

exports.getLeaderboard = async (req, res) => {
  try {
    const topUsers = await User.find({}, "username points")
      .sort({ points: -1, username: 1 })
      .limit(10)
      .lean();
    const activityUsers = await User.find({}, "activity").lean();

    const daysToShow = 84;
    const dateKeys = Array.from({ length: daysToShow }, (_, index) => {
      const day = new Date();
      day.setHours(0, 0, 0, 0);
      day.setDate(day.getDate() - (daysToShow - index - 1));
      return toLocalDateKey(day);
    });

    const activityMap = new Map(dateKeys.map((key) => [key, 0]));
    let totalSubmissions = 0;

    activityUsers.forEach((user) => {
      (user.activity || []).forEach((entry) => {
        if (!entry?.date || !activityMap.has(entry.date)) return;
        const count = Number(entry.count || 0);
        activityMap.set(entry.date, Number(activityMap.get(entry.date) || 0) + count);
        totalSubmissions += count;
      });
    });

    const activity = dateKeys.map((date) => ({
      date,
      count: Number(activityMap.get(date) || 0),
    }));

    const activeDays = activity.filter((item) => item.count > 0).length;
    let currentStreak = 0;
    for (let index = activity.length - 1; index >= 0; index -= 1) {
      if (activity[index].count > 0) {
        currentStreak += 1;
      } else {
        break;
      }
    }

    res.json({
      users: topUsers.map((user) => ({
        username: user.username,
        points: Number(user.points || 0),
      })),
      activity,
      summary: {
        totalSubmissions,
        activeDays,
        currentStreak,
      },
    });
  } catch (_err) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};

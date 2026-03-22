const User = require('../models/User');

exports.getLeaderboard = async (req, res) => {
  try {
    const users = await User.find({}, 'username points')
                            .sort({ points: -1 }) // descending order
                            .limit(10); // top 10

    res.json(users);
  } catch (_err) {
    res.status(500).json({ message: "Error fetching leaderboard" });
  }
};

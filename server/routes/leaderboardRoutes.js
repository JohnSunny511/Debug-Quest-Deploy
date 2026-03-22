const express = require('express');
const router = express.Router();
const { getLeaderboard } = require('../controllers/leaderboardController');
const { authenticateUser } = require("../middleware/authMiddleware");

router.get('/', authenticateUser, getLeaderboard);

module.exports = router;

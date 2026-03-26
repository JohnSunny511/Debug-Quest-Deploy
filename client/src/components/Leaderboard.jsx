import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { API_BASE_URL } from "../config/api";
import {
  buildLeaderboardActivityWindow,
  readLocalLeaderboardActivity,
  summarizeLeaderboardActivity,
  syncLocalActivityFromScore,
} from "../utils/leaderboardActivity";
import "./Leaderboard.css";

const getMedal = (index) => {
  if (index === 0) return "Gold";
  if (index === 1) return "Silver";
  if (index === 2) return "Bronze";
  return `Rank ${index + 1}`;
};

const getActivityTone = (value) => {
  if (value >= 4) return "is-strong";
  if (value >= 3) return "is-high";
  if (value >= 2) return "is-mid";
  if (value >= 1) return "is-low";
  return "is-empty";
};

function Leaderboard() {
  const [users, setUsers] = useState([]);
  const [activity, setActivity] = useState([]);
  const [summary, setSummary] = useState({
    totalSubmissions: 0,
    activeDays: 0,
    currentStreak: 0,
  });
  const [errorMessage, setErrorMessage] = useState("");
  const token = localStorage.getItem("token");
  const username = localStorage.getItem("username");

  useEffect(() => {
    let isMounted = true;

    const loadLeaderboard = () => {
      axios
        .get(`${API_BASE_URL}/api/leaderboard`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        .then((res) => {
          if (!isMounted) return;

          const payload = res.data;

          if (Array.isArray(payload)) {
            const localFallback = summarizeLeaderboardActivity(readLocalLeaderboardActivity());
            setUsers(
              payload.filter(
                (item) =>
                  item &&
                  (typeof item.username === "string" || typeof item.username === "number")
              )
            );
            setActivity(localFallback.activity);
            setSummary(localFallback.summary);
            setErrorMessage("");
            return;
          }

          const nextUsers = Array.isArray(payload?.users)
            ? payload.users.filter(
                (item) =>
                  item &&
                  (typeof item.username === "string" || typeof item.username === "number")
              )
            : [];

          const currentUser = nextUsers.find((item) => item.username === username);
          const serverActivity = Array.isArray(payload?.activity) ? payload.activity : [];
          const serverSummary = {
            totalSubmissions: Number(payload?.summary?.totalSubmissions || 0),
            activeDays: Number(payload?.summary?.activeDays || 0),
            currentStreak: Number(payload?.summary?.currentStreak || 0),
          };
          const localEntries = currentUser
            ? syncLocalActivityFromScore(currentUser.username, currentUser.points)
            : readLocalLeaderboardActivity();
          const localFallback = summarizeLeaderboardActivity(localEntries);
          const shouldUseLocalFallback =
            serverSummary.totalSubmissions === 0 &&
            localFallback.summary.totalSubmissions > 0;

          setUsers(nextUsers);
          setActivity(
            shouldUseLocalFallback
              ? localFallback.activity
              : buildLeaderboardActivityWindow(serverActivity)
          );
          setSummary(shouldUseLocalFallback ? localFallback.summary : serverSummary);
          setErrorMessage(
            !nextUsers.length && !Array.isArray(payload?.users)
              ? "Leaderboard data returned in an unexpected format."
              : ""
          );
        })
        .catch((error) => {
          if (!isMounted) return;

          const message =
            error?.response?.data?.message ||
            error?.message ||
            "Unable to load leaderboard right now.";
          setErrorMessage(message);
        });
    };

    loadLeaderboard();
    const intervalId = window.setInterval(loadLeaderboard, 10000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        loadLeaderboard();
      }
    };

    const handleStorage = (event) => {
      if (event.key === "debugQuestLeaderboardActivityUpdatedAt") {
        loadLeaderboard();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorage);

    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, [token, username]);

  const topScore = users[0]?.points || 0;
  const maxActivity = activity.reduce(
    (highest, item) => Math.max(highest, Number(item?.count || 0)),
    0
  );

  const activityCells = activity.map((item) => {
    const count = Number(item?.count || 0);
    const level =
      maxActivity === 0 ? 0 : Math.ceil((count / maxActivity) * 4);

    return {
      date: item.date,
      count,
      level,
    };
  });

  return (
    <div className="leaderboard-page">
      <div className="leaderboard-ambient" aria-hidden="true">
        <span className="leaderboard-orb leaderboard-orb-a" />
        <span className="leaderboard-orb leaderboard-orb-b" />
        <span className="leaderboard-grid" />
      </div>

      <header className="leaderboard-header">
        <Link className="leaderboard-brand" to="/">
          <span className="leaderboard-brand-mark">&lt;/&gt;</span>
          <span className="leaderboard-brand-name">Debug Quest</span>
        </Link>

        <nav className="leaderboard-nav">
          <Link className="leaderboard-nav-link" to="/learn">
            Learn
          </Link>
          {token ? (
            <>
              <span className="leaderboard-welcome">
                Welcome{username ? `, ${username}` : ""}
              </span>
              <Link className="leaderboard-nav-cta" to="/challenges">
                Open Challenges
              </Link>
            </>
          ) : (
            <>
              <Link className="leaderboard-nav-link" to="/login">
                Login
              </Link>
              <Link className="leaderboard-nav-cta" to="/signup">
                Sign Up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main className="leaderboard-shell">
        <section className="leaderboard-activity-card">
          <div className="leaderboard-activity-top">
            <div>
              <p className="leaderboard-activity-title">
                {summary.totalSubmissions} submissions in the last 84 days
              </p>
            </div>

            <div className="leaderboard-activity-stats">
              <span>Total active days: {summary.activeDays}</span>
              <span>Current streak: {summary.currentStreak}</span>
              <span>Top score: {topScore}</span>
            </div>
          </div>

          <div className="leaderboard-heatmap" aria-label="Leaderboard activity overview">
            {(activityCells.length ? activityCells : []).map((cell) => (
              <span
                key={cell.date}
                className={`leaderboard-heatmap-cell ${getActivityTone(cell.level)}`}
                title={`${cell.date}: ${cell.count} submissions`}
              />
            ))}
          </div>

          {activityCells.length ? (
            <div className="leaderboard-months" aria-hidden="true">
              <span>12 weeks ago</span>
              <span>8 weeks ago</span>
              <span>4 weeks ago</span>
              <span>Now</span>
            </div>
          ) : (
            <div className="leaderboard-heatmap-empty">
              Daily activity tracking is available after the backend restart and new successful submissions.
            </div>
          )}
        </section>

        <section className="leaderboard-board">
          <div className="leaderboard-board-header">
            <div>
              <p className="leaderboard-board-kicker">Leaderboard</p>
              <h2>Current rankings</h2>
            </div>
            <p>Top 10 players</p>
          </div>

          {errorMessage ? (
            <div className="leaderboard-feedback leaderboard-error" role="alert">
              {errorMessage}
            </div>
          ) : users.length === 0 ? (
            <div className="leaderboard-feedback leaderboard-empty">
              No users yet. The first successful submission will appear here.
            </div>
          ) : (
            <div className="leaderboard-list">
              {users.map((user, index) => (
                <article className="leaderboard-row" key={`${user.username}-${index}`}>
                  <div className="leaderboard-row-left">
                    <span className={`leaderboard-rank leaderboard-rank-${index + 1}`}>
                      #{index + 1}
                    </span>
                    <div>
                      <strong>{user.username}</strong>
                      <span>{getMedal(index)}</span>
                    </div>
                  </div>

                  <div className="leaderboard-row-right">
                    <span className="leaderboard-points">{user.points} pts</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default Leaderboard;

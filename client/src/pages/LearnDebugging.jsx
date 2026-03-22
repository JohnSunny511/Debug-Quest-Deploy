import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LEARNING_MODULES, LEARNING_REFERENCES } from "./learnRoadmapData";
import {
  loadLearningProgress,
  resetLearningProgress,
  toggleModuleDoneState,
} from "./learningProgress";
import "./LearnDebugging.css";

function LearnDebugging() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(() => loadLearningProgress());

  const completedCount = useMemo(
    () => LEARNING_MODULES.filter((moduleItem) => progress[moduleItem.id]).length,
    [progress]
  );

  const completionPercent = useMemo(() => {
    if (!LEARNING_MODULES.length) return 0;
    return Math.round((completedCount / LEARNING_MODULES.length) * 100);
  }, [completedCount]);

  const handleToggleDone = (moduleId) => {
    setProgress(toggleModuleDoneState(moduleId));
  };

  const handleReset = () => {
    setProgress(resetLearningProgress());
  };

  return (
    <div className="learn-roadmap-page">
      <div className="learn-roadmap-bg" aria-hidden="true">
        <span className="roadmap-glow glow-one" />
        <span className="roadmap-glow glow-two" />
      </div>

      <header className="learn-roadmap-header">
        <div className="learn-roadmap-brand">
          <span className="roadmap-badge">DQ</span>
          <div>
            <p className="roadmap-kicker">Debug Quest Learning Hub</p>
            <h1>Debugging Roadmap</h1>
          </div>
        </div>

        <div className="learn-roadmap-actions">
          <Link className="ghost-pill" to="/">
            Home
          </Link>
          <button
            type="button"
            className="solid-pill"
            onClick={() => navigate("/challenges")}
          >
            Practice Challenges
          </button>
        </div>
      </header>

      <section className="progress-panel">
        <div className="progress-copy">
          <h2>Your Learning Progress</h2>
          <p>
            Complete each module in order. You can mark lessons done/not done
            anytime.
          </p>
        </div>
        <div className="progress-stats">
          <strong>
            {completedCount}/{LEARNING_MODULES.length} modules done
          </strong>
          <span>{completionPercent}% complete</span>
          <div className="progress-track" aria-label="Roadmap completion">
            <div
              className="progress-fill"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <button type="button" className="reset-pill" onClick={handleReset}>
            Reset Progress
          </button>
        </div>
      </section>

      <main className="roadmap-list">
        {LEARNING_MODULES.map((moduleItem) => {
          const done = Boolean(progress[moduleItem.id]);
          return (
            <article
              key={moduleItem.id}
              className={`roadmap-card${done ? " done" : ""}`}
            >
              <div className="roadmap-step">{moduleItem.order}</div>

              <div className="roadmap-content">
                <div className="roadmap-topline">
                  <h3>{moduleItem.title}</h3>
                  <span className="meta-chip">
                    {moduleItem.level} - {moduleItem.duration}
                  </span>
                </div>

                <p className="roadmap-goal">{moduleItem.goal}</p>
                <ul className="highlight-list">
                  {moduleItem.highlights.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>

                <div className="roadmap-card-actions">
                  <Link className="open-module-link" to={`/learn/${moduleItem.id}`}>
                    Open Lesson
                  </Link>
                  <button
                    type="button"
                    className={`mark-button${done ? " done" : ""}`}
                    onClick={() => handleToggleDone(moduleItem.id)}
                  >
                    {done ? "Mark Not Done" : "Mark Done"}
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </main>

      <section className="reference-panel">
        <h2>Authentic Study References</h2>
        <ul>
          {LEARNING_REFERENCES.map((item) => (
            <li key={item.url}>
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

export default LearnDebugging;

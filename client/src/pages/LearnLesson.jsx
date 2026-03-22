import React, { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { LEARNING_MODULES, getModuleById } from "./learnRoadmapData";
import { loadLearningProgress, setModuleDoneState } from "./learningProgress";
import "./LearnLesson.css";

function LearnLesson() {
  const { lessonId } = useParams();
  const navigate = useNavigate();
  const lesson = getModuleById(lessonId);
  const [progress, setProgress] = useState(() => loadLearningProgress());

  const currentIndex = useMemo(
    () => LEARNING_MODULES.findIndex((moduleItem) => moduleItem.id === lessonId),
    [lessonId]
  );

  if (!lesson) {
    return (
      <div className="lesson-page">
        <div className="lesson-empty">
          <h1>Lesson Not Found</h1>
          <p>The lesson you selected does not exist in the roadmap.</p>
          <Link to="/learn" className="lesson-home-link">
            Back to Roadmap
          </Link>
        </div>
      </div>
    );
  }

  const isDone = Boolean(progress[lesson.id]);
  const prevLesson = currentIndex > 0 ? LEARNING_MODULES[currentIndex - 1] : null;
  const nextLesson =
    currentIndex >= 0 && currentIndex < LEARNING_MODULES.length - 1
      ? LEARNING_MODULES[currentIndex + 1]
      : null;

  const handleSetDone = (done) => {
    setProgress(setModuleDoneState(lesson.id, done));
  };

  return (
    <div className="lesson-page">
      <header className="lesson-header">
        <div>
          <Link to="/learn" className="lesson-breadcrumb">
            Learning Roadmap
          </Link>
          <h1>
            {lesson.order}. {lesson.title}
          </h1>
          <p className="lesson-meta">
            {lesson.level} - {lesson.duration}
          </p>
        </div>

        <div className="lesson-header-actions">
          <button
            type="button"
            className={`lesson-status${isDone ? " done" : ""}`}
            onClick={() => handleSetDone(!isDone)}
          >
            {isDone ? "Completed" : "Not Completed"}
          </button>
          <button
            type="button"
            className="lesson-practice"
            onClick={() => navigate("/challenges")}
          >
            Practice Now
          </button>
        </div>
      </header>

      <main className="lesson-grid">
        <section className="lesson-card">
          <h2>Goal</h2>
          <p>{lesson.goal}</p>
        </section>

        <section className="lesson-card">
          <h2>Overview</h2>
          <p>{lesson.content.overview}</p>
          <p>{lesson.content.whyItMatters}</p>
        </section>

        <section className="lesson-card">
          <h2>Key Ideas</h2>
          <ul>
            {lesson.content.keyIdeas.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="lesson-card">
          <h2>Practice Tasks</h2>
          <ul>
            {lesson.content.practice.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="lesson-card">
          <h2>Common Mistakes</h2>
          <ul>
            {lesson.content.mistakes.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="lesson-card">
          <h2>Quick Check</h2>
          {lesson.content.quiz.map((item) => (
            <div key={item.question} className="quiz-item">
              <p className="quiz-question">{item.question}</p>
              <p className="quiz-answer">{item.answer}</p>
            </div>
          ))}
        </section>
      </main>

      <footer className="lesson-footer">
        {prevLesson ? (
          <Link className="nav-link" to={`/learn/${prevLesson.id}`}>
            Previous: {prevLesson.title}
          </Link>
        ) : (
          <span className="nav-placeholder">Start of roadmap</span>
        )}

        <Link className="nav-link center" to="/learn">
          Back to roadmap
        </Link>

        {nextLesson ? (
          <Link className="nav-link" to={`/learn/${nextLesson.id}`}>
            Next: {nextLesson.title}
          </Link>
        ) : (
          <span className="nav-placeholder">Last lesson completed</span>
        )}
      </footer>
    </div>
  );
}

export default LearnLesson;

// Root.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BackButton from "./BackButton";
import AdminRoute from "./AdminRoute";

const Signup = lazy(() => import("./Signup"));
const Login = lazy(() => import("../pages/Login"));
const App = lazy(() => import("./App"));
const Landing = lazy(() => import("../pages/Landing"));
const LearnDebugging = lazy(() => import("../pages/LearnDebugging"));
const LearnLesson = lazy(() => import("../pages/LearnLesson"));
const Leaderboard = lazy(() => import("./Leaderboard"));
const BuggyCodeGenerator = lazy(() => import("./BuggyCodeGenerator"));
const QuestionsList = lazy(() => import("../pages/QuestionsList"));
const QuestionDetail = lazy(() => import("../pages/QuestionDetail"));
const InternalDashboard = lazy(() => import("../pages/InternalDashboard"));
const AdminChatbotSettings = lazy(() => import("../pages/AdminChatbotSettings"));
const AdminQuestionManager = lazy(() => import("../pages/AdminQuestionManager"));

function Root() {
  return (
    <Router>
      <BackButton />
      <Suspense
        fallback={
          <div
            style={{
              minHeight: "100vh",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#0f172a",
              color: "#f1f5f9",
              fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
            }}
          >
            Loading...
          </div>
        }
      >
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/learn" element={<LearnDebugging />} />
          <Route path="/learn/:lessonId" element={<LearnLesson />} />
          <Route path="/challenges" element={<App />} />
          <Route path="/:level" element={<QuestionsList />} />
          <Route path="/:level/:id" element={<QuestionDetail />} />
          <Route path="/buggy" element={<BuggyCodeGenerator />} />
          <Route
            path="/dashboard/internal"
            element={
              <AdminRoute>
                <InternalDashboard />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/internal/chatbot"
            element={
              <AdminRoute>
                <AdminChatbotSettings />
              </AdminRoute>
            }
          />
          <Route
            path="/dashboard/internal/questions"
            element={
              <AdminRoute>
                <AdminQuestionManager />
              </AdminRoute>
            }
          />
          <Route path="/signup" element={<Signup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

export default Root;

// Root.jsx
import React, { Suspense, lazy } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import BackButton from "./BackButton";
import AdminRoute from "./AdminRoute";
import PageLoader from "./PageLoader";

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
const AdminDiscussionReports = lazy(() => import("../pages/AdminDiscussionReports"));

function Root() {
  return (
    <Router>
      <BackButton />
      <Suspense
        fallback={
          <PageLoader />
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
          <Route
            path="/dashboard/internal/discussions"
            element={
              <AdminRoute>
                <AdminDiscussionReports />
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

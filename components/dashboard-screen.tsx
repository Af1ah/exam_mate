"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useMemo } from "react";
import { getEncouragement } from "@/lib/encouragement";

const ScoreChart = dynamic(
  () => import("@/components/score-chart").then((mod) => mod.ScoreChart),
  {
    ssr: false,
    loading: () => (
      <div className="score-chart" style={{ display: "grid", placeItems: "center", color: "#64718a" }}>
        Loading score chart…
      </div>
    ),
  },
);

export type DashboardData = {
  attemptedToday: boolean;
  completedToday?: boolean;
  hasActiveAttempt?: boolean;
  canStartAnother: boolean;
  nextQuiz: { subject: string; topic: string } | null;
  summary: { attempts: number; averageScore: number; bestScore: number };
  activity: { id: string; day: string; score: number; total: number; topic: string }[];
};

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

export function DashboardScreen({ dashboard }: { dashboard: DashboardData }) {
  const isCompleted = Boolean(dashboard.completedToday);
  const isActive = Boolean(dashboard.hasActiveAttempt);

  const calendar = useMemo(() => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    return {
      year,
      month,
      firstDay: new Date(year, month, 1).getDay(),
      daysInMonth: new Date(year, month + 1, 0).getDate(),
      completed: new Map(dashboard.activity.map((attempt) => [attempt.day, attempt.id])),
      label: `${MONTH_NAMES[month]} ${year}`,
    };
  }, [dashboard.activity]);

  const chartData = useMemo(
    () =>
      dashboard.activity.slice(-7).map((attempt, i) => {
        const rawDate = attempt.day.includes(" ") ? attempt.day.replace(" ", "T") : attempt.day;
        const dateObj = new Date(rawDate.includes("T") ? rawDate : `${rawDate}T00:00:00`);
        const displayDate = isNaN(dateObj.getTime())
          ? attempt.day
          : dateObj.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
        return {
          id: attempt.id || `attempt-${i}`,
          displayDate,
          score: attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0,
        };
      }),
    [dashboard.activity],
  );

  return (
    <main className="dashboard">
      <section className="dashboard-hero">
        <h1>
          {isActive
            ? "Your quiz is in progress."
            : isCompleted
              ? "Today’s set is complete."
              : "Today’s quiz is ready."}
        </h1>
      </section>
      <section className="dashboard-stats" aria-label="Quiz summary">
        <article>
          <span>Completed</span>
          <strong>{dashboard.summary.attempts}</strong>
          <small>quiz attempts</small>
        </article>
        <article>
          <span>Average score</span>
          <strong>{dashboard.summary.averageScore}%</strong>
          <small>across completed quizzes</small>
        </article>
        <article>
          <span>Best score</span>
          <strong>{dashboard.summary.bestScore}%</strong>
          <small>your strongest result</small>
        </article>
      </section>

      {!isCompleted && (
        <section className="dashboard-banner" aria-label="Quiz action">
          <div className="dashboard-banner-content">
            <div className="dashboard-banner-header">
              <span className={isActive ? "dashboard-badge pulse" : "dashboard-badge"}>
                {isActive ? "In Progress" : "Ready Today"}
              </span>
              <p className="dashboard-banner-title">
                {isActive
                  ? "Active timed quiz"
                  : dashboard.nextQuiz
                    ? `${dashboard.nextQuiz.subject} · ${dashboard.nextQuiz.topic}`
                    : "Daily 10-question set"}
              </p>
            </div>
            <p className="dashboard-banner-subtitle">
              {isActive
                ? "Your session is running. Finish your questions before the timer expires."
                : "10 focused questions to keep your knowledge sharp and streak active."}
            </p>
          </div>
          <Link className="button" href="/quiz">
            {isActive ? "Resume →" : "Start Quiz →"}
          </Link>
        </section>
      )}

      <section className="dashboard-grid">
        <article className="card chart-card">
          <h2>Recent quiz scores</h2>
          {chartData.length > 0 ? (
            <ScoreChart data={chartData} />
          ) : (
            <p className="empty-chart">Your score trend will appear after your first completed quiz.</p>
          )}
        </article>
        <article className="card calendar-card">
          <h2>{calendar.label}</h2>
          <div className="weekdays">
            {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
              <span key={`${day}-${index}`}>{day}</span>
            ))}
          </div>
          <div className="calendar-days">
            {Array.from({ length: calendar.firstDay }, (_, index) => (
              <i key={`blank-${index}`} />
            ))}
            {Array.from({ length: calendar.daysInMonth }, (_, index) => {
              const day = index + 1;
              const key = `${calendar.year}-${String(calendar.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
              const attemptId = calendar.completed.get(key);
              return attemptId ? (
                <Link
                  aria-label={`Review quiz completed on ${day} ${MONTH_NAMES[calendar.month]} ${calendar.year}`}
                  className="attended"
                  href={`/result/${attemptId}`}
                  key={key}
                >
                  ✓
                </Link>
              ) : (
                <span key={key}>{day}</span>
              );
            })}
          </div>
          <p className="calendar-note">
            <b>✓</b> Quiz completed
          </p>
        </article>
      </section>

      {isCompleted && (
        <section className="dashboard-completion-card" aria-label="Daily completion note">
          <div className="completion-content">
            <div className="completion-icon-wrapper">
              <div className="completion-badge">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
              </div>
            </div>
            <div className="completion-text">
              <p className="completion-title">
                {getEncouragement(`${dashboard.summary.attempts}-${dashboard.activity.at(-1)?.day ?? "start"}`)}
              </p>
              <p className="completion-subtitle">
                Great job! You’ve completed today’s quiz. Come back tomorrow for a fresh topic!
              </p>
            </div>
          </div>
          {dashboard.canStartAnother && (
            <div className="completion-action">
              <Link className="button" href="/quiz?newAttempt=1">
                Practice Again
              </Link>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

"use client";

import Link from "next/link";
import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { getEncouragement } from "@/lib/encouragement";

export type DashboardData = {
  attemptedToday: boolean;
  canStartAnother: boolean;
  nextQuiz: { subject: string; topic: string } | null;
  summary: { attempts: number; averageScore: number; bestScore: number };
  activity: { id: string; day: string; score: number; total: number; topic: string }[];
};

export function DashboardScreen({ dashboard }: { dashboard: DashboardData }) {
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
      label: today.toLocaleString("en-IN", { month: "long", year: "numeric" }),
    };
  }, [dashboard.activity]);
  const chartData = useMemo(
    () =>
      dashboard.activity.slice(-7).map((attempt) => ({
        label: new Date(`${attempt.day}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "short" }),
        score: attempt.total ? Math.round((attempt.score / attempt.total) * 100) : 0,
      })),
    [dashboard.activity],
  );
  return (
    <main className="dashboard">
      <section className="dashboard-hero">
        <h1>Today’s set is complete.</h1>
        <p className="dashboard-message">
          {getEncouragement(`${dashboard.summary.attempts}-${dashboard.activity.at(-1)?.day ?? "start"}`)}
        </p>
        <p>Review your progress now, then return tomorrow for a new topic.</p>
        {dashboard.canStartAnother && (
          <Link className="button button-secondary" href="/quiz?newAttempt=1">
            Start another test attempt
          </Link>
        )}
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
      <section className="dashboard-grid">
        <article className="card chart-card">
          <h2>Recent quiz scores</h2>
          {chartData.length ? (
            <div className="score-chart" aria-label="Recent score trend">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 12, right: 10, left: -22, bottom: 0 }}>
                  <CartesianGrid stroke="#e6eaf3" strokeDasharray="4 4" vertical={false} />
                  <XAxis dataKey="label" tick={{ fill: "#72809a", fontSize: 12 }} tickLine={false} axisLine={false} />
                  <YAxis
                    domain={[0, 100]}
                    tick={{ fill: "#72809a", fontSize: 12 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip
                    cursor={{ stroke: "#cbd5ea", strokeWidth: 1 }}
                    formatter={(value) => [`${value}%`, "Score"]}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#315be2"
                    strokeWidth={3}
                    dot={{ fill: "#fff", stroke: "#315be2", strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
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
                  aria-label={`Review quiz completed on ${new Date(`${key}T00:00:00`).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}`}
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
    </main>
  );
}

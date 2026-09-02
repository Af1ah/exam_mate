"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AUTH_POLICY } from "@/lib/auth/constants";
type Quiz = {
  id: string;
  expiresAt: string;
  topic: string;
  subject: string;
  questions: { id: number; content: string; options: string[] }[];
  initialAnswers?: Record<number, string>;
};

function parseIsoDate(value?: string | null): number {
  if (!value) return 0;
  const normalized = value.includes(" ") ? value.replace(" ", "T") : value;
  const time = new Date(normalized).getTime();
  return isNaN(time) ? 0 : time;
}

function getRemainingSeconds(expiresAtStr?: string) {
  if (!expiresAtStr) return 600;
  const targetTime = parseIsoDate(expiresAtStr);
  if (!targetTime) return 0;
  return Math.max(0, Math.ceil((targetTime - Date.now()) / 1000));
}

export function QuizApp({
  profileComplete,
  nextQuiz,
  initialQuiz,
}: {
  profileComplete: boolean;
  nextQuiz: { subject: string; topic: string } | null;
  initialQuiz?: Quiz | null;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState({ name: "", dateOfBirth: "", examGoal: "", email: "", password: "" });
  const [quiz, setQuiz] = useState<Quiz | null>(initialQuiz ?? null);
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>(initialQuiz?.initialAnswers ?? {});
  const [seconds, setSeconds] = useState(() => getRemainingSeconds(initialQuiz?.expiresAt));
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const hasAutoSubmittedRef = useRef(false);

  const submit = useCallback(async () => {
    if (!quiz || busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/quiz/${quiz.id}/submit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (response.ok) {
        router.replace(`/result/${quiz.id}`);
      } else {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "We could not submit your quiz. Please try again.");
        setBusy(false);
      }
    } catch (err) {
      console.error("Failed to submit quiz:", err);
      setError("Network error. Please check your connection and try again.");
      setBusy(false);
    }
  }, [busy, quiz, router]);

  const begin = useCallback(async () => {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/quiz/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const body = await response.json().catch(() => ({ error: "Invalid server response" }));
      if (!response.ok) {
        setError(body.error || "Unable to start quiz. Please try again.");
        setBusy(false);
        if (String(body.error).includes("already used")) router.replace("/dashboard");
        return;
      }
      setQuiz(body);
      if (body.initialAnswers) {
        setAnswers(body.initialAnswers);
      }
      setSeconds(getRemainingSeconds(body.expiresAt));
      setBusy(false);
    } catch (err) {
      console.error("Failed to start quiz:", err);
      setError("Network error. Please check your connection and try again.");
      setBusy(false);
    }
  }, [busy, router]);

  useEffect(() => {
    if (!quiz) return;
    hasAutoSubmittedRef.current = false;
    const id = setInterval(() => {
      const left = getRemainingSeconds(quiz.expiresAt);
      setSeconds(left);
      if (left <= 0 && !hasAutoSubmittedRef.current) {
        hasAutoSubmittedRef.current = true;
        void submit();
      }
    }, 1_000);
    return () => clearInterval(id);
  }, [quiz, submit]);
  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      const response = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        setError(body.error || "Unable to save your profile.");
        setBusy(false);
        return;
      }
      setBusy(false);
      void begin();
    } catch (err) {
      console.error("Failed to save profile:", err);
      setError("Network error. Please check your connection and try again.");
      setBusy(false);
    }
  }
  async function choose(questionId: number, selectedAnswer: string) {
    setAnswers((current) => ({ ...current, [questionId]: selectedAnswer }));
    if (!quiz) return;
    try {
      const response = await fetch(`/api/quiz/${quiz.id}/answer`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionId, selectedAnswer }),
      });
      if (!response.ok) setError("We could not save that answer. Please select it again.");
    } catch (err) {
      console.error("Failed to save answer:", err);
    }
  }
  if (!profileComplete && !quiz)
    return (
      <main className="center">
        <section className="card profile-card">
          <h1>Let’s personalize your quiz.</h1>
          <p>Your WhatsApp number is already securely linked.</p>
          <form onSubmit={saveProfile}>
            <label>
              Your name
              <input
                autoComplete="name"
                maxLength={80}
                name="name"
                required
                placeholder="e.g. Aflah"
                value={profile.name}
                onChange={(event) => setProfile({ ...profile, name: event.target.value })}
              />
            </label>
            <label>
              Date of birth
              <input
                autoComplete="bday"
                name="dateOfBirth"
                required
                type="date"
                value={profile.dateOfBirth}
                onChange={(event) => setProfile({ ...profile, dateOfBirth: event.target.value })}
              />
            </label>
            <label>
              Exam you are preparing for
              <input
                autoComplete="off"
                maxLength={120}
                name="examGoal"
                required
                placeholder="e.g. SSC CGL"
                value={profile.examGoal}
                onChange={(event) => setProfile({ ...profile, examGoal: event.target.value })}
              />
            </label>
            <label>
              Email for password sign-in
              <input
                autoComplete="email"
                maxLength={254}
                name="email"
                required
                type="email"
                value={profile.email}
                onChange={(event) => setProfile({ ...profile, email: event.target.value })}
              />
            </label>
            <label>
              Create a password
              <input
                autoComplete="new-password"
                minLength={AUTH_POLICY.passwordMinLength}
                maxLength={AUTH_POLICY.passwordMaxLength}
                name="password"
                required
                type="password"
                value={profile.password}
                onChange={(event) => setProfile({ ...profile, password: event.target.value })}
              />
              <span className="field-hint">
                Use {AUTH_POLICY.passwordMinLength}–{AUTH_POLICY.passwordMaxLength} characters.
              </span>
            </label>
            <button className="button" disabled={busy}>
              {busy ? "Saving profile…" : "Start my 10-minute quiz"}
            </button>
          </form>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
      </main>
    );
  if (!quiz)
    return (
      <main className="center">
        <section className="card start-card">
          <h1>Your daily topic is ready.</h1>
          {nextQuiz && (
            <p className="quiz-category">
              <strong>{nextQuiz.subject}</strong>
              <span>{nextQuiz.topic}</span>
            </p>
          )}
          <p>One attempt today. Your 10-minute timer begins when you start.</p>
          <button className="button" disabled={busy} onClick={() => void begin()}>
            {busy ? "Preparing quiz…" : "Start today’s quiz"}
          </button>
          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}
        </section>
      </main>
    );
  const question = quiz.questions[position];
  return (
    <main className="quiz">
      <header className="quiz-header">
        <div>
          <span className="quiz-topic">
            {quiz.subject} · {quiz.topic}
          </span>
          <span>
            Question {position + 1} of {quiz.questions.length}
          </span>
        </div>
        <strong>
          {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
        </strong>
      </header>
      <div className="progress">
        <i style={{ transform: `scaleX(${(position + 1) / quiz.questions.length})` }} />
      </div>
      <section className="card question-card">
        <p className="question-number">Question {position + 1}</p>
        <h1>{question.content}</h1>
        <div className="options">
          {question.options.map((option) => (
            <button
              aria-pressed={answers[question.id] === option}
              className={answers[question.id] === option ? "selected" : ""}
              key={option}
              onClick={() => void choose(question.id, option)}
            >
              {option}
            </button>
          ))}
        </div>
      </section>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <footer className="quiz-footer">
        <span>{Object.keys(answers).length} answered</span>
        <div>
          <button
            className="button button-secondary"
            disabled={!position || busy}
            onClick={() => setPosition(position - 1)}
          >
            Back
          </button>
          {position === quiz.questions.length - 1 ? (
            <button className="button" disabled={busy} onClick={() => void submit()}>
              {busy ? "Submitting…" : "Submit quiz"}
            </button>
          ) : (
            <button className="button" disabled={busy} onClick={() => setPosition(position + 1)}>
              Next question
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}

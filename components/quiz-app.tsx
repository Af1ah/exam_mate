"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
type Quiz = {
  id: string;
  expiresAt: string;
  topic: string;
  subject: string;
  questions: { id: number; content: string; options: string[] }[];
};
export function QuizApp({
  profileComplete,
  nextQuiz,
}: {
  profileComplete: boolean;
  nextQuiz: { subject: string; topic: string } | null;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState({ name: "", dateOfBirth: "", examGoal: "" });
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [position, setPosition] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [seconds, setSeconds] = useState(600);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const begin = useCallback(async () => {
    if (busy) return;
    setBusy(true);
    const response = await fetch("/api/quiz/start", { method: "POST" });
    const body = await response.json();
    if (!response.ok) {
      setError(body.error);
      setBusy(false);
      if (String(body.error).includes("already used")) router.replace("/dashboard");
      return;
    }
    setQuiz(body);
    setBusy(false);
  }, [busy, router]);
  const submit = useCallback(async () => {
    if (!quiz || busy) return;
    setBusy(true);
    const response = await fetch(`/api/quiz/${quiz.id}/submit`, { method: "POST" });
    if (response.ok) router.replace(`/result/${quiz.id}`);
    else {
      setError("We could not submit your quiz. Please try again.");
      setBusy(false);
    }
  }, [busy, quiz, router]);
  useEffect(() => {
    if (!quiz) return;
    const id = setInterval(() => {
      const left = Math.max(0, Math.ceil((new Date(quiz.expiresAt).getTime() - Date.now()) / 1000));
      setSeconds(left);
      if (!left) void submit();
    }, 1_000);
    return () => clearInterval(id);
  }, [quiz, submit]);
  async function saveProfile(event: React.FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    const response = await fetch("/api/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!response.ok) {
      setError((await response.json()).error);
      setBusy(false);
      return;
    }
    setBusy(false);
    void begin();
  }
  async function choose(questionId: number, selectedAnswer: string) {
    setAnswers((current) => ({ ...current, [questionId]: selectedAnswer }));
    if (!quiz) return;
    const response = await fetch(`/api/quiz/${quiz.id}/answer`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ questionId, selectedAnswer }),
    });
    if (!response.ok) setError("We could not save that answer. Please select it again.");
  }
  if (!profileComplete && !quiz)
    return (
      <main className="center">
        <section className="card profile-card">
          <p className="eyebrow">Exam Mate</p>
          <h1>Let’s personalize your quiz.</h1>
          <p>Your WhatsApp number is already securely linked.</p>
          <form onSubmit={saveProfile}>
            <label>
              Your name
              <input
                autoComplete="name"
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
                name="examGoal"
                required
                placeholder="e.g. SSC CGL"
                value={profile.examGoal}
                onChange={(event) => setProfile({ ...profile, examGoal: event.target.value })}
              />
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
          <p className="eyebrow">Today’s quiz</p>
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

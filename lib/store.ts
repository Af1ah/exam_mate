/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/prisma/db";
import { newId } from "@/lib/auth/crypto";
import { parseDatabaseTimestamp } from "@/lib/datetime";

const orm = db.orm.public as any;
const now = () => new Date().toISOString();
const INDIA_TIME_ZONE = "Asia/Kolkata";

function toIsoDate(value: string | Date | null | undefined): string {
  const timestamp = parseDatabaseTimestamp(value);
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : "";
}

function parseDate(value: string | Date | null | undefined): Date {
  const timestamp = parseDatabaseTimestamp(value);
  return Number.isFinite(timestamp) ? new Date(timestamp) : new Date(0);
}

function indiaQuizDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: INDIA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

function shuffled<T>(values: T[]) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export async function saveProfile(userId: string, profile: { name: string; dateOfBirth: string; examGoal: string }) {
  return orm.User.where({ id: userId }).update({ ...profile, onboardingStep: 2, updatedAt: now() });
}

const unlimitedAttemptsEnabled = () => process.env.NODE_ENV === "development";

async function planDailyQuiz(userId: string) {
  const quizDay = indiaQuizDay();
  const [catalogRows, previousAttemptRows] = await Promise.all([
    orm.Question.orderBy((question: any) => question.topic.asc())
      .orderBy((question: any) => question.id.asc())
      .all(),
    orm.QuizAttempt.where({ userId }).all(),
  ]);
  const catalog: any[] = catalogRows as any[];
  const previousAttempts: any[] = previousAttemptRows as any[];
  const previousAnswers = await Promise.all(
    previousAttempts.map((attempt: any) => orm.AttemptQuestion.where({ attemptId: attempt.id }).all()),
  );
  const seenQuestionIds = new Set(previousAnswers.flat().map((answer: any) => answer.questionId));
  const topics: string[] = [
    ...new Set<string>(
      catalog.filter((question: any) => !seenQuestionIds.has(question.id)).map((question: any) => question.topic),
    ),
  ]
    .filter(
      (topic) =>
        catalog.filter((question: any) => question.topic === topic && !seenQuestionIds.has(question.id)).length >= 10,
    )
    .sort();
  if (!topics.length) throw new Error("You have completed every available topic. New questions will be added soon.");

  const dayIndex = Math.floor(Date.parse(`${quizDay}T00:00:00Z`) / 86_400_000) % topics.length;
  const topic = topics[dayIndex];
  const questions = shuffled(
    catalog.filter((question: any) => question.topic === topic && !seenQuestionIds.has(question.id)),
  ).slice(0, 10);
  return { quizDay, topic, subject: questions[0]?.subject ?? "Daily practice", questions };
}

export async function getActiveAttempt(userId: string) {
  const attempt = await orm.QuizAttempt.where({ userId })
    .orderBy((a: any) => a.startedAt.desc())
    .first();

  if (!attempt || attempt.status !== "IN_PROGRESS") return null;

  if (parseDate(attempt.expiresAt) <= new Date()) {
    await orm.QuizAttempt.where({ id: attempt.id }).update({
      status: "EXPIRED",
      updatedAt: now(),
    });
    return null;
  }

  const attemptQuestions = await orm.AttemptQuestion.where({ attemptId: attempt.id })
    .orderBy((aq: any) => aq.position.asc())
    .all();

  const questionsWithDetails = await Promise.all(
    attemptQuestions.map(async (aq: any) => {
      const q = await orm.Question.first({ id: aq.questionId });
      return {
        id: aq.questionId,
        position: aq.position,
        content: q?.content ?? "",
        subject: q?.subject ?? "Daily practice",
        options: q ? shuffled([...new Set([q.optionA, q.optionB, q.optionC, q.rightAnswer])]) : [],
        selectedAnswer: aq.selectedAnswer ?? null,
      };
    }),
  );

  const initialAnswers: Record<number, string> = {};
  for (const q of questionsWithDetails) {
    if (q.selectedAnswer) {
      initialAnswers[q.id] = q.selectedAnswer;
    }
  }

  return {
    id: attempt.id,
    expiresAt: toIsoDate(attempt.expiresAt),
    quizDay: attempt.quizDay,
    topic: attempt.topic,
    subject: questionsWithDetails[0]?.subject ?? "Daily practice",
    questions: questionsWithDetails.map((q) => ({
      id: q.id,
      content: q.content,
      options: q.options,
    })),
    initialAnswers,
  };
}

export async function getUserDashboard(userId: string) {
  const quizDay = indiaQuizDay();
  const attempts = await orm.QuizAttempt.where({ userId })
    .orderBy((attempt: any) => attempt.startedAt.desc())
    .all();
  const activeAttempt = attempts.find(
    (attempt: any) => attempt.status === "IN_PROGRESS" && parseDate(attempt.expiresAt) > new Date(),
  );
  const completed = attempts.filter((attempt: any) => attempt.status !== "IN_PROGRESS");
  const scored = completed.filter((attempt: any) => typeof attempt.score === "number" && attempt.total > 0);
  const averageScore = scored.length
    ? Math.round(
        scored.reduce((sum: number, attempt: any) => sum + (attempt.score / attempt.total) * 100, 0) / scored.length,
      )
    : 0;
  const bestScore = scored.length
    ? Math.max(...scored.map((attempt: any) => Math.round((attempt.score / attempt.total) * 100)))
    : 0;
  const todayAttempt = attempts.find(
    (attempt: any) => attempt.quizDay === quizDay || attempt.quizDay.startsWith(`${quizDay}:`),
  );
  const completedToday = Boolean(todayAttempt && todayAttempt.status !== "IN_PROGRESS");
  let nextQuiz: { subject: string; topic: string } | null = null;
  if (!todayAttempt || unlimitedAttemptsEnabled()) {
    try {
      const planned = await planDailyQuiz(userId);
      nextQuiz = { subject: planned.subject, topic: planned.topic };
    } catch {
      nextQuiz = null;
    }
  }
  return {
    attemptedToday: Boolean(todayAttempt),
    completedToday,
    hasActiveAttempt: Boolean(activeAttempt),
    canStartAnother: unlimitedAttemptsEnabled(),
    nextQuiz,
    summary: { attempts: completed.length, averageScore, bestScore },
    activity: completed
      .slice(0, 12)
      .reverse()
      .map((attempt: any) => ({
        id: attempt.id,
        day: attempt.quizDay.slice(0, 10),
        score: attempt.score ?? 0,
        total: attempt.total,
        topic: attempt.topic,
      })),
  };
}

export async function startAttempt(userId: string) {
  const active = await getActiveAttempt(userId);
  if (active) return active;

  const unlimitedAttempts = unlimitedAttemptsEnabled();
  const quizDay = indiaQuizDay();
  const existingToday = await orm.QuizAttempt.where({ userId })
    .orderBy((attempt: any) => attempt.startedAt.desc())
    .all();
  const usedToday = existingToday.some(
    (attempt: any) => attempt.quizDay === quizDay || (!unlimitedAttempts && attempt.quizDay.startsWith(`${quizDay}:`)),
  );
  if (!unlimitedAttempts && usedToday) {
    throw new Error("You have already used today’s quiz attempt. Come back tomorrow for a new topic.");
  }
  const { topic, subject, questions } = await planDailyQuiz(userId);
  const id = newId();
  const attemptDay = unlimitedAttempts ? `${quizDay}:${id}` : quizDay;
  const startedAt = now();
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  await orm.QuizAttempt.create({
    id,
    userId,
    quizDay: attemptDay,
    topic,
    status: "IN_PROGRESS",
    startedAt,
    expiresAt,
    total: 10,
    createdAt: startedAt,
    updatedAt: startedAt,
  });
  await Promise.all(
    questions.map((question: any, index: number) =>
      orm.AttemptQuestion.create({
        id: newId(),
        attemptId: id,
        questionId: question.id,
        position: index + 1,
        createdAt: startedAt,
        updatedAt: startedAt,
      }),
    ),
  );
  return {
    id,
    expiresAt: toIsoDate(expiresAt),
    quizDay,
    topic,
    subject,
    questions: questions.map((question: any) => ({
      id: question.id,
      content: question.content,
      options: shuffled([...new Set([question.optionA, question.optionB, question.optionC, question.rightAnswer])]),
    })),
  };
}

export async function saveAnswer(userId: string, attemptId: string, questionId: number, selectedAnswer: string | null) {
  const attempt = await orm.QuizAttempt.where({ id: attemptId }).where({ userId }).first();
  if (!attempt || attempt.status !== "IN_PROGRESS" || parseDate(attempt.expiresAt) <= new Date())
    throw new Error("Quiz is no longer active");
  await orm.AttemptQuestion.where({ attemptId }).where({ questionId }).update({ selectedAnswer, updatedAt: now() });
}

export async function submitAttempt(userId: string, attemptId: string) {
  const attempt = await orm.QuizAttempt.where({ id: attemptId }).where({ userId }).first();
  if (!attempt) throw new Error("Quiz not found");
  if (attempt.status !== "IN_PROGRESS") return attemptResult(attempt);
  const answers = await orm.AttemptQuestion.where({ attemptId }).all();
  let score = 0;
  for (const answer of answers) {
    const question = await orm.Question.first({ id: answer.questionId });
    const correct = Boolean(answer.selectedAnswer && question && answer.selectedAnswer === question.rightAnswer);
    if (correct) score += 1;
    await orm.AttemptQuestion.where({ id: answer.id }).update({ isCorrect: correct, updatedAt: now() });
  }
  await orm.QuizAttempt.where({ id: attemptId }).update({
    status: parseDate(attempt.expiresAt) <= new Date() ? "EXPIRED" : "SUBMITTED",
    score,
    submittedAt: now(),
    updatedAt: now(),
  });
  return attemptResult({ ...attempt, score });
}

export async function getSubmittedAttemptResult(userId: string, attemptId: string) {
  const attempt = await orm.QuizAttempt.where({ id: attemptId }).where({ userId }).first();
  if (!attempt || attempt.status === "IN_PROGRESS") return null;
  return attemptResult(attempt);
}

async function attemptResult(attempt: any) {
  const answers = await orm.AttemptQuestion.where({ attemptId: attempt.id })
    .orderBy((answer: any) => answer.position.asc())
    .all();
  const review = await Promise.all(
    answers.map(async (answer: any) => {
      const question = await orm.Question.first({ id: answer.questionId });
      if (!question) throw new Error("Question not found");
      return {
        id: question.id,
        position: answer.position,
        content: question.content,
        selectedAnswer: answer.selectedAnswer,
        correctAnswer: question.rightAnswer,
        isCorrect: Boolean(answer.isCorrect),
        feedback: question.shortExplanation,
      };
    }),
  );
  return { score: attempt.score ?? 0, total: attempt.total, review };
}

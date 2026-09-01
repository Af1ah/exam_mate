/* eslint-disable @typescript-eslint/no-explicit-any */
import { db } from "@/prisma/db";
import { newId } from "@/lib/auth";

const orm = db.orm as any;
const now = () => new Date().toISOString();

export async function findOrCreateUser(phone: string) {
  const existing = await orm.User.where({ phone }).first();
  return existing ?? orm.User.create({ id: newId(), phone, createdAt: now(), updatedAt: now() });
}

export async function saveProfile(userId: string, profile: { name: string; dateOfBirth: string; examGoal: string }) {
  return orm.User.where({ id: userId }).update({ ...profile, onboardingStep: 2, updatedAt: now() });
}

export async function createMagicLink(userId: string, secretHash: string) {
  const id = newId();
  await orm.MagicLink.create({ id, userId, secretHash, expiresAt: new Date(Date.now() + 15 * 60_000).toISOString(), createdAt: now() });
  return id;
}

export async function redeemMagicLink(id: string) {
  return orm.MagicLink.first({ id });
}

export async function consumeMagicLink(id: string) {
  await orm.MagicLink.where({ id }).update({ usedAt: now() });
}

export async function getUser(userId: string) {
  return orm.User.first({ id: userId });
}

export async function startAttempt(userId: string) {
  const count = await orm.Question.count();
  if (count < 10) throw new Error("At least 10 questions are required");
  const offset = Math.floor(Math.random() * (count - 9));
  const questions = await orm.Question.orderBy((q: any) => q.id.asc()).offset(offset).limit(10).all();
  const id = newId();
  const startedAt = now();
  const expiresAt = new Date(Date.now() + 10 * 60_000).toISOString();
  await orm.QuizAttempt.create({ id, userId, status: "IN_PROGRESS", startedAt, expiresAt, total: 10, createdAt: startedAt, updatedAt: startedAt });
  await Promise.all(questions.map((question: any, index: number) => orm.AttemptQuestion.create({ id: newId(), attemptId: id, questionId: question.id, position: index + 1, createdAt: startedAt, updatedAt: startedAt })));
  return { id, expiresAt, questions: questions.map((q: any) => ({ id: q.id, content: q.content, options: [q.optionA, q.optionB, q.optionC] })) };
}

export async function saveAnswer(userId: string, attemptId: string, questionId: number, selectedAnswer: string | null) {
  const attempt = await orm.QuizAttempt.where({ id: attemptId }).where({ userId }).first();
  if (!attempt || attempt.status !== "IN_PROGRESS" || new Date(attempt.expiresAt) <= new Date()) throw new Error("Quiz is no longer active");
  await orm.AttemptQuestion.where({ attemptId }).where({ questionId }).update({ selectedAnswer, updatedAt: now() });
}

export async function submitAttempt(userId: string, attemptId: string) {
  const attempt = await orm.QuizAttempt.where({ id: attemptId }).where({ userId }).first();
  if (!attempt) throw new Error("Quiz not found");
  if (attempt.status !== "IN_PROGRESS") return { score: attempt.score ?? 0, total: attempt.total };
  const answers = await orm.AttemptQuestion.where({ attemptId }).all();
  let score = 0;
  for (const answer of answers) {
    const question = await orm.Question.first({ id: answer.questionId });
    const correct = Boolean(answer.selectedAnswer && question && answer.selectedAnswer === question.rightAnswer);
    if (correct) score += 1;
    await orm.AttemptQuestion.where({ id: answer.id }).update({ isCorrect: correct, updatedAt: now() });
  }
  await orm.QuizAttempt.where({ id: attemptId }).update({ status: new Date(attempt.expiresAt) <= new Date() ? "EXPIRED" : "SUBMITTED", score, submittedAt: now(), updatedAt: now() });
  return { score, total: attempt.total };
}

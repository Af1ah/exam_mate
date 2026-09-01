#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/f1ff1ce100abb6f8327184c6d596137388a31bc6eaf252779d47689fb2bb96f1/contract';
import endContract from '../../snapshots/f1ff1ce100abb6f8327184c6d596137388a31bc6eaf252779d47689fb2bb96f1/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'attemptQuestion',
        columns: [
          col('attemptId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('isCorrect', 'bool', { codecRef: { codecId: 'pg/bool@1' } }),
          col('position', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('questionId', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('selectedAnswer', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'magicLink',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('secretHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('usedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'question',
        columns: [
          col('content', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('exam', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('examDate', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('optionA', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('optionB', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('optionC', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('questionId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('questionNumber', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('rightAnswer', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('shift', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('shortExplanation', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sourcePaper', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('subject', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('topic', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'quizAttempt',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('expiresAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('score', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('startedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('submittedAt', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('total', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('userId', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'user',
        columns: [
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dateOfBirth', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('examGoal', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('name', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('onboardingStep', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('phone', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'attemptQuestion',
        constraint: 'attemptQuestion_attemptId_questionId_key',
        columns: ['attemptId', 'questionId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'attemptQuestion',
        constraint: 'attemptQuestion_attemptId_position_key',
        columns: ['attemptId', 'position'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'question',
        constraint: 'question_questionId_key',
        columns: ['questionId'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_phone_key',
        columns: ['phone'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'attemptQuestion',
        index: 'attemptQuestion_attemptId_idx_94f50eb9',
        columns: ['attemptId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'attemptQuestion',
        index: 'attemptQuestion_questionId_idx_fdb42076',
        columns: ['questionId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'magicLink',
        index: 'magicLink_userId_expiresAt_idx_9721b56d',
        columns: ['userId', 'expiresAt'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'magicLink',
        index: 'magicLink_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'question',
        index: 'question_exam_shift_questionNumber_idx_857324a4',
        columns: ['exam', 'shift', 'questionNumber'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'question',
        index: 'question_subject_topic_idx_83193dc9',
        columns: ['subject', 'topic'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quizAttempt',
        index: 'quizAttempt_expiresAt_status_idx_63867ed3',
        columns: ['expiresAt', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quizAttempt',
        index: 'quizAttempt_userId_idx_a489d58a',
        columns: ['userId'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quizAttempt',
        index: 'quizAttempt_userId_status_idx_e4a128ba',
        columns: ['userId', 'status'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'attemptQuestion',
        foreignKey: {
          name: 'attemptQuestion_attemptId_fkey',
          columns: ['attemptId'],
          references: { schema: 'public', table: 'quizAttempt', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'attemptQuestion',
        foreignKey: {
          name: 'attemptQuestion_questionId_fkey',
          columns: ['questionId'],
          references: { schema: 'public', table: 'question', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'magicLink',
        foreignKey: {
          name: 'magicLink_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'quizAttempt',
        foreignKey: {
          name: 'quizAttempt_userId_fkey',
          columns: ['userId'],
          references: { schema: 'public', table: 'user', columns: ['id'] },
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

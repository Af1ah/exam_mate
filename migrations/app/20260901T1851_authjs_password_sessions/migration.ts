#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/26a9ef1e951c2a7ac931c4f001eb1928d0b6fd1b4996825dc68e0a71af068795/contract';
import startContract from '../../snapshots/26a9ef1e951c2a7ac931c4f001eb1928d0b6fd1b4996825dc68e0a71af068795/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/90700e6ad43be14428dc85b6e4d97a045a59ebf2b75d1d80f4f9345548671704/contract';
import endContract from '../../snapshots/90700e6ad43be14428dc85b6e4d97a045a59ebf2b75d1d80f4f9345548671704/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'authRateLimit',
        columns: [
          col('action', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('attempts', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('blockedUntil', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('createdAt', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('keyHash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updatedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('windowStartedAt', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('email', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('passwordHash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'user',
        column: col('sessionVersion', 'int4', {
          notNull: true,
          default: lit(1),
          codecRef: { codecId: 'pg/int4@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'authRateLimit',
        constraint: 'authRateLimit_action_keyHash_key',
        columns: ['action', 'keyHash'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'user',
        constraint: 'user_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'authRateLimit',
        index: 'authRateLimit_blockedUntil_idx_9ec5475b',
        columns: ['blockedUntil'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

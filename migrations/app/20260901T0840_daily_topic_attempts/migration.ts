#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/26a9ef1e951c2a7ac931c4f001eb1928d0b6fd1b4996825dc68e0a71af068795/contract';
import endContract from '../../snapshots/26a9ef1e951c2a7ac931c4f001eb1928d0b6fd1b4996825dc68e0a71af068795/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/f1ff1ce100abb6f8327184c6d596137388a31bc6eaf252779d47689fb2bb96f1/contract';
import startContract from '../../snapshots/f1ff1ce100abb6f8327184c6d596137388a31bc6eaf252779d47689fb2bb96f1/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'quizAttempt',
        column: col('quizDay', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'quizAttempt',
        column: col('topic', 'text', {
          notNull: true,
          default: lit(''),
          codecRef: { codecId: 'pg/text@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'quizAttempt',
        constraint: 'quizAttempt_userId_quizDay_key',
        columns: ['userId', 'quizDay'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'quizAttempt',
        index: 'quizAttempt_quizDay_topic_idx_16b7bf05',
        columns: ['quizDay', 'topic'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);

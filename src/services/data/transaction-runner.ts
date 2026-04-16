import { db } from 'astro:db';

export interface DatabaseSession {
  run: typeof db.run;
  select: typeof db.select;
}

export interface TransactionRunner {
  run<T>(work: (session: DatabaseSession) => Promise<T>): Promise<T>;
}

function createDatabaseSession(): DatabaseSession {
  return {
    run: db.run.bind(db),
    select: db.select.bind(db),
  };
}

export const databaseSession = createDatabaseSession();

export async function runInTransaction<T>(work: (session: DatabaseSession) => Promise<T>): Promise<T> {
  return db.transaction((tx) => work(tx as unknown as DatabaseSession));
}

export const transactionRunner: TransactionRunner = {
  run: runInTransaction,
};

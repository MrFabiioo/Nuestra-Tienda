import { databaseSession, transactionRunner, type DatabaseSession, type TransactionRunner } from './transaction-runner';

export interface DatabaseAdapter extends DatabaseSession {
  transaction: TransactionRunner;
}

export const databaseAdapter: DatabaseAdapter = {
  ...databaseSession,
  transaction: transactionRunner,
};

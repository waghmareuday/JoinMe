#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb+srv://JoinMe:Uday2005*@cluster0.dfncc07.mongodb.net/?retryWrites=true&w=majority';
const dbName = process.env.DROP_DB || 'test';
const dropFlag = process.argv.includes('--drop');
const confirmDrop = process.env.CONFIRM_DROP === '1';

(async () => {
  const client = new MongoClient(uri);
  try {
    if (!dropFlag) {
      console.log('No --drop flag provided. To drop the DB run: node scripts/drop_test_db.js --drop (and set CONFIRM_DROP=1)');
      return;
    }

    if (!confirmDrop) {
      console.log('CONFIRM_DROP is not set to 1. Set CONFIRM_DROP=1 in your env to allow destructive operations. Aborting.');
      return;
    }

    await client.connect();
    const db = client.db(dbName);

    console.log(`Dropping database '${dbName}' ...`);
    await db.dropDatabase();
    console.log(`Database '${dbName}' dropped successfully.`);
  } catch (err) {
    console.error('Failed to drop DB:', err);
  } finally {
    await client.close();
  }
})();
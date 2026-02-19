#!/usr/bin/env node
import { MongoClient } from 'mongodb';
import dotenv from 'dotenv';

dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb+srv://JoinMe:Uday2005*@cluster0.dfncc07.mongodb.net/?retryWrites=true&w=majority';
const fromDbName = process.env.FROM_DB || 'test';
const toDbName = process.env.TO_DB || 'JoinMeDB';
const dropFlag = process.argv.includes('--drop');
const confirmDrop = process.env.CONFIRM_DROP === '1';

async function migrate() {
  const client = new MongoClient(uri);
  try {
    console.log(`Connecting to cluster...`);
    await client.connect();
    const fromDb = client.db(fromDbName);
    const toDb = client.db(toDbName);

    const collections = await fromDb.listCollections().toArray();
    if (collections.length === 0) {
      console.log(`No collections found in database '${fromDbName}'. Nothing to migrate.`);
      return;
    }

    for (const coll of collections) {
      const name = coll.name;
      console.log(`Migrating collection '${name}' ...`);
      const docs = await fromDb.collection(name).find({}).toArray();
      if (docs.length === 0) {
        console.log(`  - no documents in '${name}', skipping insert.`);
        continue;
      }

      // Insert into target DB, preserving documents
      const insertRes = await toDb.collection(name).insertMany(docs);
      console.log(`  - inserted ${insertRes.insertedCount} docs into '${toDbName}.${name}'`);
    }

    console.log('Migration completed.');

    if (dropFlag) {
      if (!confirmDrop) {
        console.warn('Drop requested (--drop) but CONFIRM_DROP is not set to 1. Skipping drop for safety.');
        console.warn('If you really want to drop the `test` DB after migrating, set CONFIRM_DROP=1 in your env and run with --drop again.');
      } else {
        await fromDb.dropDatabase();
        console.log(`Dropped database '${fromDbName}'.`);
      }
    } else {
      console.log("To drop the source database after migration, re-run with: node scripts/migrate_test_to_joinme.js --drop (and set CONFIRM_DROP=1)");
    }

  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    await client.close();
  }
}

migrate();

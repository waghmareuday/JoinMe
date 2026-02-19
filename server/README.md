# Server: MongoDB configuration & migration

This project uses MongoDB (Atlas by default). By default the connection uses `JoinMeDB` (see `server/config/mongodb.js`).

## Change DB
- Create a `.env` file in `server/` (copy `.env.example`).
- Set `MONGO_URI` to a MongoDB connection string that includes the database name you want. Example:

```
MONGO_URI="mongodb+srv://<username>:<password>@cluster0.dfncc07.mongodb.net/JoinMeDB?retryWrites=true&w=majority"
```

## Migrate data from `test` to `JoinMeDB`
A migration script is provided to copy all collections from the `test` DB into `JoinMeDB`.

Usage:
- Run without dropping `test`:

  ```bash
  cd server
  npm run migrate-test-to-joinme
  ```

- Run and drop `test` after migration (destructive):

  ```bash
  # set CONFIRM_DROP=1 in your environment, then run with --drop
  CONFIRM_DROP=1 npm run migrate-test-to-joinme -- --drop
  ```

Notes:
- The script will not drop `test` unless `--drop` is provided and `CONFIRM_DROP=1` is set.
- Review the data in `JoinMeDB` before dropping.

# EM Route Operations TRiM Dashboard - Vercel starter

This starter adds:
- login
- role-based access
- shared storage
- close / reopen instead of delete
- configurable scoring matrix
- simple overview-first homepage

## Roles

### read_only
View only.

### editor
Can:
- add personnel
- add incidents
- delete incidents
- close or reopen personnel
- apply individual risk override

### super_user
Everything above, plus:
- edit the full scoring matrix
- switch scoring factors on or off

## Vercel setup

1. Create a new GitHub repository and upload all files.
2. Import that repository into Vercel.
3. Add a Postgres database to the Vercel project using the Marketplace.
4. Add environment variables:
   - POSTGRES_URL
   - JWT_SECRET
5. Run the SQL in `sql/schema.sql` against the database.
6. Replace the placeholder password hashes in `app_users` with real bcrypt hashes.
7. Redeploy.

## Generate bcrypt hashes

Run:

```bash
npm install
node -e "console.log(require('bcryptjs').hashSync('YourPasswordHere', 10))"
```

Paste the output into the SQL.

## Important note

This requirement can no longer remain a single static HTML file only.
Because you now need:
- authentication
- permissions
- shared data
- audit-friendly retention

this is a small Vercel app with API routes and Postgres.

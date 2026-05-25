const databaseUrl = process.env.DATABASE_URL || '';

if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/.test(databaseUrl)) {
  console.error(
    [
      'Invalid production DATABASE_URL.',
      'Render cannot connect to localhost:5432 because localhost points to the Render container.',
      'Set DATABASE_URL in Render to your Render PostgreSQL Internal Database URL.',
    ].join('\n')
  );
  process.exit(1);
}

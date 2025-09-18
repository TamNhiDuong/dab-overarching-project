Run the client:

```sh
docker compose run client deno install && docker compose build --no-cache && docker compos e up --remove-orphans
```

Run the server:

```sh
docker compose build server
docker compose up -d --build server
docker compose restart server
```

Run the k6 performance testing:

```sh
docker compose up --build
docker compose run --rm --entrypoint=k6 k6-tests run /tests/hello-k6.js
```

Run all services:

```sh
docker compose up --build
```

Stop services:

```sh
docker compose down
```

Connect to the DB from terminal:

```sh
docker exec -it overarching_dab_postgresql_database psql -U username database
\dt #list tables
\d users_to_items #list a table
```

See the top ten average query execution times of queries that have been run more than 5 times:

```sh
SELECT query, mean_exec_time
  FROM pg_stat_statements
  WHERE calls > 5
  ORDER BY mean_exec_time DESC
  LIMIT 10;
```

Studying connection

```sh
SELECT pid, usename, backend_start, query_start, state, query
  FROM pg_stat_activity
  WHERE state IS NOT null;
```

Explain and analyse database query performance

````sh
EXPLAIN SELECT * FROM users WHERE id = 42;
EXPLAIN ANALYZE SELECT * FROM users WHERE id = 42;
EXPLAIN SELECT * FROM users WHERE name = 'User 42';
EXPLAIN ANALYZE SELECT * FROM users WHERE name = 'User 42';
                               ```
````

Caching data in the server, test the performance with

```sh
curl -w ' (%{time_total}s)' localhost:8000/hello/cache
```

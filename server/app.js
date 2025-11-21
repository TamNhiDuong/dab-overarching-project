import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import postgres from "postgres";
import { cache } from "@hono/hono/cache";
import { Redis } from "ioredis";

import { auth } from "./auth.js";

const app = new Hono();
const sql = postgres();

const QUEUE_NAME = "submissions";

app.use("/*", cors());
app.use("/*", logger());

// Auth: Retrieve user info from request headers
app.use("*", async (c, next) => {
    const session = await auth.api.getSession({ headers: c.req.raw.headers });
    console.log('session: ', session)
    if (!session) {
        return next();
    }

    c.set("user", session.user.name);
    c.set("userId", session.user.id); 
    return next();
});

// Auth
app.on(["POST", "GET"], "/api/auth/**", (c) => auth.handler(c.req.raw));

// Limiting access
app.use("/api/exercises/:id/submissions", async (c, next) => {
    const user = c.get("user");
    if (!user) {
        c.status(401);
        return c.json({ message: "Unauthorized" });
    }
    await next();
});

// Limiting access
app.use("/api/submissions/:id/status", async (c, next) => {
    const user = c.get("user");
    if (!user) {
        c.status(401);
        return c.json({ message: "Unauthorized" });
    }
    await next();
});

// ENDPOINTS
app.get("/", (c) => c.json({ message: "Hello world!" }));

// get & cache languages
app.get(
    "/api/languages",
    cache({
        cacheName: "languages-cache",
        wait: true,
    }),
    async (c) => {
        const languages = await sql`SELECT * FROM languages`;
        return c.json(languages);
    }
);

// get & cache exercises
app.get(
    "/api/languages/:id/exercises",
    cache({
        cacheName: "exercises-cache",
        wait: true,
    }),
    async (c) => {
        const langId = c.req.param("id");
        const exercises = await sql`SELECT id, title, description FROM exercises WHERE language_id = ${langId}`;
        return c.json(exercises);
    }
);

// Separate consumer service
let redis
if (Deno.env.get("REDIS_HOST")) {
    redis = new Redis(
        Number.parseInt(Deno.env.get("REDIS_PORT")),
        Deno.env.get("REDIS_HOST"),
    )
} else {
    redis = new Redis(6379, "redis")
}

app.post("/api/exercises/:id/submissions", async (c) => {
    const userId = c.get("userId"); // retrieved from auth middleware
    if (!userId) {
        return c.json({ error: "Unauthorized" }, 401);
    }

    const exerciseId = Number(c.req.param("id"));
    const body = await c.req.json();

    // Your frontend must send: { source_code: "...", language: "..." } 
    const { source_code } = body;

    if (!source_code) {
        return c.json({ error: "Missing source_code" }, 400);
    }

    const rows = await sql`
        INSERT INTO exercise_submissions (exercise_id, user_id, source_code)
        VALUES (${exerciseId}, ${userId}, ${source_code})
        RETURNING id;
    `;

    console.log('rows:::::: ', rows)

    return c.json({ id: rows[0].id }, 201);
});

// Content, state, communication
// GET a single exercise by ID
app.get("/api/exercises/:id", async (c) => {
    const id = Number(c.req.param("id"));

    const rows = await sql`SELECT id, title, description FROM exercises WHERE id = ${id}`;

    if (rows.length === 0) {
        // Proper 404 response
        return c.text("", 404);
    }

    const row = rows[0];
    return c.json({
        id: row.id,
        title: row.title,
        description: row.description,
    });
});

// Added apis
app.get("/api/submissions/:id/status", async (c) => {
  const userId = c.get("userId"); // authenticated user ID

  if (!userId) {
    return c.text("Unauthorized", 401);
  }

  const submissionId = Number(c.req.param("id"));

  // Only select submission if it belongs to the logged-in user
  const rows = await sql`
    SELECT grading_status, grade
    FROM exercise_submissions
    WHERE id = ${submissionId} AND user_id = ${userId}
  `;

  if (rows.length === 0) {
    // No submission found for this user + ID
    return c.text("", 404);
  }

  const row = rows[0];

  return c.json({
    grading_status: row.grading_status,
    grade: row.grade,
  });
});


app.get("/api/exercises/:id/submissions", async (c) => {
    const id = Number(c.req.param("id"));

    const rows = await sql`SELECT * FROM exercise_submissions WHERE exercise_id = ${id}`;

    if (rows.length === 0) {
        return c.text("", 404);
    }

    return c.json(rows);
});

// lgtm
app.get("/api/lgtm-test", (c) => {
  console.log("Hello log collection :)");
  return c.json({ message: "Hello, world!" });
});


export default app;
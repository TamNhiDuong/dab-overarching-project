import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import postgres from "postgres";
import { cache } from "@hono/hono/cache";
import { Redis } from "ioredis";

const app = new Hono();
const sql = postgres();

const QUEUE_NAME = "submissions";

app.use("/*", cors());
app.use("/*", logger());

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
    redis = new Redis(
        Number.parseInt(Deno.env.get("REDIS_PORT")),
        Deno.env.get("REDIS_HOST"),
    )
} else {
    redis = new Redis(6379, "redis")
    redis = new Redis(6379, "redis")
}

app.post("/api/exercises/:id/submissions", async (c) => {
    const exerciseId = Number(c.req.param("id"))
    const { source_code } = await c.req.json();

    const result = await sql`
    INSERT INTO exercise_submissions (exercise_id, source_code)
    VALUES (${exerciseId}, ${source_code})
    RETURNING id
  `
    const submissionId = result[0].id

    await redis.lpush(QUEUE_NAME, String(submissionId))

    return c.json({ id: submissionId }, 201)
});
export default app;
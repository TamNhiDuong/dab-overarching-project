import { Hono } from "@hono/hono";
import { cors } from "@hono/hono/cors";
import { logger } from "@hono/hono/logger";
import postgres from "postgres";
import { cache } from "@hono/hono/cache";

const app = new Hono();
const sql = postgres();

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

export default app;
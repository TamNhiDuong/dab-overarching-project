import { Hono } from "@hono/hono"
import { cors } from "@hono/hono/cors"
import { logger } from "@hono/hono/logger"
import postgres from "postgres"
import { Redis } from "ioredis"

const app = new Hono()
app.use("/*", cors())
app.use("/*", logger())

const sql = postgres()
const QUEUE_NAME = "submissions"

let redis
if (Deno.env.get("REDIS_HOST")) {
    redis = new Redis(
        Number.parseInt(Deno.env.get("REDIS_PORT")),
        Deno.env.get("REDIS_HOST"),
    )
} else {
    redis = new Redis(6379, "redis")
}

let consumeEnabled = false

// Helper sleep
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

// Grading loop
const consume = async () => {
    while (consumeEnabled) {
        const queueSize = await redis.llen(QUEUE_NAME)
        if (queueSize === 0) {
            await sleep(250)
            continue
        }

        const submissionId = await redis.rpop(QUEUE_NAME)
        if (!submissionId) {
            await sleep(250)
            continue
        }

        // Mark submission as processing
        await sql`
            UPDATE exercise_submissions
            SET grading_status = 'processing'
            WHERE id = ${submissionId}
        `

        // Fetch submission (code + exercise_id)
        const [submission] = await sql`
            SELECT id, exercise_id, source_code
            FROM exercise_submissions
            WHERE id = ${submissionId}
        `

        // Fetch solution code from exercises table
        const [exercise] = await sql`
            SELECT solution
            FROM exercises
            WHERE id = ${submission.exercise_id}
        `

        const submittedCode = submission.source_code ?? ""
        const solutionCode = exercise?.solution ?? ""

        // Compute Levenshtein distance
        const distance = levenshteinDistance(submittedCode, solutionCode)

        // Compute grade
        const maxLen = Math.max(submittedCode.length, solutionCode.length) || 1
        const rawScore = 1 - distance / maxLen
        const grade = Math.max(0, Math.ceil(100 * rawScore))

        // Simulate grading time: 1–3 seconds
        const wait = 1000 + Math.floor(Math.random() * 2000)
        await sleep(wait)

        // Update final grade
        await sql`
            UPDATE exercise_submissions
            SET grading_status = 'graded',
                grade = ${grade}
            WHERE id = ${submissionId}
        `
    }
}

// Routes
app.get("/api/status", async (c) => {
    const queueSize = await redis.llen(QUEUE_NAME)
    return c.json({
        queue_size: queueSize,
        consume_enabled: consumeEnabled,
    })
})

app.post("/api/consume/enable", async (c) => {
    if (!consumeEnabled) {
        consumeEnabled = true
        consume() // start consuming loop
    }
    return c.json({ consume_enabled: true })
})

app.post("/api/consume/disable", async (c) => {
    consumeEnabled = false
    return c.json({ consume_enabled: false })
})

export default app

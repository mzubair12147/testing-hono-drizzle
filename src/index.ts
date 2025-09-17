import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import { logger } from "hono/logger";
import { secureHeaders } from "hono/secure-headers";
import { db } from "./db/db";
import { authRouter } from "./routes/auth";
import { showRoutes } from "hono/dev";
import userRouter from "./routes/user";
import { filesRouter } from "./routes/files";
import { Bindings } from "hono/types";
import { cors } from "hono/cors";
import { serve } from "@hono/node-server"
import { prettyJSON } from "hono/pretty-json"

const app = new OpenAPIHono<{
    Bindings: Bindings;
    Variables: { userId: number; sessionId: string };
}>({
    defaultHook: (result, c) => {
        if (!result.success) {
            return c.json({ error: 'Validation failed', details: result.error }, 400);
        }
    }
}).basePath("/api");

app.get("/", (c) => c.text("🚀 Server is running"));

app.openAPIRegistry.registerComponent("securitySchemes", "Bearer", {
    type: "http",
    name: "Authorization",
    scheme: "bearer",
    in: "header",
    description: "Bearer token",
    bearerFormat: "JWT"
});

app.openAPIRegistry.registerComponent("securitySchemes", "cookieAuth", {
    type: "apiKey",
    in: "cookie",
    name: "refresh_token",
    description: "Authentication via refresh token stored in cookie",
});


app.use('/doc', prettyJSON())

app.doc("/docs", {
    openapi: "3.0.0",
    info: {
        version: "1.0.0",
        title: "Hono Test API",
    },
    // security: [{
    //     Bearer: [],
    // }]
});

app.get("/doc", swaggerUI({
    url: "/api/docs",
    deepLinking: true,
    displayRequestDuration: true,
    persistAuthorization: true,
}));

app.use("*", logger());
app.use(
    "*",
    secureHeaders({
        crossOriginEmbedderPolicy: false,
    })
);
// -- cors --
app.use(
    '*',
    cors({
        origin: "*",
        credentials: true,
        allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowHeaders: ['Content-Type', 'Authorization'],
        exposeHeaders: ['Content-Length'],
        maxAge: 600,
    })
)

// -- route groups --
app.route("/auth", authRouter);
app.route("/users", userRouter);
app.route("/files", filesRouter);

app.get("/health", async (c) => {
    try {
        const result = await db.execute("SELECT NOW()");
        return c.json({ status: "ok", time: result.rows?.[0] ?? null }, 200);
    } catch (err) {
        console.error("Health check failed:", err);
        return c.json({ status: "error", error: "DB not reachable" }, 503);
    }
});

app.notFound((c) => c.json({ error: "Route not found" }, 404));
app.onError((err, c) => {
    console.error("Unhandled error:", err);
    return c.json({ error: "Internal Server Error" }, 500);
});

showRoutes(app);

const port = Number(process.env.PORT) || 3000;
console.log(`✅ Server is running at http://localhost:${port}`);

// serve({
//     fetch: app.fetch,
//     port,
// });

// export default app;


// cloudflare worker version
export default {
    fetch: app.fetch,
}

// src/middleware/auth.ts
import type { Context, Next } from "hono";
import { verifyJwt } from "../auth/jwt";
import { ENV } from "../config/env";

export const authMiddleware = async (c: Context, next: Next) => {
    const header = c.req.header("Authorization") || "";

    const m = header.match(/^Bearer (.+)$/i);
    if (!m) return c.json({ error: "Missing bearer token" }, 401);

    try {
        const payload = await verifyJwt("access", m[1], ENV);

        c.set("userId", payload.sub as string);
        c.set("sessionId", payload.jti as string);

        await next();
    } catch {
        return c.json({ error: "Invalid or expired token" }, 401);
    }
};

// src/routes/authRouter.ts
import { Context } from "hono";
import { OpenAPIHono } from "@hono/zod-openapi";
import { hashPassword, verifyPassword } from "../../auth/password";
import { signJwt, verifyJwt } from "../../auth/jwt";
import {
    setRefreshCookie,
    clearRefreshCookie,
    readRefreshCookie,
} from "../../auth/cookies";
import { users } from "../../db/schema";
import { eq } from "drizzle-orm";
import { db } from "../../db/db";
import {
    isRefreshValid,
    rotateSession,
    storeNewSession,
    revokeSession,
} from "../../auth/session";
import { uuid } from "../../utils/ids";
import { parseTtl } from "../../utils/ids";
import { ENV } from "../../config/env";
import { authMiddleware } from "../../middlewares/authMiddleware";
import {
    loginRoute,
    logoutRoute,
    meRoute,
    refreshRoute,
    registerRoute,
} from "./routes";

export const authRouter = new OpenAPIHono();

authRouter.use("/me", authMiddleware);

authRouter.openapi(registerRoute, async (c) => {
    const { email, password } = c.req.valid("json");

    const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
    });
    if (existing) return c.json({ error: "Email already registered" }, 409);

    const user = {
        email,
        passwordHash: await hashPassword(password),
    };
    await db.insert(users).values(user);
    return c.json({ email: user.email }, 201);
});

authRouter.openapi(loginRoute, async (c) => {
    const { email, password } = c.req.valid("json");

    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) return c.json({ error: "Invalid credentials" }, 401);
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) return c.json({ error: "Invalid credentials" }, 401);

    const rtJti = uuid();
    const access = await signJwt(
        "access",
        { sub: String(user.id), jti: uuid() },
        ENV
    );
    const refresh = await signJwt(
        "refresh",
        { sub: String(user.id), jti: rtJti },
        ENV
    );

    await storeNewSession(db, user.id, refresh, rtJti, ENV.REFRESH_TOKEN_TTL, {
        ip: c.req.header("x-forwarded-for") || undefined,
        ua: c.req.header("user-agent") || undefined,
    });

    setRefreshCookie(c, refresh, ENV, parseTtl(ENV.REFRESH_TOKEN_TTL));
    return c.json({ accessToken: access, refreshToken: refresh }, 200);
});

authRouter.openapi(refreshRoute, async (c) => {
    const token = readRefreshCookie(c);
    if (!token) return c.json({ error: "No refresh cookie" }, 401);

    let payload;
    try {
        payload = await verifyJwt("refresh", token, ENV);
    } catch {
        return c.json({ error: "Invalid refresh token" }, 401);
    }

    const userId = payload.sub as string;
    const oldJti = payload.jti as string;

    const valid = await isRefreshValid(db, oldJti, token);

    if (!valid) {
        await revokeSession(db, oldJti);
        clearRefreshCookie(c, ENV);
        return c.json({ error: "Refresh token invalid/revoked" }, 401);
    }

    const newSessionId = uuid();

    const newRefresh = await signJwt(
        "refresh",
        { sub: userId, jti: newSessionId },
        ENV
    );
    await rotateSession(
        db,
        oldJti,
        newRefresh,
        newSessionId,
        ENV.REFRESH_TOKEN_TTL
    );

    const access = await signJwt("access", { sub: userId, jti: uuid() }, ENV);
    setRefreshCookie(c, newRefresh, ENV, parseTtl(ENV.REFRESH_TOKEN_TTL));
    return c.json({ accessToken: access, newRefreshToken: newRefresh }, 200);
});

authRouter.openapi(logoutRoute, async (c) => {
    const token = readRefreshCookie(c);
    clearRefreshCookie(c, ENV);
    if (!token) return c.json({ ok: true });

    try {
        const p = await verifyJwt("refresh", token, ENV);
        await revokeSession(db, p.jti as string);
    } catch {
        /* ignore */
    }
    return c.json({ ok: true });
});

authRouter.openapi(meRoute, async (c: Context) => {
    const userId = c.get("userId");
    const data = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
            passwordHash: false,
            createdAt: false,
            updatedAt: false,
        },
    });

    return c.json({ data });
});

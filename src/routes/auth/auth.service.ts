import { db } from "../../db/db";
import { eq } from "drizzle-orm";
import { users } from "../../db/schema";
import { hashPassword, verifyPassword } from "../../auth/password";
import { uuid } from "../../utils/ids"
import { signJwt, verifyJwt } from "../../auth/jwt";
import { ENV } from "../../config/env";
import { isRefreshValid, revokeSession, rotateSession, storeNewSession } from "../../auth/session";
import { parseTtl } from "../../utils/ids";
import { setRefreshCookie } from "../../auth/cookies";
import { Context } from "hono";

export const registerUser = async (email: string, password: string) => {
    const existing = await db.query.users.findFirst({
        where: eq(users.email, email),
    });
    if (existing) throw new Error("Email already registered");

    const user = {
        email,
        passwordHash: await hashPassword(password),
    };
    await db.insert(users).values(user);

    return { email: user.email };
}

export const loginUser = async (email: string, password: string, c: Context) => {

    const user = await db.query.users.findFirst({
        where: eq(users.email, email),
    });

    if (!user) throw new Error("Invalid credentials");
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok) throw new Error("Invalid credentials");

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
    return { accessToken: access, refreshToken: refresh }
}

export const refreshToken = async (token: string) => {
    let payload;
    try {
        payload = await verifyJwt("refresh", token, ENV);
    } catch {
        throw new Error("Invalid refresh token");
    }

    const userId = payload.sub as string;
    const oldJti = payload.jti as string;

    const valid = await isRefreshValid(db, oldJti, token);

    if (!valid) {
        await revokeSession(db, oldJti);
        throw new Error("Refresh token invalid/revoked");
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

    const newAccess = await signJwt("access", { sub: userId, jti: uuid() }, ENV);
    return { userId, oldJti, newRefresh, newAccessToken: newAccess };
}

export const logoutUser = async (token: string) => {
    const p = await verifyJwt("refresh", token, ENV);
    await revokeSession(db, p.jti as string);
    return;
}

export const getMe = async (userId: number) => {
    const data = await db.query.users.findFirst({
        where: eq(users.id, userId),
        columns: {
            passwordHash: false,
            createdAt: false,
            updatedAt: false,
        },
    });
    return data;
}

export const checkAdmin = async (userId: number) => {
    return await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId));
}
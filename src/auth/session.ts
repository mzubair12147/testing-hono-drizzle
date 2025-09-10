// src/auth/sessions.ts
import { eq } from "drizzle-orm";
import { sessions } from "../db/schema";
import type { Db } from "../db/db";
import { parseTtl } from "../utils/ids";
import { createHash } from "crypto";

function sha256(input: string) {
    return createHash("sha256").update(input).digest("hex");
}

export async function storeNewSession(
    db: Db,
    userId: number,
    refreshToken: string,
    jti: string,
    expiresIn: string,
    meta: { ip?: string; ua?: string }
) {
    const refreshTokenHash = sha256(refreshToken);
    const expiresAt = new Date(Date.now() + parseTtl(expiresIn) * 1000);

    await db.insert(sessions).values({
        id: jti,
        userId: userId,
        refreshTokenHash,
        ip: meta.ip,
        userAgent: meta.ua,
        expiresAt,
    });

    return jti;
}

export async function rotateSession(
    db: Db,
    oldJti: string,
    newRefreshToken: string,
    newJti: string,
    newExpiresIn: string
) {
    const newHash = sha256(newRefreshToken);
    const expiresAt = new Date(Date.now() + parseTtl(newExpiresIn) * 1000);

    await db.transaction(async (tx) => {
        const old = (
            await tx.select().from(sessions).where(eq(sessions.id, oldJti))
        ).at(0);
        if (!old) throw new Error("Old session not found");

        console.log(oldJti);
        await tx
            .update(sessions)
            .set({ isRevoked: true, replacedBy: newJti })
            .where(eq(sessions.id, oldJti));
        console.log(newJti);

        await tx.insert(sessions).values({
            id: newJti,
            userId: old.userId,
            refreshTokenHash: newHash,
            expiresAt,
        });
    });

    return newJti;
}

export async function revokeSession(db: Db, jti: string) {
    await db
        .update(sessions)
        .set({ isRevoked: true })
        .where(eq(sessions.id, jti));
}

export async function isRefreshValid(db: Db, jti: string, token: string) {
    console.log("checking token");
    const row = (
        await db.select().from(sessions).where(eq(sessions.id, jti))
    ).at(0);
    if (!row) return false;
    console.log("token present");
    if (row.isRevoked) return false;
    console.log("token revoked");
    if (row.expiresAt < new Date()) return false;
    console.log("not expired");

    const tokenHash = sha256(token);
    return tokenHash === row.refreshTokenHash;
}

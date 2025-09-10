// src/auth/jwt.ts
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import type { Bindings } from "../config/env";

export type TokenKind = "access" | "refresh";

function secretFor(kind: TokenKind, env: Bindings) {
    const secret =
        kind === "access" ? env.JWT_ACCESS_SECRET : env.JWT_REFRESH_SECRET;
    return new TextEncoder().encode(secret);
}

export async function signJwt(
    kind: TokenKind,
    payload: JWTPayload & { sub: string; jti: string },
    env: Bindings
) {
    const ttl =
        kind === "access" ? env.ACCESS_TOKEN_TTL : env.REFRESH_TOKEN_TTL;
    const sec = secretFor(kind, env);

    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256", typ: "JWT" })
        .setIssuedAt()
        .setIssuer(env.JWT_ISSUER)
        .setAudience(env.JWT_AUDIENCE)
        .setSubject(payload.sub)
        .setJti(payload.jti)
        .setExpirationTime(ttl)
        .sign(sec);
}

export async function verifyJwt(kind: TokenKind, token: string, env: Bindings) {
    const sec = secretFor(kind, env);

    try {
        const { payload } = await jwtVerify(token, sec, {
            issuer: env.JWT_ISSUER,
            audience: env.JWT_AUDIENCE,
            clockTolerance: 10,
        });
        return payload;
    } catch (err: any) {
        console.error("JWT verification failed:", err.message);
        throw new Error("Invalid or expired token");
    }
}

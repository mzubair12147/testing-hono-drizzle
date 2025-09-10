import type { Context } from "hono";
import { ENV, type Bindings } from "../config/env";
import { setCookie } from "hono/cookie";

export function setRefreshCookie(
    c: Context,
    token: string,
    env: Bindings,
    maxAgeSec: number
) {
    const isProd = env.NODE_ENV === "production";

    setCookie(c, "refresh_token", token, {
        path: "/",
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: maxAgeSec,
        domain: isProd ? ENV.COOKIE_DOMAIN : undefined,
    });
}

export function clearRefreshCookie(c: Context, env: Bindings) {
    const isProd = env.NODE_ENV === "production";

    setCookie(c, "refresh_token", "", {
        path: "/",
        httpOnly: true,
        secure: isProd,
        sameSite: "lax",
        maxAge: 0,
        domain: isProd ? env.COOKIE_DOMAIN : undefined,
    });
}

export function readRefreshCookie(c: Context) {
    const cookie = c.req.header("Cookie") || "";
    const m = cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/);
    return m ? decodeURIComponent(m[1]) : null;
}

// src/auth/cookies.ts
// import type { Context } from "hono";
// import { setCookie } from "hono/cookie";
// import type { Bindings } from "../config/env";

// export function setRefreshCookie(
//   c: Context,
//   token: string,
//   env: Bindings,
//   maxAgeSec: number
// ) {
//   const isProd = env.NODE_ENV === "production";

//   setCookie(c, "refresh_token", token, {
//     path: "/auth",
//     httpOnly: true,
//     secure: isProd,
//     sameSite: "Strict",
//     maxAge: maxAgeSec,
//     domain: isProd ? env.COOKIE_DOMAIN : undefined, // ⛔ no Domain=localhost in dev
//   });
// }

// export function clearRefreshCookie(c: Context, env: Bindings) {
//   const isProd = env.NODE_ENV === "production";

//   setCookie(c, "refresh_token", "", {
//     path: "/auth",
//     httpOnly: true,
//     secure: isProd,
//     sameSite: "Strict",
//     maxAge: 0,
//     domain: isProd ? env.COOKIE_DOMAIN : undefined,
//   });
// }

// export function readRefreshCookie(c: Context): string | null {
//   const cookie = c.req.header("Cookie") || "";
//   const match = cookie.match(/(?:^|;\s*)refresh_token=([^;]+)/);
//   return match ? decodeURIComponent(match[1]) : null;
// }

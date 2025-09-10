
import { config } from "dotenv";
import { resolve } from "path";

if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
    config({ path: resolve(process.cwd(), ".env") });
}

const getEnv = (key: string, fallback?: string): string => {
    const value = process.env[key] ?? fallback;
    if (value === undefined) {
        throw new Error(`${key} is missing from environment variables`);
    }
    return value;
};

export const ENV = {
    DATABASE_URL: getEnv("DATABASE_URL"),
    JWT_ISSUER: getEnv("JWT_ISSUER", "com.acme.api"),
    JWT_AUDIENCE: getEnv("JWT_AUDIENCE", "com.acme.web"),
    JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET"),
    JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
    ACCESS_TOKEN_TTL: getEnv("ACCESS_TOKEN_TTL", "15m"),
    REFRESH_TOKEN_TTL: getEnv("REFRESH_TOKEN_TTL", "30d"),
    COOKIE_DOMAIN: getEnv("COOKIE_DOMAIN", "localhost"),
    NODE_ENV: getEnv("NODE_ENV", "development"),
    SUPABASE_URL: getEnv("SUPABASE_URL"),
    SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
    SUPABASE_STORAGE_BUCKET_NAME: getEnv("SUPABASE_STORAGE_BUCKET_NAME"),
};

export type Bindings = {
    DATABASE_URL: string;
    JWT_ISSUER: string;
    JWT_AUDIENCE: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ACCESS_TOKEN_TTL: string;
    REFRESH_TOKEN_TTL: string;
    COOKIE_DOMAIN: string;
    NODE_ENV: string;
    SUPABASE_URL: string;
    SUPABASE_SERVICE_ROLE_KEY: string;
    SUPABASE_STORAGE_BUCKET_NAME: string;
};

// Helper to read env from Cloudflare Workers bindings
export function getEnvFromBindings(env: Partial<Bindings>): Bindings {
    const keys = [
        "DATABASE_URL",
        "JWT_ISSUER",
        "JWT_AUDIENCE",
        "JWT_ACCESS_SECRET",
        "JWT_REFRESH_SECRET",
        "ACCESS_TOKEN_TTL",
        "REFRESH_TOKEN_TTL",
        "COOKIE_DOMAIN",
        "NODE_ENV",
        "SUPABASE_URL",
        "SUPABASE_SERVICE_ROLE_KEY",
        "SUPABASE_STORAGE_BUCKET_NAME",
    ] as const;

    const result = {} as Bindings;

    for (const key of keys) {
        const value = env[key] ?? undefined;
        if (!value) {
            throw new Error(`Missing environment variable in bindings: ${key}`);
        }
        result[key] = value;
    }

    return result;
}

































// // src/config/env.ts
// import { config } from "dotenv";
// import { resolve } from "path";

// const isNode = typeof process !== 'undefined' && typeof process.env !== 'undefined';
// const isDev = isNode && process.env.NODE_ENV !== "production";

// if (isDev) {
//     config({ path: resolve(process.cwd(), ".env") });
// }

// const getEnv = (key: string, fallback?: string): string => {
//     if (isNode) {
//         const value = process.env[key] ?? fallback;
//         if (value === undefined) {
//             throw new Error(`${key} is missing from environment variables`);
//         }
//         return value;
//     }

//     // Cloudflare runtime (bindings)
//     const value = (import.meta.env?.[key] ?? fallback) as string | undefined;
//     if (value === undefined) {
//         throw new Error(`${key} is missing from Cloudflare environment variables`);
//     }
//     return value;
// };

// export const ENV = {
//     DATABASE_URL: getEnv("DATABASE_URL"),
//     JWT_ISSUER: getEnv("JWT_ISSUER", "com.acme.api"),
//     JWT_AUDIENCE: getEnv("JWT_AUDIENCE", "com.acme.web"),
//     JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET"),
//     JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
//     ACCESS_TOKEN_TTL: getEnv("ACCESS_TOKEN_TTL", "15m"),
//     REFRESH_TOKEN_TTL: getEnv("REFRESH_TOKEN_TTL", "30d"),
//     COOKIE_DOMAIN: getEnv("COOKIE_DOMAIN", "localhost"),
//     NODE_ENV: isNode ? process.env.NODE_ENV || "development" : "production",
//     SUPABASE_URL: getEnv("SUPABASE_URL"),
//     SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
//     SUPABASE_STORAGE_BUCKET_NAME: getEnv("SUPABASE_STORAGE_BUCKET_NAME"),
// };

// export type Bindings = typeof ENV;



































// import { config } from "dotenv";
// import { resolve } from "path";

// if (typeof process !== "undefined" && process.env.NODE_ENV !== "production") {
//     config({ path: resolve(process.cwd(), ".env") });
// }

// const getEnv = (key: string, fallback?: string): string => {
//     const value = process.env[key] ?? fallback;
//     if (value === undefined) {
//         throw new Error(`${key} is missing from environment variables`);
//     }
//     return value;
// };

// export const ENV = {
//     DATABASE_URL: getEnv("DATABASE_URL"),
//     JWT_ISSUER: getEnv("JWT_ISSUER", "com.acme.api"),
//     JWT_AUDIENCE: getEnv("JWT_AUDIENCE", "com.acme.web"),
//     JWT_ACCESS_SECRET: getEnv("JWT_ACCESS_SECRET"),
//     JWT_REFRESH_SECRET: getEnv("JWT_REFRESH_SECRET"),
//     ACCESS_TOKEN_TTL: getEnv("ACCESS_TOKEN_TTL", "15m"),
//     REFRESH_TOKEN_TTL: getEnv("REFRESH_TOKEN_TTL", "30d"),
//     COOKIE_DOMAIN: process.env.COOKIE_DOMAIN,
//     NODE_ENV: process.env.NODE_ENV || "development",
//     // AWS_REGION: process.env.AWS_REGION,
//     // AWS_ACCESS_KEY_ID: getEnv("AWS_ACCESS_KEY_ID"),
//     // AWS_SECRET_ACCESS_KEY: getEnv("AWS_SECRET_ACCESS_KEY"),
//     // S3_BUCKET: getEnv("S3_BUCKET"),
//     SUPABASE_URL: getEnv("SUPABASE_URL"),
//     SUPABASE_SERVICE_ROLE_KEY: getEnv("SUPABASE_SERVICE_ROLE_KEY"),
//     SUPABASE_STORAGE_BUCKET_NAME: getEnv("SUPABASE_STORAGE_BUCKET_NAME"),
// };

// export type Bindings = typeof ENV;

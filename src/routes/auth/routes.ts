import { createRoute, z } from "@hono/zod-openapi";
import { loginDto, registerDto } from "./dto";
import { userRoles } from "../../types/userRole";

/**
 * Shared error response schema
 */
const errorResponse = z.object({
    error: z.string().openapi({ example: "Invalid credentials" }),
});

/**
 * Register Route
 */
const registerRoute = createRoute({
    method: "post",
    path: "/register",
    summary: "Register a new user",
    description: "Creates a new account with email and password.",
    tags: ["Auth"],
    request: {
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: registerDto.openapi("RegisterDto"),
                    example: {
                        email: "newuser@example.com",
                        password: "StrongPass123!",
                    },
                },
            },
        },
    },
    responses: {
        201: {
            description: "User successfully registered",
            content: {
                "application/json": {
                    schema: z.object({
                        email: z.string().email(),
                    }),
                    example: { email: "newuser@example.com" },
                },
            },
        },
        409: {
            description: "Email already registered",
            content: {
                "application/json": { schema: errorResponse },
            },
        },
    },
});

/**
 * Login Route
 */
const loginRoute = createRoute({
    method: "post",
    path: "/login",
    summary: "Login user",
    description:
        "Authenticates a user with email and password. Returns access and refresh tokens.",
    tags: ["Auth"],
    request: {
        body: {
            required: true,
            content: {
                "application/json": {
                    schema: loginDto.openapi("LoginDto"),
                    example: {
                        email: "test@gmail.com",
                        password: "password",
                    },
                },
            },
        },
    },
    responses: {
        200: {
            description: "Login successful",
            content: {
                "application/json": {
                    schema: z.object({
                        accessToken: z.string().openapi({ example: "eyJhbGciOi..." }),
                        refreshToken: z.string().openapi({ example: "eyJhbGciOi..." }),
                    }),
                },
            },
        },
        401: {
            description: "Invalid credentials",
            content: {
                "application/json": { schema: errorResponse },
            },
        },
    },
});

/**
 * Refresh Route
 */
const refreshRoute = createRoute({
    method: "post",
    path: "/refresh",
    summary: "Refresh tokens",
    description:
        "Exchanges a valid refresh token for a new access token and rotated refresh token.",
    tags: ["Auth"],
    security: [{ Bearer: [], cookieAuth: [] }],
    responses: {
        200: {
            description: "Tokens refreshed successfully",
            content: {
                "application/json": {
                    schema: z.object({
                        accessToken: z.string().openapi({ example: "eyJhbGciOi..." }),
                        newRefreshToken: z.string().openapi({ example: "eyJhbGciOi..." }),
                    }),
                },
            },
        },
        401: {
            description: "Invalid or expired refresh token",
            content: {
                "application/json": { schema: errorResponse },
            },
        },
    },
});

/**
 * Logout Route
 */
const logoutRoute = createRoute({
    method: "post",
    path: "/logout",
    summary: "Logout user",
    description: "Revokes the current refresh token and clears authentication cookies.",
    tags: ["Auth"],
    security: [{ Bearer: [] }],
    responses: {
        200: {
            description: "User successfully logged out",
            content: {
                "application/json": {
                    schema: z.object({
                        ok: z.boolean().openapi({ example: true }),
                    }),
                },
            },
        },
    },
});

const meRoute = createRoute({
    method: "get",
    path: "/me",
    summary: "Get current user",
    tags: ["Auth"],
    security: [{ Bearer: [] }],
    responses: {
        200: {
            description: "Authenticated user",
            content: {
                "application/json": {
                    schema: z.object({
                        data: z.object({
                            id: z.number(),
                            email: z.string().email(),
                            role: z.enum(userRoles).default("user"),
                        }),
                    }),
                },
            },
        },
        401: {
            description: "Unauthorized",
        },
    },
});


export { meRoute, loginRoute, registerRoute, refreshRoute, logoutRoute };

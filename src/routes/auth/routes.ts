import { createRoute, z } from "@hono/zod-openapi";
import { loginDto, registerDto } from "./dto";
import { userRoles } from "../../types/userRole";

const registerRoute = createRoute({
    method: "post",
    path: "/register",
    summary: "Register a new user",
    tags: ["Auth"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: registerDto,
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
                },
            },
        },
        409: {
            description: "Email already registered",
            content: {
                "application/json": {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
        },
    },
});

const loginRoute = createRoute({
    method: "post",
    path: "/login",
    summary: "Login user",
    tags: ["Auth"],
    request: {
        body: {
            content: {
                "application/json": {
                    schema: loginDto,
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
                        accessToken: z.string(),
                        refreshToken: z.string(),
                    }),
                },
            },
        },
        401: {
            description: "Invalid credentials",
            content: {
                "application/json": {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
        },
    },
});

const refreshRoute = createRoute({
    method: "post",
    path: "/refresh",
    summary: "Refresh access token",
    tags: ["Auth"],
    responses: {
        200: {
            description: "Token refreshed",
            content: {
                "application/json": {
                    schema: z.object({
                        accessToken: z.string(),
                        newRefreshToken: z.string(),
                    }),
                },
            },
        },
        401: {
            description: "Invalid or missing refresh token",
            content: {
                "application/json": {
                    schema: z.object({
                        error: z.string(),
                    }),
                },
            },
        },
    },
});

const logoutRoute = createRoute({
    method: "post",
    path: "/logout",
    summary: "Logout user",
    tags: ["Auth"],
    responses: {
        200: {
            description: "User logged out",
            content: {
                "application/json": {
                    schema: z.object({
                        ok: z.boolean(),
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
    security: [{ bearerAuth: [] }],
    responses: {
        200: {
            description: "Authenticated user",
            content: {
                "application/json": {
                    schema: z.object({
                        data: z.object({
                            id: z.number(),
                            email: z.email(),
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

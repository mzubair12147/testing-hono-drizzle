import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { loginController, logoutController, meController, refreshController, registerController } from "./auth.controller";
import { authTokenResponse, emailResponse, errorResponse, loginUserOpenApi, meOpenApi, okResponseSchema, registerUserOpenApi } from "../../db/validators";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { responseExamples, withCustomReponse } from "../../utils/openapi";


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
                    schema: registerUserOpenApi.openapi("RegisterSchema"), //registerDto.openapi("RegisterDto"),
                    example: {
                        email: "newuser@example.com",
                        passwordHash: "StrongPass123!",
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
                    schema: emailResponse.openapi("EmailResponse"),
                    // example: { email: "newuser@example.com" },
                },
            },
        },
        409: {
            description: "Email already registered",
            content: {
                "application/json": { schema: errorResponse, example: withCustomReponse(responseExamples["409"], { message: "The email already exist" }) },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] },
            },
        },
    },
});

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
                    schema: loginUserOpenApi.openapi("LoginSchema"), // loginDto.openapi("LoginDto"),
                    example: {
                        email: "test@gmail.com",
                        passwordHash: "password",
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
                    schema: authTokenResponse.openapi("AuthTokenResponse"),
                },
            },
        },
        401: {
            description: "Invalid credentials",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["401"] },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] },
            },
        },
    },
});

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
                    schema: authTokenResponse.openapi("AuthTokenResponse"),
                },
            },
        },
        401: {
            description: "Invalid or expired refresh token",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["401"] },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] },
            },
        },
    },
});

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
                    schema: okResponseSchema.openapi("OkResponse"),
                },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] },
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
                    schema: meOpenApi.openapi("MeResponse"),
                },
            },
        },
        401: {
            description: "Unauthorized",
            content: {
                "application/json": {
                    schema: errorResponse, example: responseExamples["401"]
                }
            }
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] },
            },
        },
    },
});

export const authRouter = new OpenAPIHono();

authRouter.use("/me", authMiddleware);
authRouter.use("/refresh", authMiddleware);
authRouter.use("/logout", authMiddleware);

authRouter.openapi(registerRoute, registerController);
authRouter.openapi(loginRoute, loginController);
authRouter.openapi(refreshRoute, refreshController);
authRouter.openapi(meRoute, meController);
authRouter.openapi(logoutRoute, logoutController);
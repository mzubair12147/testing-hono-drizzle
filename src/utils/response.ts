// src/utils/response.ts
import { Context, TypedResponse } from "hono";
import { ContentfulStatusCode } from "hono/utils/http-status";

// Generic API response shape
export type ApiResponse<T = unknown> = {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
};

// Core sender that ensures we always return a TypedResponse
export function sendResponse<T, Status extends ContentfulStatusCode>(
    c: Context,
    status: Status,
    payload: ApiResponse<T>
): TypedResponse<ApiResponse<T>, Status, "json"> {
    return c.json(payload, status) as TypedResponse<
        ApiResponse<T>,
        Status,
        "json"
    >;
}

// --- Typed helpers ---

export function okReponse<T>(
    c: Context,
    data: T,
    message = "OK"
): TypedResponse<ApiResponse<T>, 200, "json"> {
    return sendResponse(c, 200, { success: true, data, message });
}

export function createdReponse<T>(
    c: Context,
    data: T,
    message = "Created"
): TypedResponse<ApiResponse<T>, 201, "json"> {
    return sendResponse(c, 201, { success: true, data, message });
}

export function badRequestReponse(
    c: Context,
    error = "Bad Request"
): TypedResponse<ApiResponse<null>, 400, "json"> {
    return sendResponse(c, 400, { success: false, error });
}

export function unauthorizedResponse(
    c: Context,
    error = "Unauthorized"
): TypedResponse<ApiResponse<null>, 401, "json"> {
    return sendResponse(c, 401, { success: false, error });
}

export function conflictReponse(
    c: Context,
    error = "Conflict"
): TypedResponse<ApiResponse<null>, 409, "json"> {
    return sendResponse(c, 409, { success: false, error });
}

export function serverErrorReponse(
    c: Context,
    error = "Internal Server Error"
): TypedResponse<ApiResponse<null>, 500, "json"> {
    return sendResponse(c, 500, { success: false, error });
}

export function notFoundReponse(
    c: Context,
    error = "Resource Not Found"
): TypedResponse<ApiResponse<null>, 404, "json"> {
    return sendResponse(c, 404, { success: false, error });
}

export function accessDeniedReponse(
    c: Context,
    error = "Access Denied"
): TypedResponse<ApiResponse<null>, 403, "json"> {
    return sendResponse(c, 403, { success: false, error });
}




// usage examples
// import { created, conflict, ok, unauthorized } from "@/utils/response";

// authRouter.openapi(registerRoute, async (c) => {
//     const { email, password } = c.req.valid("json");

//     const existing = await db.query.users.findFirst({
//         where: eq(users.email, email),
//     });
//     if (existing) return conflict(c, "Email already registered");

//     const user = {
//         email,
//         passwordHash: await hashPassword(password),
//     };
//     await db.insert(users).values(user);

//     return created(c, { email: user.email }, "User registered successfully");
// });

// authRouter.openapi(loginRoute, async (c) => {
//   const { email, password } = c.req.valid("json");

//   const user = await db.query.users.findFirst({
//     where: eq(users.email, email),
//   });
//   if (!user) return unauthorized(c, "Invalid credentials");

//   const okPassword = await verifyPassword(user.passwordHash, password);
//   if (!okPassword) return unauthorized(c, "Invalid credentials");

//   return ok(c, { id: user.id, email: user.email }, "Login successful");
// });







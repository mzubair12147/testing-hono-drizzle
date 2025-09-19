import { z } from "zod";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { ApiResponse } from "./response";

export function toZodObject(schema: any) {
    return z.object(schema.shape);
}

export const baseResponse = <T extends z.ZodTypeAny>(schema: T) =>
    z.object({
        success: z.boolean(),
        message: z.string().optional(),
        error: z.string().optional(),
        data: schema.optional(),
    })

export function zodToOpenApi<T extends z.ZodType>(schema: T) {
    return schema.openapi({});
}

// Convert Drizzle schema to OpenAPI compatible schema
export function drizzleToOpenApi(table: any, type: 'insert' | 'select' = 'select') {
    const schema = type === 'insert' ? createInsertSchema(table) : createSelectSchema(table);
    return zodToOpenApi(z.object(schema.shape));
}


export function makeExample<T>(
    status: number,
    data?: T,
    message?: string,
    error?: string
): ApiResponse<T> {
    return {
        success: status < 400,
        message: message ?? (status < 400 ? "OK" : undefined),
        error: error ?? (status >= 400 ? "Error" : undefined),
        data: data ?? (status < 400 ? ({} as T) : undefined),
    };
}

export const responseExamples = {
    200: makeExample(200, { id: 1, email: "user@example.com" }, "OK"),
    201: makeExample(201, { id: 42 }, "Created"),
    400: makeExample(400, null, "Bad Request", "Bad Request"),
    401: makeExample(401, null, "Unauthorized", "Unauthorized"),
    403: makeExample(403, null, "Access Denied", "Access Denied"),
    404: makeExample(404, null, "Resource Not Found", "Resource Not Found"),
    409: makeExample(409, null, "Conflict", "Conflict"),
    500: makeExample(500, null, "Internal Server Error", "Internal Server Error"),
};

// utils/openapi.ts
export function withCustomReponse<T>(
    example: ApiResponse<T>,
    options: Record<string, string>
): ApiResponse<T> {
    return { ...example, ...options };
}


// src/openapi/responseExamples.ts
// export const responseExamples = {
//     200: {
//         ok: {
//             success: true,
//             message: "Operation successful",
//             error: null,
//             data: { id: 1, email: "user@example.com" },
//         },
//     },
//     201: {
//         created: {
//             success: true,
//             message: "Resource created",
//             error: null,
//             data: { id: 42 },
//         },
//     },
//     400: {
//         badRequest: {
//             success: false,
//             message: "Bad Request",
//             error: "Bad Request",
//             data: null,
//         },
//     },
//     401: {
//         unauthorized: {
//             success: false,
//             message: "Unauthorized",
//             error: "Unauthorized",
//             data: null,
//         },
//     },
//     403: {
//         forbidden: {
//             success: false,
//             message: "Access Denied",
//             error: "Access Denied",
//             data: null,
//         },
//     },
//     404: {
//         notFound: {
//             success: false,
//             message: "Resource Not Found",
//             error: "Resource Not Found",
//             data: null,
//         },
//     },
//     409: {
//         conflict: {
//             success: false,
//             message: "Conflict",
//             error: "Conflict",
//             data: null,
//         },
//     },
//     500: {
//         serverError: {
//             success: false,
//             message: "Internal Server Error",
//             error: "Internal Server Error",
//             data: null,
//         },
//     },
// };


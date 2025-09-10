import { createRoute, z } from "@hono/zod-openapi";

const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * DTO Schemas
 */
export const uploadUrlRequest = z.object({
    fileName: z.string().min(1).max(255).openapi({ example: "resume.pdf" }),
    contentType: z.string().optional().openapi({ example: "application/pdf" }),
    size: z.number().max(MAX_FILE_SIZE).openapi({ example: 123456 }),
});

export const uploadUrlResponse = z.object({
    fileId: z.number().openapi({ example: 42 }),
    uploadUrl: z.url().openapi({ example: "https://..." }),
    expiresAt: z
        .string()
        .datetime()
        .openapi({ example: new Date().toISOString() }),
});

export const fileResponse = z.object({
    id: z.number(),
    userId: z.number(),
    path: z.string(),
    originalName: z.string(),
    contentType: z.string().nullable(),
    size: z.number().nullable(),
    description: z.string().nullable(),
    isDeleted: z.boolean(),
    status: z.string(),
    uploadExpiresAt: z.string().datetime().nullable(),
    createdAt: z.string().datetime(),
});

export const downloadResponse = z.object({
    downloadUrl: z.url().openapi({ example: "https://..." }),
});

export const deleteResponse = z.object({
    success: z.boolean(),
});

/**
 * Routes
 */
export const uploadUrlRoute = createRoute({
    method: "post",
    path: "/upload-url",
    summary: "Generate signed upload URL",
    tags: ["Files"],
    request: {
        body: {
            content: { "application/json": { schema: uploadUrlRequest } },
        },
    },
    responses: {
        200: {
            description: "Signed upload URL generated",
            content: { "application/json": { schema: uploadUrlResponse } },
        },
        400: {
            description: "Validation error",
            content: {
                "application/json": { schema: z.object({ error: z.string() }) },
            },
        },
    },
});

export const listFilesRoute = createRoute({
    method: "get",
    path: "/",
    summary: "List user files",
    tags: ["Files"],
    responses: {
        200: {
            description: "User's files",
            content: { "application/json": { schema: z.array(fileResponse) } },
        },
    },
});

export const downloadFileRoute = createRoute({
    method: "get",
    path: "/{id}/download",
    summary: "Download file",
    tags: ["Files"],
    request: {
        params: z.object({
            id: z.string().regex(/^\d+$/).openapi({ example: "42" }),
        }),
    },
    responses: {
        200: {
            description: "Download URL generated",
            content: { "application/json": { schema: downloadResponse } },
        },
        403: {
            description: "Forbidden",
            content: {
                "application/json": { schema: z.object({ error: z.string() }) },
            },
        },
        404: {
            description: "File not found",
            content: {
                "application/json": { schema: z.object({ error: z.string() }) },
            },
        },
    },
});

export const deleteFileRoute = createRoute({
    method: "delete",
    path: "/{id}",
    summary: "Delete file (admin only)",
    tags: ["Files"],
    request: {
        params: z.object({
            id: z.string().regex(/^\d+$/).openapi({ example: "42" }),
        }),
    },
    responses: {
        200: {
            description: "File deleted",
            content: { "application/json": { schema: deleteResponse } },
        },
        403: {
            description: "Forbidden",
            content: {
                "application/json": { schema: z.object({ error: z.string() }) },
            },
        },
        404: {
            description: "File Not Found",
            content: {
                "application/json": { schema: z.object({ error: z.string() }) },
            },
        },
        400: {
            description:
                "Bad Request, the client request didn't follow the rules",
            content: {
                "application/json": { schema: z.object({ error: z.string() }) },
            },
        },
    },
});

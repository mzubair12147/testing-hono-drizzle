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
 * New Dtos 
 */

// Step 1: Metadata response
export const fileMetadataResponse = z.object({
    fileName: z.string().openapi({ example: "resume.pdf" }),
    contentType: z.string().openapi({ example: "application/pdf" }),
    size: z.number().openapi({ example: 123456 }),
});

// Step 3: Upload result
export const testUploadRequest = z.object({
    signedUrl: z.string().url().openapi({ example: "https://..." }),
});

export const testUploadResponse = z.object({
    success: z.boolean().openapi({ example: true }),
});

// Step 4: Download request
export const testDownloadRequest = z.object({
    signedUrl: z.string().url().openapi({ example: "https://..." }),
});


/**
 * Routes
 */
export const uploadUrlRoute = createRoute({
    method: "post",
    path: "/upload-url",
    summary: "Generate signed upload URL",
    tags: ["Files"],
    security: [{ Bearer: [] }],
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
    security: [{ Bearer: [] }],
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
    security: [{ Bearer: [] }],
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
    security: [{ Bearer: [] }],
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


/**
 * new routes
 */

// Step 1: Get metadata
export const testMetadataRoute = createRoute({
    method: "post",
    path: "/test/metadata",
    summary: "Get file metadata from local file",
    tags: ["Files-Workflow"],
    request: {
        body: {
            content: {
                "multipart/form-data": {
                    schema: z.object({
                        file: z.any().openapi({ type: "string", format: "binary" }),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: "File metadata",
            content: { "application/json": { schema: fileMetadataResponse } },
        },
        400: {
            description: "Bad Request",
            content: {
                "application/json": { schema: z.object({ error: z.string() }) },
            },
        },
    },
});

// Step 3: Upload using signed URL
export const testUploadRoute = createRoute({
    method: "post",
    path: "/test/upload",
    summary: "Upload file using signed URL",
    tags: ["Files-Workflow"],
    request: {
        body: {
            content: {
                "multipart/form-data": {
                    schema: z.object({
                        file: z.any().openapi({ type: "string", format: "binary" }),
                        signedUrl: z.string().url(),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: "Upload result",
            content: { "application/json": { schema: testUploadResponse } },
        },
        400: {
            description: "Bad Request",
            content: {
                "application/json": { schema: z.object({ error: z.string() }) },
            },
        },
        500: {
            description: "Upload failed",
            content: {
                "application/json": { schema: z.object({ error: z.string() }) },
            },
        },
    },
});

// Step 4: Download using signed URL
export const testDownloadRoute = createRoute({
    method: "post",
    path: "/test/download",
    summary: "Download file using signed URL",
    tags: ["Files-Workflow"],
    request: {
        body: {
            content: {
                "application/json": { schema: testDownloadRequest },
            },
        },
    },
    responses: {
        200: {
            description: "File download",
            content: {
                "application/octet-stream": {
                    schema: { type: "string", format: "binary" },
                },
            },
        },
    },
});


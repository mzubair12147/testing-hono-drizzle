import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { deleteResponse, downloadResponse, errorResponse, fileMetadataResponse, fileResponse, okResponseSchema, testDownloadRequest, uploadUrlRequest, uploadUrlResponse } from "../../db/validators";
import { fileCreatedWebhook, fileDeletedWebhook } from "./file.webhook";
import { deleteFileController, downloadFileUrlController, fileMetaExtractController, fileUploadController, listFileController, testDownloadController, testUploadController } from "./file.controller";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { baseResponse, responseExamples } from "../../utils/openapi";

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
        401: {
            description: "Validation error",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["401"] },
            },
        },
        500: {
            description: "Upload failed",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] },
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
            content: { "application/json": { schema: fileResponse } },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] }, // z.object({ error: z.string() })
            },
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
                "application/json": { schema: errorResponse, example: responseExamples["403"] },
            },
        },
        404: {
            description: "File not found",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["404"] },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] }, // z.object({ error: z.string() })
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
                "application/json": { schema: errorResponse, example: responseExamples["403"] },
            },
        },
        404: {
            description: "File Not Found",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["404"] },
            },
        },
        400: {
            description:
                "Bad Request, the client request didn't follow the rules",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["400"] },
            },
        },
        500: {
            description: "Internal server error",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] }, // z.object({ error: z.string() })
            },
        },
    },
});


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
                "application/json": { schema: errorResponse, example: responseExamples["400"] },
            },
        },
    },
});

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
                        signedUrl: z.url(),
                    }),
                },
            },
        },
    },
    responses: {
        200: {
            description: "Upload result",
            content: { "application/json": { schema: okResponseSchema } },
        },
        400: {
            description: "Bad Request",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["400"] },
            },
        },
        500: {
            description: "Upload failed",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] },
            },
        },
    },
});

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
            description: "File metadata",
            content: {
                "application/json": {
                    schema: baseResponse(
                        z.object({
                            fileName: z.string().openapi({ example: "download.pdf" }),
                            contentType: z.string().openapi({ example: "application/pdf" }),
                            size: z.string().nullable().openapi({ example: "12345" }),
                            downloadUrl: z.string().url().openapi({ example: "https://..." }),
                        })
                    ),
                },
            },
        },
        401: {
            description: "Unauthorized",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["401"] },
            },
        },
        500: {
            description: "Download failed",
            content: {
                "application/json": { schema: errorResponse, example: responseExamples["500"] },
            },
        },
    },
});



const filesRouter = new OpenAPIHono();


filesRouter.post("/created/webhook", fileCreatedWebhook);

filesRouter.post("/deleted/webhook", fileDeletedWebhook);


// Step 1: Metadata extractor
filesRouter.openapi(testMetadataRoute, fileMetaExtractController);
// Step 3: Upload file with signed URL
filesRouter.openapi(testUploadRoute, testUploadController);
// Step 4: Download with signed URL
filesRouter.openapi(testDownloadRoute, testDownloadController);

filesRouter.use("*", authMiddleware);

filesRouter.openapi(uploadUrlRoute, fileUploadController);
filesRouter.openapi(listFilesRoute, listFileController);
filesRouter.openapi(downloadFileRoute, downloadFileUrlController);
filesRouter.openapi(deleteFileRoute, deleteFileController);

export default filesRouter;


import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { files, users } from "./schema";
import z from "zod";
import { baseResponse, toZodObject } from "../utils/openapi";
import { MAX_FILE_SIZE } from "../constants";


//  user + auth related zod schemas and other stuff

export const insertUserSchema = createInsertSchema(users);
export const createUserSchema = insertUserSchema.omit({ id: true });

export const registerUserSchema = createUserSchema.pick({
    email: true,
    passwordHash: true,
})
export const loginUserSchema = registerUserSchema;
export const meSchema = createSelectSchema(users).pick({
    id: true,
    name: true,
    email: true,
    role: true,
})
export const registerUserOpenApi = toZodObject(registerUserSchema);
export const loginUserOpenApi = toZodObject(loginUserSchema)
export const meOpenApi = baseResponse(z.object(meSchema.shape));
export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;



// export const errorResponse = baseResponse(z.object({
//     error: z.string().openapi({ example: "Error message" }),
// }));
export const errorResponse = baseResponse(z.null()).openapi("ErrorResponse");

export const emailResponse = baseResponse(z.object({
    email: z.email().openapi({ example: "test@example.com" }),
}));

export const authTokenResponse = baseResponse(z.object({
    accessToken: z.string().openapi({ example: "eyJhbGciOi..." }),
    refreshToken: z.string().openapi({ example: "eyJhbGciOi..." }),
}))

export const okResponseSchema = baseResponse(z.object({
    ok: z.boolean().openapi({ example: true }),
}));



//  file related zod schemas
const insertFileSchema = createInsertSchema(files);
const createFileSchema = insertFileSchema

export const uploadUrlRequest = baseResponse(z.object({
    fileName: z.string().min(1).max(255).openapi({ example: "resume.pdf" }),
    contentType: z.string().optional().openapi({ example: "application/pdf" }),
    size: z.number().max(MAX_FILE_SIZE).openapi({ example: 123456 }),
}));

export const uploadUrlResponse = baseResponse(z.object({
    fileId: z.number().openapi({ example: 42 }),
    uploadUrl: z.url().openapi({ example: "https://..." }),
    expiresAt: z.date()
        .openapi({ example: new Date().toISOString() }),
}));
export const fileResponse = baseResponse(z.array(z.object(createFileSchema.shape)))


// z.object({
//     id: z.number(),
//     userId: z.number(),
//     path: z.string(),
//     originalName: z.string(),
//     contentType: z.string().nullable(),
//     size: z.number().nullable(),
//     description: z.string().nullable(),
//     isDeleted: z.boolean(),
//     status: z.string(),
//     uploadExpiresAt: z.string().datetime().nullable(),
//     createdAt: z.string().datetime(),
// });

export const downloadResponse = baseResponse(z.object({
    downloadUrl: z.url().openapi({ example: "https://..." }),
}));

export const deleteResponse = baseResponse(z.object({
    success: z.boolean(),
}));

export const fileMetadataResponse = baseResponse(z.object({
    fileName: z.string().openapi({ example: "resume.pdf" }),
    contentType: z.string().openapi({ example: "application/pdf" }),
    size: z.number().openapi({ example: 123456 }),
}));

// Step 3: Upload result
export const testUploadRequest = baseResponse(z.object({
    signedUrl: z.string().url().openapi({ example: "https://..." }),
}));


export const testDownloadRequest = z.object({
    signedUrl: z.string().url().openapi({ example: "https://..." }),
})


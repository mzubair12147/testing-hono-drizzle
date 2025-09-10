import { z } from "zod";

export const createUploadUrlDto = z.object({
    fileName: z.string().min(1).max(255),
    contentType: z.string().optional(),
    size: z
        .number()
        .positive()
        .max(10 * 1024 * 1024),
});

export type CreateUploadUrlDto = z.infer<typeof createUploadUrlDto>;

export const downloadFileParamsDto = z.object({
    id: z.string().regex(/^\d+$/),
});

export type DownloadFileParamsDto = z.infer<typeof downloadFileParamsDto>;

import { Context } from "hono";
import { MAX_FILE_SIZE } from "../../constants";
import { deleteFile, getFileDownloadUrl, getUserFiles, uploadFileService } from "./file.service";
import { checkAdmin } from "../auth/auth.service";
import { accessDeniedReponse, ApiResponse, badRequestReponse, notFoundReponse, okReponse, serverErrorReponse, unauthorizedResponse } from "../../utils/response";
import { TypedResponse } from "hono";

// controllers for test routes
export const fileMetaExtractController = async (c: Context) => {
    const form = await c.req.formData();
    const file = form.get("file") as File | null;

    if (!file) return badRequestReponse(c, "No file uploaded");
    return okReponse(c, {
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
    })
}

export const testUploadController = async (c: Context) => {
    const form = await c.req.formData();
    const file = form.get("file") as File | null;
    const signedUrl = form.get("signedUrl") as string;

    if (!file || !signedUrl) {
        return badRequestReponse(c, "File and signedUrl required")
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: buffer,
    });

    if (!uploadRes.ok) return serverErrorReponse(c, "Upload failed")

    return okReponse(c, { ok: true });
}


export const testDownloadController = async (
    c: Context
) => {
    try {
        const { signedUrl } = await c.req.json<{ signedUrl: string }>();

        if (!signedUrl) {
            return unauthorizedResponse(c, "signedUrl required");
        }

        const response = await fetch(signedUrl);
        if (!response.ok) {
            return serverErrorReponse(c, "Failed to fetch file");
        }

        return okReponse(c, {
            fileName: response.headers.get("Content-Disposition") ?? "download",
            contentType: response.headers.get("Content-Type") ?? "application/octet-stream",
            size: response.headers.get("Content-Length"),
            downloadUrl: signedUrl,
        }, "File metadata");

    } catch (e) {
        return serverErrorReponse(c);
    }
};

export const fileUploadController = async (c: Context) => {
    try {
        const userId = c.get("userId") as number;
        const { fileName, contentType, size } = await c.req.json();
        if (size > MAX_FILE_SIZE) {
            return unauthorizedResponse(c, "File exceeds 10MB limit");
        }
        const result = await uploadFileService(userId, fileName, contentType, size);
        return okReponse(c, result);
    } catch (e) {
        if (e instanceof Error) {
            return serverErrorReponse(c, e.message);
        }
        return serverErrorReponse(c);
    }
}

// file.controller.ts
export const listFileController = async (c: Context) => {
    try {
        const userId = c.get("userId") as number;
        const userFiles = await getUserFiles(userId);

        const serialized = userFiles.map((f) => ({
            ...f,
            createdAt: f.createdAt.toISOString(),
            uploadExpiresAt: f.uploadExpiresAt ? f.uploadExpiresAt.toISOString() : null,
        }));

        // RETURN the serialized result (this is crucial)
        return okReponse(c, serialized);
    } catch (e) {
        console.error("listFileController error:", e);
        if (e instanceof Error) {
            return serverErrorReponse(c, e.message);
        }
        return serverErrorReponse(c);
    }
};


export const downloadFileUrlController = async (c: Context) => {
    try {

        const userId = Number(c.get("userId"));
        const fileId = Number(c.req.param("id"));

        const data = await getFileDownloadUrl(userId, fileId);
        return okReponse(c, { downloadUrl: data.signedUrl });
    } catch (e) {
        if (e instanceof Error) {
            if (e.message.includes("not found")) {
                return notFoundReponse(c, "File not found");
            }
            if (e.message.includes("forbidden")) {
                return accessDeniedReponse(c, "Permission Denied");
            }
            return serverErrorReponse(c, e.message);
        }
        return serverErrorReponse(c);
    }
}

export const deleteFileController = async (c: Context) => {
    try {
        const userId = c.get("userId") as number;
        const [user] = await checkAdmin(userId);

        if (!user || user.role !== "admin") {
            return accessDeniedReponse(c);
        }

        const fileId = Number(c.req.param("id"));
        await deleteFile(fileId);

        return okReponse(c, { success: true })

    } catch (e) {
        if (e instanceof AppError) {
            return notFoundReponse(c, "File Not Found");
        }
        return serverErrorReponse(c);
    }
};


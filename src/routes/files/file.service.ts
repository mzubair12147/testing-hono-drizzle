import { and, eq, lt } from "drizzle-orm";
import { db } from "../../db/db";
import { files } from "../../db/schema";
import { ENV } from "../../config/env";
import { UPLOAD_URL_TTL_SECONDS } from "../../constants";
import { supabase } from "../../lib/supabase";


export const updateFileCreated = async (path: string) => {
    await db
        .update(files)
        .set({ status: "uploaded" })
        .where(eq(files.path, path));
    return { ok: true };
}

export const updateFileDeleted = async (name: string) => {
    await db
        .update(files)
        .set({ isDeleted: true, status: "deleted" })
        .where(eq(files.path, name));
    return { ok: true };
}

export const uploadFileService = async (
    userId: number,
    fileName: string,
    contentType: string,
    size: number
) => {
    const bucket = ENV.SUPABASE_STORAGE_BUCKET_NAME || "uploads";
    const filePath = `${userId}/${Date.now()}-${fileName}`;
    const expiresAt = new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000);

    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(filePath, { upsert: false });

    // if (error) return c.json({ error: error.message }, 400);
    if (error) throw new Error(error.message);

    const [inserted] = await db
        .insert(files)
        .values({
            userId,
            path: filePath,
            originalName: fileName,
            contentType,
            size,
            status: "pending",
            uploadExpiresAt: expiresAt,
        })
        .returning({ id: files.id });

    return { uploadUrl: data.signedUrl, fileId: inserted.id, expiresAt: expiresAt.toString() };
}

export const getUserFiles = async (userId: number) => {
    const now = new Date();
    await db
        .update(files)
        .set({ status: "expired" })
        .where(
            and(
                eq(files.userId, userId),
                eq(files.status, "pending"),
                lt(files.uploadExpiresAt, now)
            )
        );
    const userFiles = await db
        .select()
        .from(files)
        .where(and(eq(files.userId, userId), eq(files.isDeleted, false)));

    return userFiles;
}

export const getFileDownloadUrl = async (userId: number, fileId: number) => {
    const [file] = await db.select().from(files).where(eq(files.id, fileId));

    if (!file) throw new Error("file not found");
    if (file.userId !== userId) throw new Error("forbidden");

    const bucket = ENV.SUPABASE_STORAGE_BUCKET_NAME || "uploads";
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(file.path, 60 * 10);
    if (error) throw new Error(error.message);

    return data;
}

export const deleteFile = async (fileId: number) => {
    const [file] = await db.select().from(files).where(eq(files.id, fileId));
    if (!file) {
        throw new AppError("File not found", 404);
    }
    const bucket = ENV.SUPABASE_STORAGE_BUCKET_NAME || "uploads";

    const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([file.path]);

    if (storageError) {
        throw new AppError(`Failed to delete from storage: ${storageError.message}`, 500);
    }
    await db
        .update(files)
        .set({
            status: "deleted",
            isDeleted: true,
        })
        .where(eq(files.id, fileId));

    await db.delete(files).where(eq(files.id, fileId));

    return { ok: true };
};

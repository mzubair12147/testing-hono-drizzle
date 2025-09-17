import { OpenAPIHono } from "@hono/zod-openapi";
import { and, eq, lt } from "drizzle-orm";
import { supabase } from "../../lib/supabase";
import { db } from "../../db/db";
import { files, users } from "../../db/schema";
import {
    uploadUrlRoute,
    listFilesRoute,
    downloadFileRoute,
    deleteFileRoute,
} from "./routes";
import { Context } from "hono";
import { authMiddleware } from "../../middlewares/authMiddleware";
import { ENV } from "../../config/env";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const UPLOAD_URL_TTL_SECONDS = 60 * 60;

export const filesRouter = new OpenAPIHono();

filesRouter.post("/created/webhook", async (c) => {
    const body = await c.req.json();
    const path = body.record?.name;

    if (!path) {
        return c.json({ error: "No file path" }, 400);
    }

    await db
        .update(files)
        .set({ status: "uploaded" })
        .where(eq(files.path, path));

    return c.json({ ok: true });
});

filesRouter.post("/deleted/webhook", async (c) => {
    const payload = await c.req.json();

    if (payload.event === "DELETE") {
        const file = payload.record;

        await db
            .update(files)
            .set({ isDeleted: true, status: "deleted" })
            .where(eq(files.path, file.name));

    }

    return c.json({ ok: true });
});


/**
 * new routes
 */

import {
    testMetadataRoute,
    testUploadRoute,
    testDownloadRoute,
} from "./routes";

// Step 1: Metadata extractor
filesRouter.openapi(testMetadataRoute, async (c: Context) => {
    const form = await c.req.formData();
    const file = form.get("file") as File | null;

    if (!file) return c.json({ error: "No file uploaded" }, 400);

    return c.json({
        fileName: file.name,
        contentType: file.type || "application/octet-stream",
        size: file.size,
    }, 200);
});

// Step 3: Upload file with signed URL
filesRouter.openapi(testUploadRoute, async (c: Context) => {
    const form = await c.req.formData();
    const file = form.get("file") as File | null;
    const signedUrl = form.get("signedUrl") as string;

    if (!file || !signedUrl) {
        return c.json({ error: "File and signedUrl required" }, 400);
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const uploadRes = await fetch(signedUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: buffer,
    });


    if (!uploadRes.ok) return c.json({ error: "Upload failed" }, 500);

    return c.json({ success: true }, 200);
});

// Step 4: Download with signed URL
filesRouter.openapi(testDownloadRoute, async (c: Context) => {
    const { signedUrl } = await c.req.json<{ signedUrl: string }>();

    if (!signedUrl) return c.json({ error: "signedUrl required" }, 400);

    const response = await fetch(signedUrl);
    if (!response.ok) return c.json({ error: "Failed to fetch file" }, 500);

    return new Response(response.body, {
        headers: {
            "Content-Type": response.headers.get("Content-Type") ?? "application/octet-stream",
            "Content-Disposition": response.headers.get("Content-Disposition") ?? "attachment",
        },
    });
});

// filesRouter.use("/", authMiddleware);
// filesRouter.use("/upload-url", authMiddleware);
// filesRouter.use("/:id", authMiddleware);
// filesRouter.use("/:id/download", authMiddleware);

filesRouter.use("*", authMiddleware);


filesRouter.openapi(uploadUrlRoute, async (c: Context) => {
    const userId = c.get("userId") as number;

    const { fileName, contentType, size } = await c.req.json();
    if (size > MAX_FILE_SIZE) {
        return c.json({ error: "File exceeds 10MB limit" }, 400);
    }

    const bucket = ENV.SUPABASE_STORAGE_BUCKET_NAME || "uploads";
    const filePath = `${userId}/${Date.now()}-${fileName}`;
    const expiresAt = new Date(Date.now() + UPLOAD_URL_TTL_SECONDS * 1000);

    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUploadUrl(filePath, { upsert: false });

    if (error) return c.json({ error: error.message }, 400);

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

    return c.json(
        {
            fileId: inserted.id,
            uploadUrl: data.signedUrl,
            expiresAt,
        },
        200
    );
});

filesRouter.openapi(listFilesRoute, async (c: Context) => {
    const userId = c.get("userId") as number;
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

    return c.json(userFiles);
});

filesRouter.openapi(downloadFileRoute, async (c: Context) => {
    const userId = Number(c.get("userId"));
    const fileId = Number(c.req.param("id"));

    const [file] = await db.select().from(files).where(eq(files.id, fileId));

    if (!file) return c.json({ error: "File not found" }, 404);
    if (file.userId !== userId) return c.json({ error: "Forbidden" }, 403);

    const bucket = ENV.SUPABASE_STORAGE_BUCKET_NAME || "uploads";
    const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(file.path, 60 * 10);

    if (error) return c.json({ error: error.message }, 404);

    return c.json({ downloadUrl: data.signedUrl }, 200);
});

filesRouter.openapi(deleteFileRoute, async (c: Context) => {
    const userId = c.get("userId") as number;

    // Check if user is admin
    const [user] = await db
        .select({ role: users.role })
        .from(users)
        .where(eq(users.id, userId));

    if (!user || user.role !== "admin") {
        return c.json({ error: "Forbidden" }, 403);
    }

    const fileId = Number(c.req.param("id"));

    const [file] = await db.select().from(files).where(eq(files.id, fileId));
    if (!file) return c.json({ error: "File not found" }, 404);

    const bucket = ENV.SUPABASE_STORAGE_BUCKET_NAME || "uploads";

    const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([file.path]);

    if (storageError) {
        return c.json({ error: storageError.message }, 400);
    }

    await db
        .update(files)
        .set({
            status: "deleted",
            isDeleted: true,
        })
        .where(eq(files.id, fileId));

    await db.delete(files).where(eq(files.id, fileId));

    return c.json({ success: true }, 200);
});



export default filesRouter;

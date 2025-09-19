import { Context } from "hono";
import { updateFileCreated, updateFileDeleted } from "./file.service";


export const fileCreatedWebhook = async (c: Context) => {
    try {
        const body = await c.req.json();
        const path = body.record?.name;
        if (!path) {
            return c.json({ error: "No file path" }, 400);
        }
        await updateFileCreated(path);
        return c.json({ ok: true });
    } catch (error) {
        return c.json({ error: "Internal server error" }, 500);
    }
}

export const fileDeletedWebhook = async (c: Context) => {
    try {
        const payload = await c.req.json();
        if (payload.event === "DELETE") {
            const file = payload.record;
            await updateFileDeleted(file.name);
        }
        return c.json({ ok: true });
    } catch (error) {
        return c.json({ error: "Internal server error" }, 500);
    }
}
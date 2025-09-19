import {
    pgTable,
    serial,
    integer,
    varchar,
    text,
    timestamp,
    boolean,
    index,
} from "drizzle-orm/pg-core";

export const files = pgTable(
    "files",
    {
        id: serial("id").primaryKey(),
        userId: integer("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        sessionId: varchar("session_id", { length: 36 }).references(
            () => sessions.id,
            { onDelete: "set null" }
        ),
        path: text("path").notNull(),
        originalName: varchar("original_name", { length: 255 }).notNull(),
        contentType: varchar("content_type", { length: 100 }),
        size: integer("size"),
        description: text("description"),
        isDeleted: boolean("is_deleted").default(false).notNull(),
        status: varchar("status", { length: 20 }).notNull().default("pending"),
        uploadExpiresAt: timestamp("upload_expires_at", { withTimezone: true }),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),

    },
    (t) => [
        index("files_user_idx").on(t.userId),
        index("files_path_idx").on(t.path),
    ]
);

export const users = pgTable("users", {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("full_name", { length: 50 }).default(""),
    role: varchar("role", { length: 20 }).notNull().default("user"),
    createdAt: timestamp("created_at", { withTimezone: true })
        .defaultNow()
        .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
        .defaultNow()
        .notNull()
        .$onUpdate(() => new Date()),
});

export const sessions = pgTable(
    "sessions",
    {
        id: varchar("id", { length: 36 }).primaryKey(),
        userId: integer("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        userAgent: text("user_agent"),
        ip: varchar("ip", { length: 45 }),
        refreshTokenHash: varchar("refresh_token_hash", {
            length: 255,
        }).notNull(),
        isRevoked: boolean("is_revoked").default(false).notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true })
            .defaultNow()
            .notNull(),
        replacedBy: varchar("replaced_by", { length: 36 }),
    },
    (t) => [
        index("sessions_user_idx").on(t.userId),
        index("sessions_exp_idx").on(t.expiresAt),
    ]
);

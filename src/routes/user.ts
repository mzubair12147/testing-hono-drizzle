import { Hono } from "hono";
import { db } from "../db/db";
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
import { hashPassword } from "../auth/password";
const userRouter = new Hono();

userRouter.get("/seed", async (c) => {
  const existingUsers = await db.select().from(users);
  if (existingUsers.length === 0) {
    await db.insert(users).values({
      email: "test@gmail.com",
      passwordHash: await hashPassword("password"),
      role: "user",
    });
    return c.text("User created!");
  }
  return c.text("Users already exist");
});

userRouter.get("/", async (c) => {
  const allUsers = await db.select().from(users);
  return c.json(allUsers);
});

userRouter.get("/:id", async (c) => {
  const userId = Number(c.req.param("id"));
  const user = await db.select().from(users).where(eq(users.id, userId));
  console.log("user", user);
  return c.json(user);
});

export default userRouter;

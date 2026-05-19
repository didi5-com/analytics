import { Router, type IRouter } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RegisterUserBody,
  LoginUserBody,
  LoginUserResponse,
  GetCurrentUserResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();
const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-change-in-production";

router.post("/register", async (req, res) => {
  const parsed = RegisterUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "Name, email, password, and role are required" });
    return;
  }

  const { name, email, password, role } = parsed.data;

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing.length > 0) {
    res.status(409).json({ msg: "User with this email already exists" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  // Teachers start as pending; students and admins are active immediately
  const status = role === "teacher" ? "pending" : "active";

  await db.insert(usersTable).values({ name, email, passwordHash, role, status });

  const msg =
    role === "teacher"
      ? "Account created. Please wait for admin approval before logging in."
      : "User created successfully";

  res.status(201).json({ msg });
});

router.post("/login", async (req, res) => {
  const parsed = LoginUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "Email and password are required" });
    return;
  }

  const { email, password } = parsed.data;

  const users = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (users.length === 0) {
    res.status(401).json({ msg: "Bad email or password" });
    return;
  }

  const user = users[0];
  const passwordMatch = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatch) {
    res.status(401).json({ msg: "Bad email or password" });
    return;
  }

  if (user.status === "pending") {
    res.status(403).json({ msg: "Your account is pending admin approval. Please wait." });
    return;
  }

  if (user.status === "suspended") {
    res.status(403).json({ msg: "Your account has been suspended. Contact an administrator." });
    return;
  }

  const token = jwt.sign(
    { userId: user.id, role: user.role, email: user.email, name: user.name },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

  const data = LoginUserResponse.parse({
    access_token: token,
    role: user.role,
    name: user.name,
    status: user.status,
  });

  res.json(data);
});

router.get("/me", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ msg: "No token provided" });
    return;
  }

  const token = authHeader.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      userId: number; role: string; email: string; name: string;
    };

    const users = await db.select().from(usersTable).where(eq(usersTable.id, decoded.userId)).limit(1);
    if (users.length === 0) {
      res.status(401).json({ msg: "User not found" });
      return;
    }

    const user = users[0];
    const data = GetCurrentUserResponse.parse({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      createdAt: user.createdAt.toISOString(),
    });

    res.json(data);
  } catch {
    res.status(401).json({ msg: "Invalid or expired token" });
  }
});

export { JWT_SECRET };
export default router;

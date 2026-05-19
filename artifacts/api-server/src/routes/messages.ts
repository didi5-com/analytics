import { Router, type IRouter } from "express";
import { db, usersTable, messagesTable } from "@workspace/db";
import { eq, or, and, ne } from "drizzle-orm";
import { requireAuth, AuthRequest } from "../lib/auth-middleware";
import {
  GetMessagesResponse,
  SendMessageBody,
  GetContactsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

// GET /messages — all messages involving this user
router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const msgs = await db
    .select()
    .from(messagesTable)
    .where(or(eq(messagesTable.senderId, userId), eq(messagesTable.receiverId, userId)));

  const allUserIds = new Set<number>();
  msgs.forEach((m) => { allUserIds.add(m.senderId); allUserIds.add(m.receiverId); });

  const userMap = new Map<number, string>();
  for (const uid of allUserIds) {
    const u = await db.select().from(usersTable).where(eq(usersTable.id, uid)).limit(1);
    if (u[0]) userMap.set(uid, u[0].name);
  }

  const data = GetMessagesResponse.parse(
    msgs.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: userMap.get(m.senderId) ?? "Unknown",
      receiverId: m.receiverId,
      receiverName: userMap.get(m.receiverId) ?? "Unknown",
      content: m.content,
      read: m.read,
      createdAt: m.createdAt.toISOString(),
    }))
  );

  res.json(data);
});

// POST /messages — send a message
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = SendMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "receiverId and content are required" });
    return;
  }

  const { receiverId, content } = parsed.data;
  const senderId = req.user!.userId;

  await db.insert(messagesTable).values({ senderId, receiverId, content, read: false });
  res.status(201).json({ msg: "Message sent" });
});

// GET /messages/contacts — who this user can message
router.get("/contacts", requireAuth, async (req: AuthRequest, res) => {
  const userId = req.user!.userId;
  const role = req.user!.role;

  let contacts: { id: number; name: string; role: string }[] = [];

  const allUsers = await db
    .select()
    .from(usersTable)
    .where(and(ne(usersTable.id, userId), eq(usersTable.status, "active")));

  if (role === "admin") {
    contacts = allUsers.map((u) => ({ id: u.id, name: u.name, role: u.role }));
  } else if (role === "teacher") {
    contacts = allUsers
      .filter((u) => u.role === "student" || u.role === "admin")
      .map((u) => ({ id: u.id, name: u.name, role: u.role }));
  } else {
    // student
    contacts = allUsers
      .filter((u) => u.role === "teacher" || u.role === "admin")
      .map((u) => ({ id: u.id, name: u.name, role: u.role }));
  }

  const data = GetContactsResponse.parse(contacts);
  res.json(data);
});

export default router;

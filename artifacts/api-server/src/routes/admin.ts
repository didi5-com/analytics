import { Router, type IRouter } from "express";
import { db, usersTable, coursesTable, enrollmentsTable, gradesTable, attendanceTable } from "@workspace/db";
import { eq, and, ne } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth-middleware";
import {
  GetAdminOverviewResponse,
  ListUsersResponse,
  UpdateUserBody,
  CreateCourseBody,
  EnrollStudentBody,
  ListCoursesResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeRisk(score: number, attendance: number): "LOW" | "MEDIUM" | "HIGH" {
  const perf = 0.7 * score + 0.3 * attendance;
  if (perf >= 70) return "LOW";
  if (perf >= 40) return "MEDIUM";
  return "HIGH";
}

// GET /admin/overview
router.get("/overview", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const allUsers = await db.select().from(usersTable);
  const students = allUsers.filter((u) => u.role === "student");
  const teachers = allUsers.filter((u) => u.role === "teacher");
  const pendingTeachers = teachers.filter((t) => t.status === "pending");

  const courses = await db.select().from(coursesTable);

  // Compute at-risk students
  let atRiskCount = 0;
  const courseStatsMap = new Map<number, { scores: number[]; attendances: number[]; atRisk: number }>();

  for (const course of courses) {
    courseStatsMap.set(course.id, { scores: [], attendances: [], atRisk: 0 });
  }

  for (const student of students) {
    const grades = await db.select().from(gradesTable).where(eq(gradesTable.studentId, student.id));
    const atts = await db.select().from(attendanceTable).where(eq(attendanceTable.studentId, student.id));

    let studentAtRisk = false;
    for (const grade of grades) {
      const att = atts.find((a) => a.courseId === grade.courseId);
      const attPct = att?.percentage ?? 0;
      const risk = computeRisk(grade.score, attPct);

      const stats = courseStatsMap.get(grade.courseId);
      if (stats) {
        stats.scores.push(grade.score);
        stats.attendances.push(attPct);
        if (risk === "HIGH") stats.atRisk++;
      }

      if (risk === "HIGH") studentAtRisk = true;
    }
    if (studentAtRisk) atRiskCount++;
  }

  const courseStats = courses.map((c) => {
    const stats = courseStatsMap.get(c.id)!;
    const avg = (arr: number[]) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);
    return {
      courseCode: c.code,
      courseTitle: c.title,
      avgScore: Math.round(avg(stats.scores) * 10) / 10,
      avgAttendance: Math.round(avg(stats.attendances) * 10) / 10,
      atRisk: stats.atRisk,
      studentCount: stats.scores.length,
    };
  });

  const data = GetAdminOverviewResponse.parse({
    totalStudents: students.length,
    totalTeachers: teachers.length,
    totalCourses: courses.length,
    pendingTeachers: pendingTeachers.length,
    atRiskStudents: atRiskCount,
    courseStats,
  });

  res.json(data);
});

// GET /admin/users
router.get("/users", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const users = await db.select().from(usersTable);
  const data = ListUsersResponse.parse(
    users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      createdAt: u.createdAt.toISOString(),
    }))
  );
  res.json(data);
});

// PUT /admin/users/:userId
router.put("/users/:userId", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ msg: "Invalid userId" });
    return;
  }

  const parsed = UpdateUserBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "Invalid request body" });
    return;
  }

  const updates: Partial<{ name: string; role: string; status: string }> = {};
  if (parsed.data.name) updates.name = parsed.data.name;
  if (parsed.data.role) updates.role = parsed.data.role;
  if (parsed.data.status) updates.status = parsed.data.status;

  await db.update(usersTable).set(updates).where(eq(usersTable.id, userId));
  res.json({ msg: "User updated" });
});

// DELETE /admin/users/:userId
router.delete("/users/:userId", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ msg: "Invalid userId" });
    return;
  }

  await db.delete(usersTable).where(eq(usersTable.id, userId));
  res.json({ msg: "User deleted" });
});

// POST /admin/users/:userId/approve
router.post("/users/:userId/approve", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const userId = parseInt(req.params.userId);
  if (isNaN(userId)) {
    res.status(400).json({ msg: "Invalid userId" });
    return;
  }

  await db.update(usersTable).set({ status: "active" }).where(eq(usersTable.id, userId));
  res.json({ msg: "Teacher approved" });
});

// GET /admin/courses
router.get("/courses", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const courses = await db.select().from(coursesTable);
  const result = await Promise.all(
    courses.map(async (c) => {
      const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.courseId, c.id));
      let teacherName: string | null = null;
      if (c.teacherId) {
        const t = await db.select().from(usersTable).where(eq(usersTable.id, c.teacherId)).limit(1);
        teacherName = t[0]?.name ?? null;
      }
      return {
        id: c.id,
        code: c.code,
        title: c.title,
        teacherId: c.teacherId ?? null,
        teacherName,
        studentCount: enrollments.length,
      };
    })
  );

  const data = ListCoursesResponse.parse(result);
  res.json(data);
});

// POST /admin/courses
router.post("/courses", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const parsed = CreateCourseBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "Course code and title are required" });
    return;
  }

  const { code, title, teacherId } = parsed.data;
  await db.insert(coursesTable).values({ code, title, teacherId: teacherId ?? null });
  res.status(201).json({ msg: "Course created" });
});

// POST /admin/enroll
router.post("/enroll", requireAuth, requireRole("admin"), async (req: AuthRequest, res) => {
  const parsed = EnrollStudentBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "studentId and courseId are required" });
    return;
  }

  const { studentId, courseId } = parsed.data;

  const existing = await db
    .select()
    .from(enrollmentsTable)
    .where(and(eq(enrollmentsTable.studentId, studentId), eq(enrollmentsTable.courseId, courseId)))
    .limit(1);

  if (existing.length > 0) {
    res.json({ msg: "Student already enrolled" });
    return;
  }

  await db.insert(enrollmentsTable).values({ studentId, courseId });
  res.json({ msg: "Student enrolled" });
});

export default router;

import { Router, type IRouter } from "express";
import { db, usersTable, coursesTable, enrollmentsTable, gradesTable, attendanceTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth-middleware";
import {
  GetTeacherCoursesResponse,
  GetCourseStudentsResponse,
  UpsertGradeBody,
  UpsertAttendanceBody,
} from "@workspace/api-zod";

const router: IRouter = Router();

function computeRisk(score: number, attendance: number): "LOW" | "MEDIUM" | "HIGH" {
  const perf = 0.7 * score + 0.3 * attendance;
  if (perf >= 70) return "LOW";
  if (perf >= 40) return "MEDIUM";
  return "HIGH";
}

router.get("/courses", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const teacherId = req.user!.userId;

  const courses = await db.select().from(coursesTable).where(eq(coursesTable.teacherId, teacherId));

  const result = await Promise.all(
    courses.map(async (c) => {
      const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.courseId, c.id));
      return {
        id: c.id,
        code: c.code,
        title: c.title,
        teacherId: c.teacherId ?? null,
        teacherName: req.user!.name,
        studentCount: enrollments.length,
      };
    })
  );

  const data = GetTeacherCoursesResponse.parse(result);
  res.json(data);
});

router.get("/courses/:courseId/students", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const courseId = parseInt(req.params.courseId);
  if (isNaN(courseId)) {
    res.status(400).json({ msg: "Invalid courseId" });
    return;
  }

  const enrollments = await db.select().from(enrollmentsTable).where(eq(enrollmentsTable.courseId, courseId));

  const students = await Promise.all(
    enrollments.map(async (enr) => {
      const users = await db.select().from(usersTable).where(eq(usersTable.id, enr.studentId)).limit(1);
      const gradeRows = await db
        .select()
        .from(gradesTable)
        .where(and(eq(gradesTable.studentId, enr.studentId), eq(gradesTable.courseId, courseId)))
        .limit(1);
      const attRows = await db
        .select()
        .from(attendanceTable)
        .where(and(eq(attendanceTable.studentId, enr.studentId), eq(attendanceTable.courseId, courseId)))
        .limit(1);

      const score = gradeRows[0]?.score ?? null;
      const attendance = attRows[0]?.percentage ?? null;

      return {
        studentId: enr.studentId,
        studentName: users[0]?.name ?? "Unknown",
        email: users[0]?.email ?? "",
        score,
        attendance,
        riskLevel: score !== null && attendance !== null ? computeRisk(score, attendance) : null,
      };
    })
  );

  const data = GetCourseStudentsResponse.parse(students);
  res.json(data);
});

router.post("/grades", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const parsed = UpsertGradeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "studentId, courseId, and score are required" });
    return;
  }

  const { studentId, courseId, score } = parsed.data;

  const existing = await db
    .select()
    .from(gradesTable)
    .where(and(eq(gradesTable.studentId, studentId), eq(gradesTable.courseId, courseId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(gradesTable)
      .set({ score, updatedAt: new Date() })
      .where(and(eq(gradesTable.studentId, studentId), eq(gradesTable.courseId, courseId)));
  } else {
    await db.insert(gradesTable).values({ studentId, courseId, score });
  }

  res.json({ msg: "Grade saved" });
});

router.post("/attendance", requireAuth, requireRole("teacher"), async (req: AuthRequest, res) => {
  const parsed = UpsertAttendanceBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "studentId, courseId, and percentage are required" });
    return;
  }

  const { studentId, courseId, percentage } = parsed.data;

  const existing = await db
    .select()
    .from(attendanceTable)
    .where(and(eq(attendanceTable.studentId, studentId), eq(attendanceTable.courseId, courseId)))
    .limit(1);

  if (existing.length > 0) {
    await db
      .update(attendanceTable)
      .set({ percentage, updatedAt: new Date() })
      .where(and(eq(attendanceTable.studentId, studentId), eq(attendanceTable.courseId, courseId)));
  } else {
    await db.insert(attendanceTable).values({ studentId, courseId, percentage });
  }

  res.json({ msg: "Attendance saved" });
});

export default router;

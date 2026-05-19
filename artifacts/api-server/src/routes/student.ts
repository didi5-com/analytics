import { Router, type IRouter } from "express";
import { db, usersTable, coursesTable, enrollmentsTable, gradesTable, attendanceTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireAuth, requireRole, AuthRequest } from "../lib/auth-middleware";
import { GetStudentDashboardResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function computeRisk(score: number, attendance: number): "LOW" | "MEDIUM" | "HIGH" {
  const perf = 0.7 * score + 0.3 * attendance;
  if (perf >= 70) return "LOW";
  if (perf >= 40) return "MEDIUM";
  return "HIGH";
}

router.get("/dashboard", requireAuth, requireRole("student"), async (req: AuthRequest, res) => {
  const userId = req.user!.userId;

  const user = await db.select().from(usersTable).where(eq(usersTable.id, userId)).limit(1);
  if (user.length === 0) {
    res.status(404).json({ msg: "User not found" });
    return;
  }

  // Get all enrollments for this student
  const enrollments = await db
    .select()
    .from(enrollmentsTable)
    .where(eq(enrollmentsTable.studentId, userId));

  const courseResults = await Promise.all(
    enrollments.map(async (enr) => {
      const [course] = await db.select().from(coursesTable).where(eq(coursesTable.id, enr.courseId)).limit(1);
      const gradeRows = await db
        .select()
        .from(gradesTable)
        .where(and(eq(gradesTable.studentId, userId), eq(gradesTable.courseId, enr.courseId)))
        .limit(1);
      const attRows = await db
        .select()
        .from(attendanceTable)
        .where(and(eq(attendanceTable.studentId, userId), eq(attendanceTable.courseId, enr.courseId)))
        .limit(1);

      const score = gradeRows[0]?.score ?? 0;
      const attendance = attRows[0]?.percentage ?? 0;

      return {
        courseId: enr.courseId,
        courseCode: course?.code ?? "N/A",
        courseTitle: course?.title ?? "Unknown Course",
        score,
        attendance,
        riskLevel: computeRisk(score, attendance),
      };
    })
  );

  const overallScore = courseResults.length
    ? courseResults.reduce((s, c) => s + c.score, 0) / courseResults.length
    : 0;
  const overallAttendance = courseResults.length
    ? courseResults.reduce((s, c) => s + c.attendance, 0) / courseResults.length
    : 0;
  const overallRisk = computeRisk(overallScore, overallAttendance);

  const data = GetStudentDashboardResponse.parse({
    student: {
      id: user[0].id,
      name: user[0].name,
      email: user[0].email,
      role: user[0].role,
      status: user[0].status,
      createdAt: user[0].createdAt.toISOString(),
    },
    courses: courseResults,
    overallScore: Math.round(overallScore * 10) / 10,
    overallAttendance: Math.round(overallAttendance * 10) / 10,
    overallRisk,
  });

  res.json(data);
});

export default router;

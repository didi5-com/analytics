import { Router, type IRouter } from "express";
import jwt from "jsonwebtoken";
import {
  PredictRiskBody,
  PredictRiskResponse,
  GetRecommendationsBody,
  GetRecommendationsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || "your-jwt-secret-change-in-production";

function requireAuth(req: any, res: any): { userId: number; role: string; email: string } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ msg: "No token provided" });
    return null;
  }
  const token = authHeader.slice(7);
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: number; role: string; email: string };
  } catch {
    res.status(401).json({ msg: "Invalid or expired token" });
    return null;
  }
}

function mapRisk(prob: number): "LOW" | "MEDIUM" | "HIGH" {
  if (prob < 0.4) return "LOW";
  if (prob < 0.7) return "MEDIUM";
  return "HIGH";
}

router.post("/predict", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const parsed = PredictRiskBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "Missing grades or attendance data" });
    return;
  }

  const { grades, attendance } = parsed.data;

  const attendanceMap = new Map<number, number>();
  for (const a of attendance) {
    attendanceMap.set(a.student_id, a.percentage);
  }

  const predictions = grades.map((g) => {
    const att = attendanceMap.get(g.student_id) ?? 80;
    const performanceIndex = 0.7 * g.score + 0.3 * att;
    const riskProbability = Math.max(0, Math.min(1, 1 - performanceIndex / 100));
    return {
      student_id: g.student_id,
      course: g.course,
      score: g.score,
      attendance: att,
      risk_probability: Math.round(riskProbability * 1000) / 1000,
      risk_level: mapRisk(riskProbability),
    };
  });

  const data = PredictRiskResponse.parse(predictions);
  res.json(data);
});

router.post("/recommend", async (req, res) => {
  const user = requireAuth(req, res);
  if (!user) return;

  const parsed = GetRecommendationsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ msg: "Provide students data" });
    return;
  }

  const { students } = parsed.data;

  const results = students.map((s) => {
    let recommendations: string[];
    if (s.risk_level === "HIGH") {
      recommendations = [
        "Schedule advisor meeting this week",
        "Attend all upcoming classes",
        "Join a study group",
        "Book a tutoring session",
      ];
    } else if (s.risk_level === "MEDIUM") {
      recommendations = [
        "Review last 3 weeks of material",
        "Increase weekly study hours",
        "Ask questions during lectures",
      ];
    } else {
      recommendations = [
        "Explore advanced materials",
        "Mentor a peer",
        "Plan next semester courses",
      ];
    }
    return {
      student_id: s.student_id,
      course: s.course,
      risk_level: s.risk_level,
      recommendations,
    };
  });

  const data = GetRecommendationsResponse.parse(results);
  res.json(data);
});

export default router;

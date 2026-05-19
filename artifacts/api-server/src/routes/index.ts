import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import studentRouter from "./student";
import teacherRouter from "./teacher";
import adminRouter from "./admin";
import messagesRouter from "./messages";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/student", studentRouter);
router.use("/teacher", teacherRouter);
router.use("/admin", adminRouter);
router.use("/messages", messagesRouter);

export default router;

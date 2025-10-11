import express from "express";
import authRoutes from "./auth.route.js";
import clinicalNotesRoutes from "./clinicalNotes.route.js";
import labReportsRoutes from "./labReports.js";
import burnoutRoutes from "./burnout.js";
import patientsRoutes from "./patients.js";
import usersRoutes from "./users.js";
import analyticsRoutes from "./analytics.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/clinical-notes", clinicalNotesRoutes);
router.use("/lab-reports", labReportsRoutes);
router.use("/burnout", burnoutRoutes);
router.use("/patients", patientsRoutes);
router.use("/users", usersRoutes);
router.use("/analytics", analyticsRoutes);

export default router;

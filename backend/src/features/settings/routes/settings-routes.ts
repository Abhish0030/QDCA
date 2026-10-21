import { type IRouter, Router } from "express";
import multer from "multer";
import {
	changePasswordHandler,
	clearDataHandler,
	deactivateAccountHandler,
	deleteAccountHandler,
	deleteAvatarHandler,
	exportDataHandler,
	getSessionsHandler,
	getSettingsHandler,
	logoutOtherSessionsHandler,
	updateAiPreferencesHandler,
	updateNotificationsHandler,
	updatePrivacyHandler,
	updateProfileHandler,
	updateRecoveryHandler,
	uploadAvatarHandler,
} from "../controllers/settings-controller";

const router: IRouter = Router();
const avatarUpload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 8 * 1024 * 1024, files: 1 },
});

router.get("/", getSettingsHandler);
router.put("/profile", updateProfileHandler);
router.post("/avatar", avatarUpload.single("file"), uploadAvatarHandler);
router.delete("/avatar", deleteAvatarHandler);
router.put("/ai-preferences", updateAiPreferencesHandler);
router.put("/notifications", updateNotificationsHandler);
router.put("/privacy", updatePrivacyHandler);
router.post("/export", exportDataHandler);
router.post("/clear-data", clearDataHandler);
router.post("/security/change-password", changePasswordHandler);
router.get("/security/sessions", getSessionsHandler);
router.post("/security/logout-others", logoutOtherSessionsHandler);
router.put("/security/recovery", updateRecoveryHandler);
router.post("/account/deactivate", deactivateAccountHandler);
router.post("/account/delete", deleteAccountHandler);

export { router as settingsRouter };

import { type IRouter, Router } from "express";
import {
	dismissNotificationHandler,
	listNotificationsHandler,
	markNotificationsReadHandler,
} from "../controllers/notification-controller";

const router: IRouter = Router();

router.get("/", listNotificationsHandler);
router.patch("/read-all", markNotificationsReadHandler);
router.delete("/:id", dismissNotificationHandler);

export { router as notificationRouter };

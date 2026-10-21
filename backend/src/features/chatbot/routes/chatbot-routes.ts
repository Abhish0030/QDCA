import { type IRouter, Router } from "express";
import { sendChatbotMessageHandler } from "../controllers/chatbot-controller";

const router: IRouter = Router();

router.post("/message", sendChatbotMessageHandler);

export { router as chatbotRouter };

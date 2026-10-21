import { type IRouter, Router } from "express";
import multer from "multer";
import { listUploadHistoryHandler, uploadPdfHandler } from "../controllers/pdf-controller";

const router: IRouter = Router();
const allowedExtensions = new Set([".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".csv"]);
const allowedMimeTypes = new Set([
	"application/pdf",
	"image/png",
	"image/jpeg",
	"image/jpg",
	"application/msword",
	"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
	"text/csv",
	"application/csv",
	"application/vnd.ms-excel",
]);
const upload = multer({
	storage: multer.memoryStorage(),
	limits: { fileSize: 20 * 1024 * 1024, files: 1 },
	fileFilter: (_req, file, callback) => {
		const lowerName = file.originalname.toLowerCase();
		const extension = lowerName.includes(".") ? lowerName.slice(lowerName.lastIndexOf(".")) : "";
		const isSupported = allowedExtensions.has(extension) || allowedMimeTypes.has(file.mimetype);
		if (!isSupported) {
			callback(
				new Error("Supported files: PDF, PNG, JPG, JPEG, DOC, DOCX, and CSV."),
			);
			return;
		}
		callback(null, true);
	},
});

router.post("/pdf", upload.single("file"), uploadPdfHandler);
router.get("/", listUploadHistoryHandler);

export { router as uploadRouter };

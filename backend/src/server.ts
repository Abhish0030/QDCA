import { app } from "./app";
import { env } from "./config/env";
import { prisma } from "./database";
import { warmOllamaModelsOnStartup } from "./features/questions/services/ollama-warmup";

async function bootstrap() {
	try {
		await prisma.$connect();
		console.log("Database connected");
		await warmOllamaModelsOnStartup();

		app.listen(env.PORT, () => {
			console.log(`Server running on http://localhost:${env.PORT} [${env.NODE_ENV}]`);
		});
	} catch (error) {
		console.error("Failed to start server:", error);
		process.exit(1);
	}
}

bootstrap();

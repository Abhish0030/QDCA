import type { Express, Request, Response } from "express";
import swaggerUi from "swagger-ui-express";
import { openApiDocument } from "./openapi";

function getScalarReferenceHtml() {
	const scalarConfiguration = {
		metaData: {
			title: "API Reference",
			description: "Application API reference",
		},
		sources: [
			{
				title: "API",
				slug: "api",
				url: "/api/openapi.json",
			},
		],
		theme: "default",
	};

	return `<!doctype html>
<html>
  <head>
    <title>API Reference</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html,
      body,
      #app {
        height: 100%;
        margin: 0;
      }
    </style>
  </head>
  <body>
    <div id="app"></div>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
    <script>
      Scalar.createApiReference("#app", ${JSON.stringify(scalarConfiguration)});
    </script>
  </body>
</html>`;
}

export function registerSwaggerDocs(app: Express) {
	app.get("/api/openapi.json", (_req: Request, res: Response) => {
		res.json(openApiDocument);
	});

	app.get("/api/v1/docs", (_req: Request, res: Response) => {
		res.type("html").send(getScalarReferenceHtml());
	});

	app.use(
		"/api/docs",
		swaggerUi.serve,
		swaggerUi.setup(openApiDocument, {
			customSiteTitle: "Question Difficulty Classification API Docs",
			explorer: true,
			swaggerOptions: {
				urls: [
					{
						name: "Application API",
						url: "/api/openapi.json",
					},
				],
			},
		}),
	);
}

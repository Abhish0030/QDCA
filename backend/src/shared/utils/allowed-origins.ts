export function buildAllowedOrigins(frontendUrl: string, authUrl: string) {
	const origins = [toOrigin(frontendUrl), toOrigin(authUrl)];
	const frontendVariants = buildLocalOriginVariants(frontendUrl);

	return Array.from(new Set([...origins, ...frontendVariants].filter(isDefined)));
}

function buildLocalOriginVariants(value: string) {
	try {
		const url = new URL(value);
		const isLocalHost = url.hostname === "localhost" || url.hostname === "127.0.0.1";

		if (!isLocalHost) {
			return [];
		}

		const hosts = ["localhost", "127.0.0.1"];
		const ports = new Set([url.port || defaultPort(url.protocol), "5173", "5174", "4173", "4174"]);
		const variants: string[] = [];

		for (const host of hosts) {
			for (const port of ports) {
				const variant = new URL(url.toString());
				variant.hostname = host;
				variant.port = port;
				variants.push(variant.origin);
			}
		}

		return variants;
	} catch {
		return [];
	}
}

function defaultPort(protocol: string) {
	return protocol === "https:" ? "443" : "80";
}

function toOrigin(value: string) {
	try {
		return new URL(value).origin;
	} catch {
		return null;
	}
}

function isDefined(value: string | null): value is string {
	return Boolean(value);
}

export function isLoopbackOrigin(value: string) {
	try {
		const url = new URL(value);
		return (
			url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1")
		);
	} catch {
		return false;
	}
}

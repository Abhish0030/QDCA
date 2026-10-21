import nodemailer from "nodemailer";
import { env } from "../../config/env";

const smtpConfigured = Boolean(
	env.EMAIL_FROM && env.SMTP_HOST && env.SMTP_PORT && env.SMTP_USER && env.SMTP_PASS,
);

const transporter = smtpConfigured
	? nodemailer.createTransport({
			host: env.SMTP_HOST,
			port: env.SMTP_PORT,
			secure: env.SMTP_SECURE,
			auth: {
				user: env.SMTP_USER,
				pass: env.SMTP_PASS,
			},
		})
	: null;

export function isEmailConfigured() {
	return smtpConfigured;
}

export async function verifyEmailTransport() {
	if (!transporter) return false;
	await transporter.verify();
	return true;
}

export async function sendPasswordResetEmail(input: { to: string; name: string; url: string }) {
	if (!transporter || !env.EMAIL_FROM) {
		throw new Error("SMTP is not configured");
	}

	const safeName = escapeHtml(input.name || "there");
	const safeUrl = escapeHtml(input.url);

	await transporter.sendMail({
		from: env.EMAIL_FROM,
		to: input.to,
		subject: "Reset your QDCA password",
		text: `Hello ${input.name || "there"},\n\nReset your QDCA password using this link:\n${input.url}\n\nIf you did not request this, you can ignore this email.`,
		html: `<p>Hello ${safeName},</p><p>Reset your QDCA password using the link below:</p><p><a href="${safeUrl}">Reset password</a></p><p>If you did not request this, you can ignore this email.</p>`,
	});
}

function escapeHtml(value: string) {
	return value.replace(
		/[&<>'"]/g,
		(character) =>
			({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ??
			character,
	);
}

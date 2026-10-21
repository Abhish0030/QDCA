import { useState } from "react";
import { ChevronDown, HelpCircle, Mail, MessageCircle } from "lucide-react";
import { openChatbot } from "../api";

const FAQS = [
  {
    id: "classification",
    question: "How does the question classification work?",
    answer:
      "QDCA analyzes the structure, topic, and expected reasoning depth of each question, then maps it to a suitable difficulty level with supporting insights.",
  },
  {
    id: "pdf-formats",
    question: "What PDF formats are supported?",
    answer:
      "You can upload standard PDF files up to 20 MB. Text-based PDFs work best, while scanned PDFs may depend on OCR quality.",
  },
  {
    id: "accuracy",
    question: "How accurate is the classification?",
    answer:
      "The system is designed to provide strong academic difficulty estimates, but results should still be reviewed for important evaluation workflows.",
  },
  {
    id: "bulk",
    question: "Can I classify questions in bulk?",
    answer:
      "Yes. Use the Doc Analyzer page to upload a PDF and process multiple questions together.",
  },
  {
    id: "password",
    question: "How do I reset my password?",
    answer:
      "Use the Forgot Password option on the login page, or open Settings after signing in and update your password from the Security section.",
  },
  {
    id: "security",
    question: "Is my data stored securely?",
    answer:
      "Your account and question data are protected behind authenticated access. For extra safety, review active sessions and keep a strong password.",
  },
  {
    id: "export",
    question: "How do I export my reports?",
    answer:
      "You can export supported account data from Settings and use the available dashboard tools to review or copy report-related information.",
  },
];

function FaqItem({ faq, open, onToggle }) {
  return (
    <div className="border-b border-gray-100 last:border-b-0">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
        aria-expanded={open}
      >
        <span className="text-base font-semibold text-gray-900">{faq.question}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && <div className="px-5 pb-5 text-sm leading-6 text-gray-500">{faq.answer}</div>}
    </div>
  );
}

export default function HelpPage() {
  const [openFaqId, setOpenFaqId] = useState(FAQS[0]?.id ?? null);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Help & Support</h2>
        <p className="mt-1 text-sm text-gray-500">
          Find answers or reach out to our support team.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100">
              <Mail className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Email Support</h3>
              <p className="mt-1 text-sm text-gray-500">support@qdca.ai</p>
              <p className="mt-1 text-sm text-gray-400">Response within 24 hours</p>
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100">
              <MessageCircle className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Live Chat</h3>
              <p className="mt-1 text-sm text-gray-500">Available Mon-Fri, 9 AM - 6 PM IST</p>
              <button
                type="button"
                onClick={openChatbot}
                className="mt-4 inline-flex items-center rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Start Chat
              </button>
            </div>
          </div>
        </div>
      </div>

      <section className="rounded-[28px] border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-5 py-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-purple-100">
            <HelpCircle className="h-4 w-4 text-purple-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Frequently Asked Questions</h3>
        </div>

        <div>
          {FAQS.map((faq) => (
            <FaqItem
              key={faq.id}
              faq={faq}
              open={openFaqId === faq.id}
              onToggle={() => setOpenFaqId((current) => (current === faq.id ? null : faq.id))}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

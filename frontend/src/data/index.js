export const lineData = [
  { date: "May 10", value: 1000 },
  { date: "May 11", value: 2200 },
  { date: "May 12", value: 1500 },
  { date: "May 13", value: 2600 },
  { date: "May 14", value: 2200 },
  { date: "May 15", value: 3200 },
  { date: "May 16", value: 3700 },
];

import { DIFFICULTY_LEVELS, diffBadge } from "../utils/difficulty";

export const pieData = DIFFICULTY_LEVELS.map(level => ({
  name: level.label,
  value: 0,
  color: level.color,
}));

export const classifications = [
  { question: "Solve for x: 2x² + 5x − 3 = 0",     source: "Math",    difficulty: "Hard",   conf: 92, date: "May 16, 2025 10:30 AM" },
  { question: "What is photosynthesis?",              source: "Biology", difficulty: "Easy",   conf: 96, date: "May 16, 2025 09:45 AM" },
  { question: "Explain Newton's Second Law.",         source: "Physics", difficulty: "Medium", conf: 89, date: "May 16, 2025 09:15 AM" },
  { question: "Evaluate ∫(x² + 2x) dx",             source: "Math",    difficulty: "Hard",   conf: 91, date: "May 15, 2025 08:40 PM" },
  { question: "Identify the main idea of the text.", source: "English", difficulty: "Easy",   conf: 94, date: "May 15, 2025 07:20 PM" },
];

export const uploads = [
  { name: "JEE_Mock_Test_1.pdf",     questions: 120, date: "May 16, 2025 10:30 AM" },
  { name: "NEET_PYQ_2024.pdf",       questions: 200, date: "May 15, 2025 04:15 PM" },
  { name: "Board_Exam_Science.pdf",  questions: 150, date: "May 15, 2025 11:20 AM" },
  { name: "Practice_Set_Maths.pdf",  questions: 180, date: "May 14, 2025 09:45 AM" },
  { name: "Previous_Year_Paper.pdf", questions: 160, date: "May 13, 2025 06:30 PM" },
];

export const navItems = [
  { label: "Dashboard",         active: true },
  { label: "Activity" },
  { label: "Classify Question" },
  { label: "Doc Analyzer" },
  { label: "Question History" },
  { label: "Analytics" },
  { label: "Similar Questions" },
  { label: "Study Roadmap" },
  { label: "Settings" },
  { label: "Help & Support" },
];

export { diffBadge };

export const srcBadge = {
  Math:    "bg-purple-100 text-purple-700",
  Biology: "bg-teal-100 text-teal-700",
  Physics: "bg-blue-100 text-blue-700",
  English: "bg-pink-100 text-pink-700",
};

// ─── Mock data for admin dashboard (replace with real API calls) ──────────────

export const adminStats = [
  { label: "Total Users",        value: "1,284",  sub: "+12 this week",    subGreen: true  },
  { label: "Questions Classified",value: "10,248", sub: "12.5% this month", subGreen: true  },
  { label: "PDFs Uploaded",      value: "3,512",  sub: "+48 today",        subGreen: true  },
  { label: "Active Users Today", value: "947",    sub: "73.7% of total",   subGreen: true  },
  { label: "Model Accuracy",     value: "95.4%",  sub: "3.2% improvement", subGreen: true  },
];

export const platformActivity = [
  { date: "May 10", value: 1800 },
  { date: "May 11", value: 3200 },
  { date: "May 12", value: 2700 },
  { date: "May 13", value: 4100 },
  { date: "May 14", value: 3600 },
  { date: "May 15", value: 5200 },
  { date: "May 16", value: 6100 },
];

export const platformDifficulty = [
  { name: "Easy",   value: 4215, color: "#22c55e" },
  { name: "Medium", value: 3246, color: "#f59e0b" },
  { name: "Hard",   value: 2787, color: "#ef4444" },
];

export const recentSignups = [
  { id: 1,  name: "Priya Sharma",  email: "priya@school.edu",   role: "user",  joinedAt: "May 16, 2025" },
  { id: 2,  name: "Rahul Mehta",   email: "rahul@school.edu",   role: "user",  joinedAt: "May 15, 2025" },
  { id: 3,  name: "Sara Ahmed",    email: "sara@school.edu",    role: "user",  joinedAt: "May 15, 2025" },
  { id: 4,  name: "David Kim",     email: "david@school.edu",   role: "user",  joinedAt: "May 14, 2025" },
  { id: 5,  name: "Aisha Patel",   email: "aisha@school.edu",   role: "admin", joinedAt: "May 13, 2025" },
];

export const recentAdminActions = [
  { id: 1, admin: "John Doe", action: "Suspended account",      target: "rahul@school.edu",  time: "2 min ago"  },
  { id: 2, admin: "John Doe", action: "Promoted to admin",      target: "aisha@school.edu",  time: "15 min ago" },
  { id: 3, admin: "John Doe", action: "Overrode difficulty",    target: "Question #4821",    time: "1 hr ago"   },
  { id: 4, admin: "John Doe", action: "Deleted upload",         target: "bad_file.pdf",      time: "2 hr ago"   },
  { id: 5, admin: "John Doe", action: "Enabled maintenance mode", target: "Platform",        time: "3 hr ago"   },
];

export const mockUsers = [
  { id: 1,  name: "John Doe",     email: "john@example.com",   role: "admin", status: "active",    joinedAt: "Jan 12, 2025", lastActive: "Today"       },
  { id: 2,  name: "Priya Sharma", email: "priya@school.edu",   role: "user",  status: "active",    joinedAt: "Feb 03, 2025", lastActive: "Today"       },
  { id: 3,  name: "Rahul Mehta",  email: "rahul@school.edu",   role: "user",  status: "suspended", joinedAt: "Feb 18, 2025", lastActive: "May 10, 2025" },
  { id: 4,  name: "Sara Ahmed",   email: "sara@school.edu",    role: "user",  status: "active",    joinedAt: "Mar 01, 2025", lastActive: "Yesterday"   },
  { id: 5,  name: "David Kim",    email: "david@school.edu",   role: "user",  status: "active",    joinedAt: "Mar 14, 2025", lastActive: "Today"       },
  { id: 6,  name: "Aisha Patel",  email: "aisha@school.edu",   role: "admin", status: "active",    joinedAt: "Mar 22, 2025", lastActive: "Today"       },
  { id: 7,  name: "Carlos Ruiz",  email: "carlos@school.edu",  role: "user",  status: "active",    joinedAt: "Apr 05, 2025", lastActive: "May 15, 2025" },
  { id: 8,  name: "Nina Patel",   email: "nina@school.edu",    role: "user",  status: "suspended", joinedAt: "Apr 11, 2025", lastActive: "May 02, 2025" },
];

export const mockQuestions = [
  { id: 1, text: "Solve for x: 2x² + 5x − 3 = 0",                         difficulty: "Hard",   confidence: 92, submittedBy: "Priya Sharma", date: "May 16, 2025", flagged: false },
  { id: 2, text: "What is photosynthesis?",                                  difficulty: "Easy",   confidence: 96, submittedBy: "Sara Ahmed",   date: "May 16, 2025", flagged: false },
  { id: 3, text: "Explain Newton's Second Law of Motion.",                   difficulty: "Medium", confidence: 89, submittedBy: "David Kim",    date: "May 15, 2025", flagged: true  },
  { id: 4, text: "Evaluate ∫(x² + 2x) dx from 0 to 3",                     difficulty: "Hard",   confidence: 91, submittedBy: "Rahul Mehta",  date: "May 15, 2025", flagged: false },
  { id: 5, text: "Identify the main idea of the given passage.",             difficulty: "Easy",   confidence: 94, submittedBy: "Priya Sharma", date: "May 14, 2025", flagged: false },
  { id: 6, text: "What is the chemical formula for glucose?",               difficulty: "Easy",   confidence: 98, submittedBy: "Carlos Ruiz",  date: "May 14, 2025", flagged: false },
  { id: 7, text: "Derive the expression for kinetic energy.",                difficulty: "Medium", confidence: 87, submittedBy: "David Kim",    date: "May 13, 2025", flagged: true  },
  { id: 8, text: "Find the eigenvalues of matrix [[2,1],[1,2]].",            difficulty: "Hard",   confidence: 85, submittedBy: "Sara Ahmed",   date: "May 13, 2025", flagged: false },
];

export const mockUploads = [
  { id: 1, filename: "JEE_Mock_Test_1.pdf",      uploadedBy: "Priya Sharma", date: "May 16, 2025", questionsExtracted: 120, status: "done"       },
  { id: 2, filename: "NEET_PYQ_2024.pdf",         uploadedBy: "Sara Ahmed",   date: "May 15, 2025", questionsExtracted: 200, status: "done"       },
  { id: 3, filename: "Board_Exam_Science.pdf",    uploadedBy: "David Kim",    date: "May 15, 2025", questionsExtracted: 0,   status: "processing" },
  { id: 4, filename: "Practice_Set_Maths.pdf",   uploadedBy: "Rahul Mehta",  date: "May 14, 2025", questionsExtracted: 0,   status: "failed"     },
  { id: 5, filename: "Previous_Year_Paper.pdf",  uploadedBy: "Carlos Ruiz",  date: "May 13, 2025", questionsExtracted: 160, status: "done"       },
];

export const difficultyBySubject = [
  { subject: "Math",    easy: 20, medium: 45, hard: 35 },
  { subject: "Physics", easy: 30, medium: 40, hard: 30 },
  { subject: "Biology", easy: 60, medium: 30, hard: 10 },
  { subject: "English", easy: 70, medium: 25, hard: 5  },
  { subject: "Chem",    easy: 25, medium: 45, hard: 30 },
];

export const userGrowth = [
  { date: "Jan", count: 120 }, { date: "Feb", count: 280 },
  { date: "Mar", count: 520 }, { date: "Apr", count: 870 },
  { date: "May", count: 1284 },
];

export const confidenceTrend = [
  { date: "May 10", avg: 88 }, { date: "May 11", avg: 90 },
  { date: "May 12", avg: 87 }, { date: "May 13", avg: 92 },
  { date: "May 14", avg: 91 }, { date: "May 15", avg: 94 },
  { date: "May 16", avg: 95 },
];

export const peakHours = [
  { hour: "6AM", count: 45 },  { hour: "8AM", count: 120 },
  { hour: "10AM", count: 280 }, { hour: "12PM", count: 310 },
  { hour: "2PM", count: 260 },  { hour: "4PM", count: 340 },
  { hour: "6PM", count: 420 },  { hour: "8PM", count: 380 },
  { hour: "10PM", count: 190 },
];

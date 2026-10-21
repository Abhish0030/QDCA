import { apiBaseUrl } from "../../../lib/env.js";
import { requestJson } from "../../../lib/http.js";

const SUBJECT_DETECTION_TIMEOUT_MS = 35000;

export async function detectSubject(question) {
  try {
    const data = await requestJson(`${apiBaseUrl}/questions/subject-detection`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ questionText: question }),
      timeoutMs: SUBJECT_DETECTION_TIMEOUT_MS,
    });

    return {
      primarySubject: data.primarySubject,
      relatedSubjects: Array.isArray(data.relatedSubjects) ? data.relatedSubjects : [],
      topics: Array.isArray(data.topics) ? data.topics : [],
      subtopics: Array.isArray(data.subtopics) ? data.subtopics : [],
      confidence: Number(data.confidence || 0),
    };
  } catch {
    return detectSubjectLocally(question);
  }
}

function detectSubjectLocally(question) {
  const normalized = String(question || "").toLowerCase();
  const match = SUBJECT_RULES.find((rule) =>
    rule.keywords.some((keyword) => normalized.includes(keyword)),
  );

  return {
    primarySubject: match?.subject ?? "General Knowledge",
    relatedSubjects: match?.relatedSubjects ?? [],
    topics: match?.topics ?? ["General Reasoning"],
    subtopics: [],
    confidence: match ? 72 : 55,
  };
}

const SUBJECT_RULES = [
  {
    subject: "Computer Science",
    keywords: [
      "algorithm",
      "array",
      "binary",
      "c++",
      "code",
      "computer",
      "data structure",
      "graph",
      "hash",
      "java",
      "linked list",
      "list",
      "program",
      "python",
      "queue",
      "stack",
      "tree",
    ],
    topics: ["Algorithms", "Data Structures", "Programming"],
    relatedSubjects: ["Mathematics", "Software Engineering"],
  },
  {
    subject: "Mathematics",
    keywords: ["algebra", "calculate", "equation", "geometry", "integral", "matrix", "probability", "solve"],
    topics: ["Algebra", "Calculus", "Problem Solving"],
    relatedSubjects: ["Statistics", "Physics"],
  },
  {
    subject: "Physics",
    keywords: ["acceleration", "electric", "energy", "force", "gravity", "motion", "newton", "velocity"],
    topics: ["Mechanics", "Energy", "Physical Laws"],
    relatedSubjects: ["Mathematics", "Engineering"],
  },
  {
    subject: "Biology",
    keywords: ["cell", "dna", "evolution", "gene", "organism", "photosynthesis", "protein"],
    topics: ["Life Sciences", "Genetics", "Cell Biology"],
    relatedSubjects: ["Chemistry", "Medicine"],
  },
  {
    subject: "Chemistry",
    keywords: ["acid", "atom", "chemical", "compound", "element", "molecule", "reaction"],
    topics: ["Chemical Reactions", "Atomic Structure", "Compounds"],
    relatedSubjects: ["Physics", "Biology"],
  },
];

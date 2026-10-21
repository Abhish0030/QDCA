import { useState, useRef } from "react";
import { Upload, FileText, CheckCircle2, XCircle, Loader2, X } from "lucide-react";
import { uploadPDF } from "../api";
import ClassificationReason from "../components/ClassificationReason";
import ClassificationActionBar from "../components/ClassificationActionBar";
import SubjectChip from "../features/subject-detection/components/SubjectChip.jsx";
import TopicChip from "../features/subject-detection/components/TopicChip.jsx";

const ACCEPTED_EXTENSIONS = [".pdf", ".png", ".jpg", ".jpeg", ".doc", ".docx", ".csv"];
const ACCEPTED_MIME_TYPES = new Set([
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

function difficultyBadge(difficulty) {
  return {
    "Very Easy": "bg-emerald-50 text-emerald-700 ring-emerald-100",
    Easy: "bg-green-50 text-green-700 ring-green-100",
    Medium: "bg-amber-50 text-amber-700 ring-amber-100",
    Hard: "bg-orange-50 text-orange-700 ring-orange-100",
    Expert: "bg-red-50 text-red-700 ring-red-100",
  }[difficulty] || "bg-gray-50 text-gray-700 ring-gray-100";
}

export default function PDFAnalyzerPage({ onSuccess }) {
  const [dragging, setDragging]   = useState(false);
  const [uploads, setUploads]     = useState([]);
  const fileRef                   = useRef(null);

  function isSupportedFile(file) {
    const lowerName = file.name.toLowerCase();
    return ACCEPTED_EXTENSIONS.some(extension => lowerName.endsWith(extension)) || ACCEPTED_MIME_TYPES.has(file.type);
  }

  function addUpload(file) {
    const id = Date.now() + Math.random();
    setUploads(u => [...u, {
      id,
      name: file.name,
      status: "uploading",
      questions: null,
      classifiedQuestions: 0,
      classificationFailures: 0,
      extractedQuestions: [],
      classifications: [],
      showResults: false,
      error: null,
    }]);
    uploadPDF(file)
      .then(data => {
        setUploads(u => u.map(x => x.id === id
          ? {
              ...x,
              status: "done",
              questions: data.upload.questions,
              classifiedQuestions: data.upload.classifiedQuestions ?? 0,
              classificationFailures: data.upload.classificationFailures ?? 0,
              indexedChunks: data.upload.indexedChunks,
              extractedQuestions: Array.isArray(data.questions) ? data.questions : [],
              classifications: Array.isArray(data.classifications) ? data.classifications : [],
              showResults: Array.isArray(data.classifications) && data.classifications.length > 0,
            }
          : x
        ));
        onSuccess?.();
      })
      .catch(error => {
        setUploads(u => u.map(x => x.id === id
          ? { ...x, status: "error", error: error?.message || "Upload failed" }
          : x
        ));
      });
  }

  function handleFiles(files) {
    Array.from(files).forEach(f => {
      if (isSupportedFile(f)) {
        addUpload(f);
        return;
      }

      setUploads(u => [...u, {
        id: Date.now() + Math.random(),
        name: f.name,
        status: "error",
        questions: null,
        classifiedQuestions: 0,
        classificationFailures: 0,
        extractedQuestions: [],
        classifications: [],
        showResults: false,
        error: "Supported files: PDF, PNG, JPG, JPEG, DOC, DOCX, and CSV.",
      }]);
    });
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    handleFiles(e.dataTransfer.files);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Doc Analyzer</h2>
        <p className="text-sm text-gray-400 mt-1">Upload PDFs, images, Word docs, or CSV files to extract questions and ground future classifications with RAG.</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileRef.current?.click()}
        className={`
          bg-white rounded-2xl border-2 border-dashed p-12 flex flex-col items-center justify-center text-center
          cursor-pointer transition-all
          ${dragging ? "border-purple-400 bg-purple-50" : "border-gray-200 hover:border-purple-300 hover:bg-purple-50/40"}
        `}
      >
        <div className="w-16 h-16 rounded-2xl bg-purple-100 flex items-center justify-center mb-4">
          <Upload className="w-8 h-8 text-purple-500" />
        </div>
        <p className="text-sm font-semibold text-gray-700 mb-1">
          {dragging ? "Drop your file here" : "Drag & drop files here"}
        </p>
        <p className="text-xs text-gray-400">or click to browse — PDF, PNG, JPG, DOC, DOCX, CSV, up to 20 MB each</p>
        <input ref={fileRef} type="file" accept={ACCEPTED_EXTENSIONS.join(",")} multiple className="hidden" onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Upload list */}
      {uploads.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="text-sm font-semibold text-gray-800">Upload Queue</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {uploads.map(u => (
              <div key={u.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-9 h-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-red-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">{u.name}</p>
                  {u.status === "done" && (
                    <div className="mt-0.5 space-y-2">
                      <p className="text-xs text-gray-400">
                        {u.questions} questions extracted · {u.classifiedQuestions ?? 0} classified · {u.indexedChunks ?? 0} RAG chunks indexed
                      </p>
                      {u.classifiedQuestions > 0 ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setUploads(current => current.map(item => item.id === u.id ? { ...item, showResults: !item.showResults } : item))}
                            className="inline-flex items-center justify-center rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-purple-700"
                          >
                            {u.showResults ? "Hide Results" : "Show Results"}
                          </button>
                          {u.classifications?.[0] && (
                            <div className="min-w-0 flex-1 text-xs text-gray-500">
                              <p className="truncate">
                                First classified: {u.classifications[0].question}
                              </p>
                              <p className="mt-0.5 text-[11px] text-purple-600">
                                {u.classifications[0].difficulty} · {Math.round(Number(u.classifications[0].confidence ?? 0))}% confidence
                              </p>
                            </div>
                          )}
                        </div>
                      ) : u.questions > 0 ? (
                        <p className="text-xs text-amber-600">
                          Questions were extracted but could not be classified yet. Check that the LLM backend is running.
                        </p>
                      ) : (
                        <p className="text-xs text-amber-600">
                          No question-like text was detected in this file. Try a clearer source document or better-quality scan.
                        </p>
                      )}
                      {u.classificationFailures > 0 && (
                        <p className="text-xs text-amber-600">
                          {u.classificationFailures} question{u.classificationFailures === 1 ? "" : "s"} could not be classified.
                        </p>
                      )}
                      {u.showResults && u.classifications?.length > 0 && (
                        <div className="mt-3 space-y-3 rounded-2xl border border-purple-100 bg-purple-50/30 p-3">
                          {u.classifications.map((item, index) => (
                            <div key={`${u.id}-${index}`} className="space-y-3 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                              <div className="flex flex-wrap items-start justify-between gap-3">
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-semibold text-gray-800">{item.question}</p>
                                  <div className="mt-2 flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${difficultyBadge(item.difficulty)}`}>
                                      {item.difficulty}
                                    </span>
                                    <span className="text-xs font-medium text-purple-600">
                                      {Math.round(Number(item.confidence ?? 0))}% confidence
                                    </span>
                                  </div>
                                </div>
                              </div>

                              <ClassificationReason result={item} />

                              <ClassificationActionBar
                                question={item.question}
                                difficulty={item.difficulty}
                                model={item.model}
                              />

                              {item.subjectDetection && (
                                <div className="space-y-2 rounded-2xl border border-gray-100 bg-gray-50/70 p-3">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Primary Subject</span>
                                    <SubjectChip label={item.subjectDetection.primarySubject} variant="primary" />
                                    <span className="text-[11px] text-gray-500">
                                      {Math.round(Number(item.subjectDetection.confidence ?? 0))}% subject confidence
                                    </span>
                                  </div>

                                  {item.subjectDetection.relatedSubjects?.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Related</span>
                                      {item.subjectDetection.relatedSubjects.map(subject => (
                                        <SubjectChip key={`${item.question}-${subject}`} label={subject} />
                                      ))}
                                    </div>
                                  )}

                                  {item.subjectDetection.topics?.length > 0 && (
                                    <div className="flex flex-wrap items-center gap-2">
                                      <span className="text-[11px] font-semibold uppercase tracking-wide text-gray-400">Topics</span>
                                      {item.subjectDetection.topics.map(topic => (
                                        <TopicChip key={`${item.question}-${topic}`} label={topic} />
                                      ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {u.status === "error" && (
                    <p className="text-xs text-red-400 mt-0.5">{u.error}</p>
                  )}
                  {u.status === "uploading" && (
                    <p className="text-xs text-gray-400 mt-0.5">Uploading…</p>
                  )}
                </div>
                <div className="shrink-0">
                  {u.status === "uploading" && <Loader2 className="w-4 h-4 text-purple-500 animate-spin" />}
                  {u.status === "done"      && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {u.status === "error"     && <XCircle className="w-5 h-5 text-red-400" />}
                </div>
                <button onClick={() => setUploads(u2 => u2.filter(x => x.id !== u.id))} className="shrink-0 p-1 hover:bg-gray-100 rounded-lg transition-colors">
                  <X className="w-3.5 h-3.5 text-gray-300" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tips */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <h4 className="text-sm font-semibold text-gray-700 mb-3">Tips for best results</h4>
        <ul className="space-y-2 text-sm text-gray-500">
          {[
            "Text-based PDFs, DOCX files, and CSVs are fastest, while scanned images may take longer because OCR is used when needed",
            "One uploaded file can contain multiple question sets",
            "Supported: PDF, PNG, JPG, DOC, DOCX, and CSV for exams, practice sets, and notes",
            "Max file size: 20 MB per file",
          ].map((tip, i) => (
            <li key={i} className="flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-400 mt-2 shrink-0" />
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

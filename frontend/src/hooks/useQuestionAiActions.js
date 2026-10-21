import { useEffect, useState } from "react";
import { changeQuestionDifficulty, generateQuestionAnswer, streamQuestionAnswer } from "../api";
import { readSessionCache, writeSessionCache } from "../utils/cache";
import { DIFFICULTY_LABELS } from "../utils/difficulty";
import { toast } from "../lib/toast";

const ANSWER_CACHE_PREFIX = "qdca:ai-answer";
const CONVERSION_CACHE_PREFIX = "qdca:ai-conversion";
const answerRequests = new Map();
const conversionRequests = new Map();

function makeCacheKey(parts) {
  return parts.map(part => encodeURIComponent(String(part || ""))).join("::");
}

function getAlternateDifficulty(currentDifficulty) {
  return DIFFICULTY_LABELS.find(level => level !== currentDifficulty) || "Medium";
}

function normalizeQuestion(value) {
  return String(value || "").trim();
}

export default function useQuestionAiActions({ question, difficulty, model = "auto" }) {
  const normalizedQuestion = normalizeQuestion(question);
  const normalizedDifficulty = String(difficulty || "Medium");
  const [answerData, setAnswerData] = useState(null);
  const [answerError, setAnswerError] = useState("");
  const [answerLoading, setAnswerLoading] = useState(false);
  const [answerStreamText, setAnswerStreamText] = useState("");
  const [answerStage, setAnswerStage] = useState("idle");
  const [conversionData, setConversionData] = useState(null);
  const [conversionError, setConversionError] = useState("");
  const [conversionLoading, setConversionLoading] = useState(false);
  const [targetDifficulty, setTargetDifficulty] = useState(getAlternateDifficulty(normalizedDifficulty));

  useEffect(() => {
    setAnswerData(null);
    setAnswerError("");
    setAnswerStreamText("");
    setAnswerStage("idle");
    setConversionData(null);
    setConversionError("");
    setTargetDifficulty(previous =>
      previous && previous !== normalizedDifficulty ? previous : getAlternateDifficulty(normalizedDifficulty),
    );
  }, [normalizedQuestion, normalizedDifficulty]);

  async function loadAnswer({ force = false } = {}) {
    if (!normalizedQuestion) return null;

    const cacheKey = makeCacheKey([ANSWER_CACHE_PREFIX, normalizedQuestion, model]);
    if (!force) {
      const cached = readSessionCache(cacheKey, 30 * 60 * 1000);
      if (cached) {
        setAnswerData(cached);
        setAnswerError("");
        return cached;
      }
    }

    const existingRequest = answerRequests.get(cacheKey);
    if (existingRequest && !force) {
      setAnswerLoading(true);
      try {
        const sharedResult = await existingRequest;
        setAnswerData(sharedResult);
        setAnswerError("");
        return sharedResult;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Answer generation failed.";
        setAnswerError(message);
        throw error;
      } finally {
        setAnswerLoading(false);
      }
    }

    setAnswerLoading(true);
    setAnswerError("");
    setAnswerStreamText("");
    setAnswerStage("starting");
    const request = streamQuestionAnswer(normalizedQuestion, {
      model,
      onEvent: (event) => {
        if (event?.type === "status") {
          setAnswerStage(event.stage || "working");
          return;
        }

        if (event?.type === "chunk" && typeof event.chunk === "string") {
          setAnswerStage(event.stage || "drafting");
          setAnswerStreamText(previous => previous + event.chunk);
        }
      },
    }).catch(async (streamError) => {
      const fallbackData = await generateQuestionAnswer(normalizedQuestion, model);
      setAnswerStage("fallback");
      return fallbackData;
    });
    answerRequests.set(cacheKey, request);

    try {
      const data = await request;
      writeSessionCache(cacheKey, data);
      setAnswerData(data);
      setAnswerStage("completed");
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Answer generation failed.";
      setAnswerError(message);
      setAnswerStage("error");
      throw error;
    } finally {
      answerRequests.delete(cacheKey);
      setAnswerLoading(false);
    }
  }

  async function loadDifficultyChange(nextDifficulty = targetDifficulty, { force = false } = {}) {
    if (!normalizedQuestion || !nextDifficulty || nextDifficulty === normalizedDifficulty) return null;

    const cacheKey = makeCacheKey([
      CONVERSION_CACHE_PREFIX,
      normalizedQuestion,
      normalizedDifficulty,
      nextDifficulty,
      model,
    ]);

    if (!force) {
      const cached = readSessionCache(cacheKey, 30 * 60 * 1000);
      if (cached) {
        setConversionData(cached);
        setConversionError("");
        return cached;
      }
    }

    const existingRequest = conversionRequests.get(cacheKey);
    if (existingRequest && !force) {
      setConversionLoading(true);
      try {
        const sharedResult = await existingRequest;
        setConversionData(sharedResult);
        setConversionError("");
        return sharedResult;
      } catch (error) {
        const message = error instanceof Error ? error.message : "Difficulty change failed.";
        setConversionError(message);
        throw error;
      } finally {
        setConversionLoading(false);
      }
    }

    setConversionLoading(true);
    setConversionError("");
    const request = changeQuestionDifficulty({
      question: normalizedQuestion,
      originalDifficulty: normalizedDifficulty,
      newDifficulty: nextDifficulty,
      model,
    });
    conversionRequests.set(cacheKey, request);

    try {
      const data = await request;
      writeSessionCache(cacheKey, data);
      setConversionData(data);
      return data;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Difficulty change failed.";
      setConversionError(message);
      throw error;
    } finally {
      conversionRequests.delete(cacheKey);
      setConversionLoading(false);
    }
  }

  async function copyText(value, successMessage) {
    try {
      await navigator.clipboard.writeText(value);
      toast.success(successMessage);
    } catch {
      toast.error("Could not copy to clipboard.");
    }
  }

  function updateTargetDifficulty(nextDifficulty) {
    setTargetDifficulty(nextDifficulty);
    setConversionError("");
    setConversionData(previous => previous?.newDifficulty === nextDifficulty ? previous : null);
  }

  return {
    answerData,
    answerError,
    answerLoading,
    answerStreamText,
    answerStage,
    conversionData,
    conversionError,
    conversionLoading,
    targetDifficulty,
    setTargetDifficulty: updateTargetDifficulty,
    loadAnswer,
    loadDifficultyChange,
    copyAnswer: () => copyText(formatAnswerCopy(answerData), "Answer copied."),
    copyConversion: () => copyText(formatConversionCopy(conversionData), "Converted question copied."),
  };
}

function formatAnswerCopy(answerData) {
  if (!answerData) return "";

  return [
    `Question: ${answerData.question}`,
    "",
    "Correct Answer:",
    answerData.correctAnswer,
    "",
    "Step-by-step Explanation:",
    ...answerData.stepByStepExplanation.map((step, index) => `${index + 1}. ${step}`),
    "",
    "Key Concepts:",
    answerData.keyConcepts.join(", "),
    "",
    "Final Summary:",
    answerData.finalSummary,
  ].join("\n");
}

function formatConversionCopy(conversionData) {
  if (!conversionData) return "";

  return [
    `Original Difficulty: ${conversionData.originalDifficulty}`,
    `New Difficulty: ${conversionData.newDifficulty}`,
    "",
    "Original Question:",
    conversionData.originalQuestion,
    "",
    "Converted Question:",
    conversionData.convertedQuestion,
    "",
    "AI Explanation:",
    conversionData.explanation,
  ].join("\n");
}

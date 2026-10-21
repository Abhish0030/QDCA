import { useCallback, useEffect, useRef, useState } from "react";
import { getStudyRoadmapDashboard } from "../services/studyRoadmapService";

export function useStudyRoadmap() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const requestId = useRef(0);

  const loadRoadmap = useCallback(async ({ force = false } = {}) => {
    const currentRequest = ++requestId.current;
    setLoading(true);
    setError("");
    try {
      const nextData = await getStudyRoadmapDashboard({ force });
      if (currentRequest === requestId.current) setData(nextData);
    } catch (loadError) {
      if (currentRequest === requestId.current) {
        setError(loadError instanceof Error ? loadError.message : "Could not generate your study roadmap.");
      }
    } finally {
      if (currentRequest === requestId.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRoadmap();
    return () => {
      requestId.current += 1;
    };
  }, [loadRoadmap]);

  const regenerate = useCallback(() => loadRoadmap({ force: true }), [loadRoadmap]);

  return { data, loading, error, regenerate };
}

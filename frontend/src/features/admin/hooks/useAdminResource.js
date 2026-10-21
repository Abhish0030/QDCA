import { useCallback, useEffect, useMemo, useState } from "react";

export function useAdminResource(loader, fallbackValue, deps = []) {
  const fallback = useMemo(
    () => (typeof fallbackValue === "function" ? fallbackValue : () => fallbackValue),
    [fallbackValue],
  );
  const dependencyKey = useMemo(() => JSON.stringify(deps), [deps]);
  const [data, setData] = useState(fallback());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const result = await loader();
      setData(result);
      setError("");
    } catch (loadError) {
      setData(fallback(loadError));
      setError(loadError instanceof Error ? loadError.message : "Could not load admin data.");
    } finally {
      setLoading(false);
    }
  }, [fallback, loader]);

  useEffect(() => {
    refresh();
  }, [dependencyKey, refresh]);

  return {
    data,
    loading,
    error,
    refresh,
    setData,
  };
}

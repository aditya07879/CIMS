import { useState, useCallback } from 'react';

export const useAsync = (asyncFn) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(async (...args) => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn(...args);
      return result;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  return { loading, error, execute };
};

export const usePagination = (initialPage = 1) => {
  const [page, setPage] = useState(initialPage);
  const nextPage = () => setPage(p => p + 1);
  const prevPage = () => setPage(p => Math.max(1, p - 1));
  const goToPage = (n) => setPage(n);
  return { page, nextPage, prevPage, goToPage, setPage };
};

import { useState, useEffect, useCallback } from 'react';

export const useFetch = (url, options = {}) => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(url, options);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            setData(result);
            return result;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, [url, options]);

    useEffect(() => {
        if (options.immediate !== false) {
            fetchData();
        }
    }, [fetchData, options.immediate]);

    return { data, loading, error, refetch: fetchData };
};

export default useFetch;

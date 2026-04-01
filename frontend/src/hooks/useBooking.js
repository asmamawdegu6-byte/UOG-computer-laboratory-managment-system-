import { useState, useCallback } from 'react';
import bookingService from '../services/bookingService';

export const useBooking = () => {
    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBookings = useCallback(async (filters = {}) => {
        setLoading(true);
        setError(null);
        try {
            const data = await bookingService.getBookings(filters);
            setBookings(data);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const createBooking = useCallback(async (bookingData) => {
        setLoading(true);
        setError(null);
        try {
            const data = await bookingService.createBooking(bookingData);
            setBookings((prev) => [...prev, data]);
            return data;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const cancelBooking = useCallback(async (bookingId) => {
        setLoading(true);
        setError(null);
        try {
            await bookingService.cancelBooking(bookingId);
            setBookings((prev) =>
                prev.map((b) =>
                    b.id === bookingId ? { ...b, status: 'cancelled' } : b
                )
            );
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    return {
        bookings,
        loading,
        error,
        fetchBookings,
        createBooking,
        cancelBooking,
    };
};

export default useBooking;

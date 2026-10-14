import { useState, useCallback } from 'react';
import api from '../services/api';

export default function useTryOn() {
  const [job, setJob] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = useCallback(async (userPhotoFile, garmentPhotoFile) => {
    try {
      setSubmitting(true);
      setError(null);
      const formData = new FormData();
      formData.append('userPhoto', userPhotoFile);
      formData.append('garmentPhoto', garmentPhotoFile);
      const { data } = await api.post('/try-on', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setJob(data.data.job);
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit try-on request.');
      throw err;
    } finally {
      setSubmitting(false);
    }
  }, []);

  return { job, submitting, error, submit };
}

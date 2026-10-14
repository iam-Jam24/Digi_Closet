import { useState, useCallback, useEffect } from 'react';
import api from '../services/api';

export default function useOutfits() {
  const [saved, setSaved] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recommending, setRecommending] = useState(false);
  const [error, setError] = useState(null);

  const fetchSaved = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/outfits/saved');
      setSaved(data.data.outfits);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load saved outfits.');
    } finally {
      setLoading(false);
    }
  }, []);

  const recommend = useCallback(async (payload) => {
    try {
      setRecommending(true);
      setError(null);
      const { data } = await api.post('/outfits/recommend', payload);
      return data.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to generate recommendations.');
      throw err;
    } finally {
      setRecommending(false);
    }
  }, []);

  const saveOutfit = useCallback(async (outfit) => {
    const { data } = await api.post('/outfits/saved', outfit);
    setSaved((prev) => [data.data.outfit, ...prev]);
    return data;
  }, []);

  const toggleFavorite = useCallback(async (id) => {
    const { data } = await api.put(`/outfits/saved/${id}/favorite`);
    setSaved((prev) => prev.map((o) => (o._id === id ? data.data.outfit : o)));
  }, []);

  const deleteOutfit = useCallback(async (id) => {
    await api.delete(`/outfits/saved/${id}`);
    setSaved((prev) => prev.filter((o) => o._id !== id));
  }, []);

  useEffect(() => { fetchSaved(); }, [fetchSaved]);

  return { saved, loading, recommending, error, recommend, saveOutfit, toggleFavorite, deleteOutfit, fetchSaved };
}

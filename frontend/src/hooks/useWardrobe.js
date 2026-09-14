import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function useWardrobe() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const fetchItems = useCallback(async (category) => {
    try {
      setLoading(true);
      setError(null);
      const params = category ? { category } : {};
      const { data } = await api.get('/wardrobe', { params });
      setItems(data.data.items);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load wardrobe.');
    } finally {
      setLoading(false);
    }
  }, []);

  const addItem = useCallback(async (itemData) => {
    try {
      setAdding(true);
      setError(null);
      const { data } = await api.post('/wardrobe', itemData);
      setItems((prev) => [data.data.item, ...prev]);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to add item.';
      setError(message);
      throw err;
    } finally {
      setAdding(false);
    }
  }, []);

  const deleteItem = useCallback(async (id) => {
    try {
      setError(null);
      await api.delete(`/wardrobe/${id}`);
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item.');
      throw err;
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, adding, addItem, deleteItem, fetchItems };
}

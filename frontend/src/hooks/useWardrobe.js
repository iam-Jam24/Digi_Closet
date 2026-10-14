import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function useWardrobe() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);

  const fetchItems = useCallback(async (params = {}) => {
    try {
      setLoading(true);
      setError(null);
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

  const updateItem = useCallback(async (id, itemData) => {
    try {
      setError(null);
      const { data } = await api.put(`/wardrobe/${id}`, itemData);
      setItems((prev) => prev.map((i) => (i._id === id ? data.data.item : i)));
      return data;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update item.');
      throw err;
    }
  }, []);

  const deleteItem = useCallback(async (id) => {
    try {
      setError(null);
      await api.delete(`/wardrobe/${id}`);
      setItems((prev) => prev.filter((item) => item._id !== id));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete item.');
      throw err;
    }
  }, []);

  const uploadImage = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post('/wardrobe/upload-image', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  }, []);

  const classifyImage = useCallback(async (file) => {
    const formData = new FormData();
    formData.append('image', file);
    const { data } = await api.post('/wardrobe/classify', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data.suggestion;
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return { items, loading, error, adding, addItem, updateItem, deleteItem, uploadImage, classifyImage, fetchItems };
}

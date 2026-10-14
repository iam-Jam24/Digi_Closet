import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [isDevCatalog, setIsDevCatalog] = useState(true);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProducts = useCallback(async (filters = {}) => {
    try {
      setLoading(true);
      setError(null);

      const params = {};
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          params[key] = value;
        }
      });

      const { data } = await api.get('/products', { params });
      setProducts(data.data.products);
      setIsDevCatalog(Boolean(data.data.isDevCatalog));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  }, []);

  const saveProduct = useCallback(async (productId) => {
    const { data } = await api.post('/products/saved', { productId });
    return data;
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  return { products, isDevCatalog, loading, error, fetchProducts, saveProduct };
}

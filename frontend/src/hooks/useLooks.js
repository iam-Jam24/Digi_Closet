import { useState, useEffect, useCallback } from 'react';
import api, { getErrorMessage } from '../services/api';

// The person photo goes up as a file the first time; "Generate again" sends
// `sourceLookId` instead so the server reuses the stored photo.
function toRequestBody(data, photoFile) {
  if (!photoFile) return data;
  const formData = new FormData();
  formData.append('photo', photoFile);
  formData.append('data', JSON.stringify(data));
  return formData;
}

/**
 * Saved looks for one feature ('try-on' or 'makeover') plus the generation
 * calls. Generation methods throw so pages can show the error in context.
 */
export default function useLooks(feature) {
  const [savedLooks, setSavedLooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // { tryOn, makeover }: { available, provider, reason }. null until loaded
  // (or if the check itself failed, in which case generation is still allowed
  // and the server's own error is shown).
  const [capabilities, setCapabilities] = useState(null);

  const fetchLooks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/looks', { params: { feature } });
      setSavedLooks(data.data.looks);
    } catch (err) {
      setError(getErrorMessage(err, 'Failed to load your saved looks.'));
    } finally {
      setLoading(false);
    }
  }, [feature]);

  const fetchCapabilities = useCallback(async () => {
    try {
      const { data } = await api.get('/looks/capabilities');
      setCapabilities(data.data);
      return data.data;
    } catch {
      setCapabilities(null);
      return null;
    }
  }, []);

  useEffect(() => {
    fetchLooks();
    fetchCapabilities();
  }, [fetchLooks, fetchCapabilities]);

  // garmentFiles: uploaded clothes [{ file, name, category }]. reuseGarments
  // asks the server to reuse the clothes uploaded for sourceLookId.
  const generateTryOn = useCallback(async ({ photoFile, itemIds = [], garmentFiles = [], sourceLookId, reuseGarments }) => {
    const payload = { itemIds, sourceLookId, reuseGarments, garments: garmentFiles.map(({ name, category }) => ({ name, category })) };
    let body = toRequestBody(payload, photoFile);
    if (garmentFiles.length) {
      if (!(body instanceof FormData)) {
        body = new FormData();
        body.append('data', JSON.stringify(payload));
      }
      garmentFiles.forEach(({ file }) => body.append('garments', file));
    }
    const { data } = await api.post('/looks/try-on', body);
    return data.data.look;
  }, []);

  const analyzeMakeover = useCallback(async (photoFile) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    const { data } = await api.post('/looks/makeover/analyze', formData);
    return data.data;
  }, []);

  const generateMakeover = useCallback(async ({ photoFile, style, sourceLookId }) => {
    const { data } = await api.post('/looks/makeover', toRequestBody({ style, sourceLookId }, photoFile));
    return data.data.look;
  }, []);

  // Keeps the saved list in step with the look's new saved state.
  const updateLook = useCallback(async (id, changes) => {
    const { data } = await api.patch(`/looks/${id}`, changes);
    const look = data.data.look;
    setSavedLooks((prev) => {
      const rest = prev.filter((l) => l._id !== id);
      return look.saved ? [look, ...rest].sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : rest;
    });
    return look;
  }, []);

  const deleteLook = useCallback(async (id) => {
    await api.delete(`/looks/${id}`);
    setSavedLooks((prev) => prev.filter((l) => l._id !== id));
  }, []);

  return { savedLooks, loading, error, fetchLooks, capabilities, fetchCapabilities, generateTryOn, analyzeMakeover, generateMakeover, updateLook, deleteLook };
}

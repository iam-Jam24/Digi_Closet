import { useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export default function useProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/profile');
      setProfile(data.data.profile);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load profile.');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateProfile = useCallback(async (profileData) => {
    try {
      setSaving(true);
      setError(null);
      const { data } = await api.put('/profile', profileData);
      setProfile(data.data.profile);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile.';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return { profile, loading, error, saving, updateProfile, refetch: fetchProfile };
}

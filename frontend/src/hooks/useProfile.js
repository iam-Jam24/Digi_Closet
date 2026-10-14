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
      setProfile(data?.data?.profile || data?.profile || null);
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
      setProfile(data?.data?.profile || data?.profile || null);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to update profile.';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const deleteProfileData = useCallback(async () => {
    try {
      setSaving(true);
      setError(null);
      const { data } = await api.delete('/profile');
      setProfile(data?.data?.profile || data?.profile || null);
      return data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete profile data.';
      setError(message);
      throw err;
    } finally {
      setSaving(false);
    }
  }, []);

  const exportData = useCallback(async () => {
    const { data } = await api.get('/profile/export');
    return data?.data || data;
  }, []);

  const deleteAccount = useCallback(async () => {
    const { data } = await api.delete('/profile/account');
    return data;
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  return {
    profile,
    loading,
    error,
    saving,
    updateProfile,
    deleteProfileData,
    exportData,
    deleteAccount,
    refetch: fetchProfile,
  };
}

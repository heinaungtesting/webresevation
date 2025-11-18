'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  ArrowLeft,
  Calendar,
} from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';

interface SportCenter {
  id: string;
  name_en: string;
  name_ja: string;
  address_en: string;
  address_ja: string;
  station_en?: string;
  station_ja?: string;
  latitude?: number;
  longitude?: number;
  image_url?: string;
  created_at: string;
  _count?: {
    sessions: number;
  };
}

export default function AdminSportCentersPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [sportCenters, setSportCenters] = useState<SportCenter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name_en: '',
    name_ja: '',
    address_en: '',
    address_ja: '',
    station_en: '',
    station_ja: '',
    latitude: '',
    longitude: '',
    image_url: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSportCenters();
    }
  }, [user]);

  const fetchSportCenters = async () => {
    try {
      const response = await fetch('/api/admin/sport-centers');
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch sport centers');

      const data = await response.json();
      setSportCenters(data);
    } catch (err: any) {
      console.error('Error fetching sport centers:', err);
      setError(err.message || 'Failed to load sport centers');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const url = editingId
        ? `/api/admin/sport-centers/${editingId}`
        : '/api/admin/sport-centers';
      const method = editingId ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save sport center');
      }

      // Reset form and refresh list
      resetForm();
      await fetchSportCenters();
    } catch (err: any) {
      setError(err.message || 'Failed to save sport center');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (center: SportCenter) => {
    setFormData({
      name_en: center.name_en,
      name_ja: center.name_ja,
      address_en: center.address_en,
      address_ja: center.address_ja,
      station_en: center.station_en || '',
      station_ja: center.station_ja || '',
      latitude: center.latitude?.toString() || '',
      longitude: center.longitude?.toString() || '',
      image_url: center.image_url || '',
    });
    setEditingId(center.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/sport-centers/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete sport center');
      }

      await fetchSportCenters();
    } catch (err: any) {
      alert(err.message || 'Failed to delete sport center');
    }
  };

  const resetForm = () => {
    setFormData({
      name_en: '',
      name_ja: '',
      address_en: '',
      address_ja: '',
      station_en: '',
      station_ja: '',
      latitude: '',
      longitude: '',
      image_url: '',
    });
    setEditingId(null);
    setShowForm(false);
    setError('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <ErrorMessage
            title="Please log in"
            message="You need to be logged in to access this page"
          />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Loading text="Loading sport centers..." fullScreen />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push('/admin')}
            className="p-2"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900">Sport Centers Management</h1>
            <p className="text-gray-600">Manage sport center locations</p>
          </div>
          {!showForm && (
            <Button
              variant="primary"
              onClick={() => setShowForm(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Sport Center
            </Button>
          )}
        </div>

        {error && !showForm && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <Card padding="lg" className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingId ? 'Edit Sport Center' : 'Add New Sport Center'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Name (English)"
                  value={formData.name_en}
                  onChange={(e) =>
                    setFormData({ ...formData, name_en: e.target.value })
                  }
                  placeholder="Tokyo Sport Center"
                  required
                  fullWidth
                />
                <Input
                  label="Name (Japanese)"
                  value={formData.name_ja}
                  onChange={(e) =>
                    setFormData({ ...formData, name_ja: e.target.value })
                  }
                  placeholder="東京スポーツセンター"
                  required
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Address (English)"
                  value={formData.address_en}
                  onChange={(e) =>
                    setFormData({ ...formData, address_en: e.target.value })
                  }
                  placeholder="1-2-3 Shibuya, Tokyo"
                  required
                  fullWidth
                />
                <Input
                  label="Address (Japanese)"
                  value={formData.address_ja}
                  onChange={(e) =>
                    setFormData({ ...formData, address_ja: e.target.value })
                  }
                  placeholder="東京都渋谷区1-2-3"
                  required
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Station (English)"
                  value={formData.station_en}
                  onChange={(e) =>
                    setFormData({ ...formData, station_en: e.target.value })
                  }
                  placeholder="Shibuya Station"
                  fullWidth
                />
                <Input
                  label="Station (Japanese)"
                  value={formData.station_ja}
                  onChange={(e) =>
                    setFormData({ ...formData, station_ja: e.target.value })
                  }
                  placeholder="渋谷駅"
                  fullWidth
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Latitude"
                  type="number"
                  step="any"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                  placeholder="35.6595"
                  fullWidth
                />
                <Input
                  label="Longitude"
                  type="number"
                  step="any"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                  placeholder="139.7004"
                  fullWidth
                />
              </div>

              <Input
                label="Image URL"
                value={formData.image_url}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://example.com/image.jpg"
                fullWidth
              />

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={resetForm}
                  fullWidth
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  loading={submitting}
                  fullWidth
                >
                  {editingId ? 'Update' : 'Create'} Sport Center
                </Button>
              </div>
            </form>
          </Card>
        )}

        {/* Sport Centers List */}
        <div className="grid grid-cols-1 gap-4">
          {sportCenters.map((center) => (
            <Card key={center.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="w-5 h-5 text-gray-400" />
                    <h3 className="text-lg font-semibold text-gray-900">
                      {center.name_en}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-1">{center.name_ja}</p>
                  <p className="text-sm text-gray-600 mb-1">{center.address_en}</p>
                  <p className="text-sm text-gray-500 mb-2">{center.address_ja}</p>
                  {center.station_en && (
                    <p className="text-sm text-gray-500">
                      Near: {center.station_en} ({center.station_ja})
                    </p>
                  )}
                  {center._count && (
                    <div className="flex items-center gap-2 mt-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span className="text-sm text-gray-600">
                        {center._count.sessions} session(s)
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(center)}
                    className="gap-2"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(center.id, center.name_en)}
                    className="gap-2 text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </Card>
          ))}

          {sportCenters.length === 0 && (
            <Card padding="lg">
              <div className="text-center py-8">
                <MapPin className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No sport centers found</p>
                <Button
                  variant="primary"
                  onClick={() => setShowForm(true)}
                  className="mt-4 gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add First Sport Center
                </Button>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

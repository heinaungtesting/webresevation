'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/app/contexts/AuthContext';
import {
  ArrowLeft,
  Search,
  Shield,
  ShieldOff,
  Calendar,
  Mail,
  User as UserIcon,
} from 'lucide-react';
import Card from '@/app/components/ui/Card';
import Button from '@/app/components/ui/Button';
import Input from '@/app/components/ui/Input';
import Badge from '@/app/components/ui/Badge';
import Loading from '@/app/components/ui/Loading';
import ErrorMessage from '@/app/components/ui/ErrorMessage';
import { formatDate } from '@/lib/utils';
import { csrfPatch } from '@/lib/csrfClient';

interface User {
  id: string;
  email: string;
  username?: string;
  display_name?: string;
  location?: string;
  email_verified: boolean;
  is_admin: boolean;
  created_at: string;
  _count: {
    created_sessions: number;
    user_sessions: number;
  };
}

interface Pagination {
  page: number;
  limit: number;
  totalCount: number;
  totalPages: number;
}

export default function AdminUsersPage() {
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    totalCount: 0,
    totalPages: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (currentUser) {
      fetchUsers();
    }
  }, [currentUser, pagination.page, searchQuery]);

  const fetchUsers = async () => {
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        ...(searchQuery && { search: searchQuery }),
      });

      const response = await fetch(`/api/admin/users?${params}`);
      if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      if (!response.ok) throw new Error('Failed to fetch users');

      const data = await response.json();
      setUsers(data.users);
      setPagination(data.pagination);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const toggleAdmin = async (userId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'remove admin privileges from' : 'grant admin privileges to';
    if (!confirm(`Are you sure you want to ${action} this user?`)) {
      return;
    }

    try {
      await csrfPatch(`/api/admin/users/${userId}`, { is_admin: !currentStatus });
      await fetchUsers();
    } catch (err: any) {
      alert(err.message || 'Failed to update user');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPagination({ ...pagination, page: 1 });
  };

  if (!currentUser) {
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
        <Loading text="Loading users..." fullScreen />
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
            <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
            <p className="text-gray-600">
              Manage user accounts and permissions
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Search */}
        <Card padding="md" className="mb-6">
          <form onSubmit={handleSearch} className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Search by email, username, or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                fullWidth
              />
            </div>
            <Button type="submit" variant="primary" className="gap-2">
              <Search className="w-4 h-4" />
              Search
            </Button>
          </form>
        </Card>

        {/* Statistics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card padding="md">
            <p className="text-sm text-gray-600 mb-1">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">
              {pagination.totalCount}
            </p>
          </Card>
          <Card padding="md">
            <p className="text-sm text-gray-600 mb-1">Current Page</p>
            <p className="text-2xl font-bold text-gray-900">
              {pagination.page} of {pagination.totalPages}
            </p>
          </Card>
          <Card padding="md">
            <p className="text-sm text-gray-600 mb-1">Showing</p>
            <p className="text-2xl font-bold text-gray-900">
              {users.length} users
            </p>
          </Card>
        </div>

        {/* Users List */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          {users.map((user) => (
            <Card key={user.id} padding="md">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                      <span className="text-white font-semibold">
                        {(user.display_name || user.email).charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {user.display_name || user.username || user.email.split('@')[0]}
                        </h3>
                        {user.is_admin && (
                          <Badge variant="danger">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        )}
                        {user.email_verified && (
                          <Badge variant="success">Verified</Badge>
                        )}
                      </div>
                      {user.username && (
                        <p className="text-sm text-gray-600">@{user.username}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="w-4 h-4" />
                      {user.email}
                    </div>
                    {user.location && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <UserIcon className="w-4 h-4" />
                        {user.location}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      Joined {formatDate(user.created_at)}
                    </div>
                  </div>

                  <div className="flex gap-4 mt-3">
                    <span className="text-sm text-gray-600">
                      {user._count.created_sessions} session(s) created
                    </span>
                    <span className="text-sm text-gray-600">
                      {user._count.user_sessions} session(s) attended
                    </span>
                  </div>
                </div>

                <div className="flex gap-2">
                  {user.id !== currentUser?.id && (
                    <Button
                      variant={user.is_admin ? 'outline' : 'primary'}
                      size="sm"
                      onClick={() => toggleAdmin(user.id, user.is_admin)}
                      className="gap-2"
                    >
                      {user.is_admin ? (
                        <>
                          <ShieldOff className="w-4 h-4" />
                          Revoke Admin
                        </>
                      ) : (
                        <>
                          <Shield className="w-4 h-4" />
                          Make Admin
                        </>
                      )}
                    </Button>
                  )}
                  {user.id === currentUser?.id && (
                    <Badge variant="info">You</Badge>
                  )}
                </div>
              </div>
            </Card>
          ))}

          {users.length === 0 && (
            <Card padding="lg">
              <div className="text-center py-8">
                <UserIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No users found</p>
              </div>
            </Card>
          )}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              disabled={pagination.page === 1}
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page - 1 })
              }
            >
              Previous
            </Button>
            <span className="px-4 py-2 text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              disabled={pagination.page === pagination.totalPages}
              onClick={() =>
                setPagination({ ...pagination, page: pagination.page + 1 })
              }
            >
              Next
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

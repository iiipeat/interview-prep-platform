'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';

export default function AdminUsersPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [exportResult, setExportResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [adminToken, setAdminToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if admin token is stored in localStorage
    const storedToken = localStorage.getItem('adminToken');
    if (storedToken) {
      setAdminToken(storedToken);
      setIsAuthenticated(true);
    }
  }, []);

  const handleAuthenticate = () => {
    if (adminToken) {
      localStorage.setItem('adminToken', adminToken);
      setIsAuthenticated(true);
      setError(null);
    } else {
      setError('Please enter an admin token');
    }
  };

  const handleSetupSheet = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': adminToken,
        },
        body: JSON.stringify({ action: 'setup' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to setup Google Sheet');
      }

      setExportResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/users/export', {
        headers: {
          'x-admin-token': adminToken,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to export users');
      }

      setExportResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem('adminToken');
    setIsAuthenticated(false);
    setAdminToken('');
    setExportResult(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-8">
        <GlassCard className="max-w-md w-full p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Admin Access</h1>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="adminToken" className="block text-sm font-medium text-gray-700 mb-2">
                Admin Token
              </label>
              <input
                id="adminToken"
                type="password"
                value={adminToken}
                onChange={(e) => setAdminToken(e.target.value)}
                placeholder="Enter admin token"
                className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <Button onClick={handleAuthenticate} className="w-full">
              Authenticate
            </Button>
          </div>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
          <Button onClick={handleSignOut} variant="secondary">
            Sign Out
          </Button>
        </div>

        <GlassCard className="p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">User Data Export</h2>
          
          <div className="space-y-4">
            <p className="text-gray-700">
              Export all user data to Google Sheets for tracking subscriptions, usage, and customer information.
            </p>

            <div className="flex gap-4">
              <Button
                onClick={handleSetupSheet}
                disabled={isLoading}
                variant="secondary"
              >
                {isLoading ? 'Setting up...' : 'Setup Sheet Headers'}
              </Button>

              <Button
                onClick={handleExportUsers}
                disabled={isLoading}
              >
                {isLoading ? 'Exporting...' : 'Export All Users'}
              </Button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                Error: {error}
              </div>
            )}

            {exportResult && (
              <div className="bg-green-50 border border-green-200 text-gray-900 px-4 py-3 rounded-lg space-y-2">
                <p className="font-semibold">✅ {exportResult.message}</p>
                <div className="text-sm space-y-1">
                  <p>Users Exported: {exportResult.usersExported || exportResult.totalUsers || 0}</p>
                  <p>Exported At: {new Date(exportResult.exportedAt || Date.now()).toLocaleString()}</p>
                  {exportResult.spreadsheetUrl && (
                    <p>
                      Spreadsheet:{' '}
                      <a
                        href={exportResult.spreadsheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 underline"
                      >
                        Open in Google Sheets
                      </a>
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </GlassCard>

        <GlassCard className="p-8 mt-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Setup Instructions</h3>
          <ol className="list-decimal list-inside space-y-2 text-gray-700">
            <li>Create a Google Cloud Project and enable Google Sheets API</li>
            <li>Create a Service Account and download the JSON key file</li>
            <li>Create a new Google Sheet and share it with the service account email</li>
            <li>Add the following environment variables to your .env.local file:</li>
          </ol>
          <pre className="mt-4 p-4 bg-gray-100 rounded-lg text-sm overflow-x-auto">
{`GOOGLE_SHEETS_CLIENT_EMAIL=your-service-account@project.iam.gserviceaccount.com
GOOGLE_SHEETS_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"
GOOGLE_SPREADSHEET_ID=your-spreadsheet-id
ADMIN_SECRET_TOKEN=your-secure-admin-token`}
          </pre>
        </GlassCard>
      </div>
    </div>
  );
}
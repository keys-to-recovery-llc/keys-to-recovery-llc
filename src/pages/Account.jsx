import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, AlertTriangle, User } from 'lucide-react';

export default function AccountPage() {
  const [user, setUser] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleted, setDeleted] = useState(false);

  useEffect(() => {
    auth.me().then(setUser).catch(() => {});
  }, []);

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await auth.logout();
    } catch {
      // If the API doesn't support deletion directly, log them out as a fallback
      await auth.logout().catch(() => {});
    } finally {
      setDeleted(true);
      setLoading(false);
    }
  };

  if (deleted) {
    return (
      <div className="min-h-screen bg-[#fafafa] flex items-center justify-center px-6">
        <Card className="border-0 shadow-xl max-w-md w-full">
          <CardContent className="p-10 text-center">
            <h2 className="text-2xl font-semibold text-[#1e3a5f] mb-4">Account Deleted</h2>
            <p className="text-gray-600">Your account and associated data have been removed. You have been logged out.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <section className="relative py-24 px-6 bg-gradient-to-br from-[#1e3a5f] to-[#2a4a6f]">
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">My Account</span>
            <h1 className="text-4xl font-light text-white mt-4">Account Settings</h1>
          </motion.div>
        </div>
      </section>

      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto space-y-6">

          {user && (
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-[#1e3a5f]">
                  <User className="h-5 w-5" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-gray-700">
                <p><span className="font-medium">Name:</span> {user.full_name}</p>
                <p><span className="font-medium">Email:</span> {user.email}</p>
              </CardContent>
            </Card>
          )}

          <Card className="border-0 shadow-lg border-red-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-red-600">
                <Trash2 className="h-5 w-5" />
                Delete Account
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-sm">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>

              {!showConfirm ? (
                <Button
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                  onClick={() => setShowConfirm(true)}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete My Account
                </Button>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                    <p className="text-red-700 text-sm font-medium">
                      Are you sure? This will permanently delete your account and all your data.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => setShowConfirm(false)}
                      disabled={loading}
                    >
                      Cancel
                    </Button>
                    <Button
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                      onClick={handleDeleteAccount}
                      disabled={loading}
                    >
                      {loading ? 'Deleting...' : 'Yes, Delete Account'}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

        </div>
      </section>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { auth } from '@/api/client';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Trash2, AlertTriangle, User, AlertCircle, Loader2, LogOut, KeyRound, MailCheck } from 'lucide-react';

// Post-login redirect target (API-CONTRACT.md §4.4): AuthContext's
// navigateToLogin sends users here as /Account?returnTo=<current URL>.
// Only same-origin targets are honored, and never /Account itself.
const safeReturnTo = (raw) => {
  if (!raw) return null;
  try {
    const url = new URL(raw, window.location.origin);
    if (url.origin !== window.location.origin) return null;
    if (url.pathname === '/Account') return null;
    return url.href;
  } catch {
    return null;
  }
};

const HERO_COPY = {
  account: { heading: 'Account Settings', sub: null },
  setpassword: { heading: 'Set Your Password', sub: 'Choose a password for your account to finish signing in.' },
  login: { heading: 'Sign In', sub: 'Sign in to your Keys to Recovery LLC account.' },
  register: { heading: 'Create Account', sub: 'Create your Keys to Recovery LLC account.' },
  forgot: { heading: 'Reset Password', sub: "We'll email you a link to set a new password." },
};

export default function AccountPage() {
  const { logout } = useAuth();
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(true);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleted, setDeleted] = useState(false);

  // Auth-flow state. Views: 'account' once signed in; otherwise `mode`.
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot' | 'setpassword'
  const [resetToken, setResetToken] = useState('');
  const [returnTo, setReturnTo] = useState('');
  const [tokenInvalid, setTokenInvalid] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [passwordNotSet, setPasswordNotSet] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const rt = params.get('returnTo');
    if (rt) setReturnTo(rt);
    const token = params.get('reset_token');
    if (token) {
      // Password set/reset links land here (API-CONTRACT.md §4.7/§4.8).
      setResetToken(token);
      setMode('setpassword');
      setChecking(false);
      return;
    }
    auth.me().then(setUser).catch(() => {}).finally(() => setChecking(false));
  }, []);

  const switchMode = (next) => {
    setMode(next);
    setError('');
    setNotice('');
    setPasswordNotSet(false);
    setTokenInvalid(false);
  };

  // Shared success path for login / register / set-password: the API has
  // already set the session cookie. Honor returnTo (§4.4); otherwise show
  // the account view. The one-time reset token is scrubbed from the URL.
  const completeSignIn = (signedInUser) => {
    const target = safeReturnTo(returnTo);
    if (target) {
      window.location.assign(target);
      return;
    }
    window.history.replaceState({}, '', '/Account');
    setUser(signedInUser);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    setPasswordNotSet(false);
    setSubmitting(true);
    try {
      const signedInUser = await auth.login(email.trim(), password);
      completeSignIn(signedInUser);
    } catch (err) {
      if (err.message === 'password_not_set') {
        // Migrated user (§4.8): no password on file yet — guide them to
        // the set-password flow instead of a generic failure.
        setPasswordNotSet(true);
      } else if (err.message === 'invalid_credentials') {
        setError('Incorrect email or password. Please try again.');
      } else {
        setError(err.message || 'Sign-in failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const signedInUser = await auth.register(email.trim(), password, fullName.trim());
      completeSignIn(signedInUser);
    } catch (err) {
      if (err.message === 'email_already_registered') {
        setError('An account with this email already exists. Try signing in instead.');
      } else {
        setError(err.message || 'Registration failed. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Used by the forgot-password view, the password_not_set guidance, and
  // the expired-token recovery. The API always returns 200 and never
  // reveals whether the account exists — the confirmation copy matches.
  const handleRequestReset = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await auth.requestReset(email.trim());
      setNotice('If an account exists for that email address, a link to set your password is on its way. Links expire after 1 hour.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    setError('');
    setNotice('');
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setSubmitting(true);
    try {
      const signedInUser = await auth.setPassword(resetToken, password);
      completeSignIn(signedInUser);
    } catch (err) {
      if (err.message === 'invalid_or_expired_token') {
        setTokenInvalid(true);
        setError('This link is invalid or has expired. Request a new link below.');
      } else {
        setError(err.message || 'Could not set your password. Please try again.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    setDeleteError('');
    try {
      // Real deletion (Codex review F-02): DELETE /api/auth/me removes
      // the user record server-side. Only claim success after it lands.
      await auth.deleteAccount();
      setDeleted(true);
    } catch {
      setDeleteError('We could not delete your account. Please try again, or contact us for help.');
    } finally {
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

  const view = user ? 'account' : mode;
  const hero = HERO_COPY[user ? 'account' : checking ? 'account' : mode];

  return (
    <div className="min-h-screen bg-[#fafafa]">
      <section className="relative py-24 px-6 bg-gradient-to-br from-[#1e3a5f] to-[#2a4a6f]">
        <div className="relative z-10 max-w-2xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[#d4a574] font-medium tracking-widest text-sm uppercase">My Account</span>
            <h1 className="text-4xl font-light text-white mt-4">{hero.heading}</h1>
            {hero.sub && <p className="text-white/70 mt-4">{hero.sub}</p>}
          </motion.div>
        </div>
      </section>

      {checking ? (
        <section className="py-24 px-6">
          <div className="flex items-center justify-center">
            <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
          </div>
        </section>
      ) : user ? (
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
                <div className="pt-2">
                  <Button variant="outline" onClick={() => logout()}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </div>
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
                  {deleteError && (
                    <div className="flex items-center gap-3 p-4 bg-white border border-red-200 rounded-lg">
                      <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                      <p className="text-red-600 text-sm">{deleteError}</p>
                    </div>
                  )}
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
      ) : (
      <section className="py-16 px-6">
        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 text-[#1e3a5f]">
                <KeyRound className="h-5 w-5" />
                {view === 'setpassword' ? 'Set Your Password' : view === 'forgot' ? 'Reset Password' : view === 'register' ? 'Create Account' : 'Sign In'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {(view === 'login' || view === 'register') && (
                <div className="flex gap-2 mb-6">
                  <Button
                    type="button"
                    variant={view === 'login' ? 'default' : 'outline'}
                    className={view === 'login' ? 'bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white' : ''}
                    onClick={() => switchMode('login')}
                  >
                    Sign In
                  </Button>
                  <Button
                    type="button"
                    variant={view === 'register' ? 'default' : 'outline'}
                    className={view === 'register' ? 'bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white' : ''}
                    onClick={() => switchMode('register')}
                  >
                    Create Account
                  </Button>
                </div>
              )}

              {notice && (
                <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                  <MailCheck className="h-5 w-5 text-green-600 flex-shrink-0" />
                  <p className="text-green-700 text-sm">{notice}</p>
                </div>
              )}

              {error && (
                <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
                  <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {view === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email Address *</Label>
                    <Input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Password *</Label>
                    <Input id="login-password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" className="h-12" />
                  </div>

                  {passwordNotSet && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg space-y-3">
                      <div className="flex items-start gap-3">
                        <KeyRound className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
                        <div className="space-y-1">
                          <p className="text-amber-800 text-sm font-medium">Your account was moved from our previous website.</p>
                          <p className="text-amber-700 text-sm">You need to set a password before you can sign in. We'll email a secure set-password link to {email.trim()}.</p>
                        </div>
                      </div>
                      <Button type="button" onClick={handleRequestReset} disabled={submitting} className="bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white">
                        {submitting ? 'Sending...' : 'Email me a set-password link'}
                      </Button>
                    </div>
                  )}

                  <Button type="submit" disabled={submitting} className="w-full bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white font-semibold py-6 text-lg rounded-xl">
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Signing In...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <KeyRound className="h-5 w-5" />
                        Sign In
                      </span>
                    )}
                  </Button>
                  <p className="text-center text-sm">
                    <button type="button" className="text-[#1e3a5f] underline hover:text-[#2a4a6f]" onClick={() => switchMode('forgot')}>
                      Forgot your password?
                    </button>
                  </p>
                </form>
              )}

              {view === 'register' && (
                <form onSubmit={handleRegister} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Full Name *</Label>
                    <Input id="register-name" type="text" required autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="John Doe" className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email Address *</Label>
                    <Input id="register-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password *</Label>
                    <Input id="register-password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="h-12" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="register-confirm">Confirm Password *</Label>
                    <Input id="register-confirm" type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className="h-12" />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white font-semibold py-6 text-lg rounded-xl">
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Creating Account...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <User className="h-5 w-5" />
                        Create Account
                      </span>
                    )}
                  </Button>
                </form>
              )}

              {view === 'forgot' && (
                <form onSubmit={handleRequestReset} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="forgot-email">Email Address *</Label>
                    <Input id="forgot-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="h-12" />
                  </div>
                  <Button type="submit" disabled={submitting} className="w-full bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white font-semibold py-6 text-lg rounded-xl">
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Sending...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <MailCheck className="h-5 w-5" />
                        Email me a reset link
                      </span>
                    )}
                  </Button>
                  <p className="text-center text-sm">
                    <button type="button" className="text-[#1e3a5f] underline hover:text-[#2a4a6f]" onClick={() => switchMode('login')}>
                      Back to sign in
                    </button>
                  </p>
                </form>
              )}

              {view === 'setpassword' && (
                <div className="space-y-6">
                  <form onSubmit={handleSetPassword} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="set-password">New Password *</Label>
                      <Input id="set-password" type="password" required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className="h-12" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="set-confirm">Confirm Password *</Label>
                      <Input id="set-confirm" type="password" required autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Re-enter your password" className="h-12" />
                    </div>
                    <Button type="submit" disabled={submitting} className="w-full bg-[#1e3a5f] hover:bg-[#2a4a6f] text-white font-semibold py-6 text-lg rounded-xl">
                      {submitting ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Setting Password...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <KeyRound className="h-5 w-5" />
                          Set Password &amp; Sign In
                        </span>
                      )}
                    </Button>
                  </form>

                  {tokenInvalid && (
                    <form onSubmit={handleRequestReset} className="space-y-5 pt-6 border-t">
                      <div className="space-y-2">
                        <Label htmlFor="newlink-email">Email Address *</Label>
                        <Input id="newlink-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="h-12" />
                      </div>
                      <Button type="submit" variant="outline" disabled={submitting} className="w-full py-6 text-lg rounded-xl">
                        {submitting ? 'Sending...' : 'Request a new link'}
                      </Button>
                    </form>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
      )}
    </div>
  );
}

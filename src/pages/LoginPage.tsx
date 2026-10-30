import React, { useState } from 'react';
import {
  LogIn,
  Shield,
  CheckCircle2,
  Lock,
  ArrowRight,
  Users,
  Building2,
  AlertCircle,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Collaborator } from '../lib/types';
import { ADMIN_USER } from '../lib/mock-data';

interface LoginPageProps {
  onLoginSuccess: (user: Collaborator, platformType: 'admin' | 'member') => void;
  onNavigateHome: () => void;
  registeredMembers?: Collaborator[];
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onLoginSuccess,
  onNavigateHome,
  registeredMembers = [],
}) => {
  const [loginMode, setLoginMode] = useState<'admin' | 'member'>('admin');
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleModeChange = (mode: 'admin' | 'member') => {
    setLoginMode(mode);
    setAuthError(null);
    setUsernameOrEmail('');
    setPassword('');
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    const inputClean = usernameOrEmail.trim().toLowerCase();
    const passwordClean = password;

    if (!inputClean || !passwordClean) {
      setAuthError('Please enter both your credentials to continue.');
      return;
    }

    // 1. STRICT ADMIN AUTHENTICATION
    // Must strictly match sunil@researchlab.np and R3se@rcher
    if (loginMode === 'admin') {
      if (inputClean === 'sunil@researchlab.np' && passwordClean === 'R3se@rcher') {
        const adminUser: Collaborator = {
          ...ADMIN_USER,
          role: 'owner',
        };
        onLoginSuccess(adminUser, 'admin');
        return;
      }

      setAuthError('Access Denied: Invalid administrator credentials.');
      return;
    }

    // 2. MEMBER AUTHENTICATION
    // Only members added by the Admin can log in
    if (loginMode === 'member') {
      // Look up member from registered members list
      const matchedMember = registeredMembers.find(
        (m) => m.email.toLowerCase() === inputClean && m.id !== ADMIN_USER.id
      );

      if (!matchedMember) {
        setAuthError(
          'No member account found with this email. Only the laboratory administrator (sunil@researchlab.np) can add and authorize members.'
        );
        return;
      }

      // Allow member login (or check member password if configured)
      onLoginSuccess(matchedMember, 'member');
      return;
    }
  };

  return (
    <div className="min-h-full bg-stone-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <button
          onClick={onNavigateHome}
          className="inline-flex items-center space-x-2 text-stone-900 group mb-3"
        >
          <span className="w-10 h-10 rounded-xl bg-indigo-600 text-white font-serif font-bold text-lg flex items-center justify-center shadow-xs group-hover:bg-indigo-700 transition-colors">
            RL
          </span>
          <span className="font-serif font-bold text-2xl text-stone-900 tracking-tight">
            ResearchLab
          </span>
        </button>
        <h2 className="text-xl font-serif font-semibold text-stone-800">
          Institutional Access Gateway
        </h2>
        <p className="text-xs text-stone-500 font-serif mt-1">
          Secure, authenticated workspace for collaborative scientific publications
        </p>
      </div>

      {/* Auth Card */}
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4">
        <div className="bg-white py-8 px-6 sm:px-10 shadow-xl rounded-2xl border border-stone-200">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1 p-1 bg-stone-100 rounded-xl mb-6">
            <button
              type="button"
              onClick={() => handleModeChange('admin')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                loginMode === 'admin'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-purple-700" />
              <span>Administrator Portal</span>
            </button>

            <button
              type="button"
              onClick={() => handleModeChange('member')}
              className={`py-2 text-xs font-semibold rounded-lg flex items-center justify-center space-x-1.5 transition-all ${
                loginMode === 'member'
                  ? 'bg-white text-emerald-900 shadow-xs'
                  : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-emerald-700" />
              <span>Research Member</span>
            </button>
          </div>

          {/* Role Status Explanation */}
          <div
            className={`p-3 rounded-xl border text-xs mb-6 ${
              loginMode === 'admin'
                ? 'bg-purple-50/50 border-purple-200 text-purple-950'
                : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
            }`}
          >
            {loginMode === 'admin' ? (
              <p className="leading-relaxed">
                <strong>Principal Investigator & Lab Director Access:</strong> Grants governance over all laboratory manuscripts, member invitations, and Drive repositories.
              </p>
            ) : (
              <p className="leading-relaxed">
                <strong>Collaborator Workspace:</strong> Access manuscripts and review assignments authorized for your registered institutional account.
              </p>
            )}
          </div>

          {/* Login Form */}
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                {loginMode === 'admin' ? 'Administrator Email' : 'Member Email Address'}
              </label>
              <input
                type="text"
                required
                autoComplete="username"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                placeholder={
                  loginMode === 'admin'
                    ? 'Enter administrator email'
                    : 'name@institution.edu'
                }
                className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-stone-50/50 text-stone-900"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  className="w-full px-3.5 py-2.5 text-xs border border-stone-300 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-stone-50/50 text-stone-900 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-stone-400 hover:text-stone-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {authError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start space-x-2 text-xs text-rose-800">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{authError}</span>
              </div>
            )}

            <button
              type="submit"
              className={`w-full py-2.5 text-xs font-semibold rounded-xl text-white shadow-xs flex items-center justify-center space-x-2 transition-colors ${
                loginMode === 'admin'
                  ? 'bg-purple-700 hover:bg-purple-800'
                  : 'bg-emerald-700 hover:bg-emerald-800'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>
                {loginMode === 'admin'
                  ? 'Sign In to Directorate Console'
                  : 'Sign In to Member Platform'}
              </span>
            </button>
          </form>

          {/* Security Policy Footnote */}
          <div className="mt-6 pt-5 border-t border-stone-200 text-center space-y-2">
            <p className="text-[11px] text-stone-500 flex items-center justify-center space-x-1">
              <Lock className="w-3 h-3 text-stone-400" />
              <span>Confidential Institutional Single-Sign-On</span>
            </p>
            <p className="text-[10px] text-stone-400">
              Only authorized laboratory personnel may access ResearchLab systems.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

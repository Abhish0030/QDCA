import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import AuthIllustration from '../components/AuthIllustration.jsx';
import Seo from '../components/Seo.jsx';
import qdcaLogo from '../assets/qdca-logo-new.png';
import { authClient } from '../lib/authClient.js';
import { toast } from '../lib/toast.js';
import { trackEvent } from '../lib/monitoring.js';

const authButtonHover = {
  whileHover: { scale: 1.03, y: -2 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 420, damping: 18 },
};

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [tokenError, setTokenError] = useState('');

  const token = searchParams.get('token');
  const error = searchParams.get('error');

  useEffect(() => {
    if (error) {
      setTokenError('Invalid or expired reset link. Please request a new one.');
      trackEvent('password_reset_token_error', { error });
    } else if (!token) {
      setTokenError('No reset token found. Please request a new password reset link.');
      trackEvent('password_reset_no_token');
    }
  }, [token, error]);

  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialCharacter = /[@#$^&*(),.?:{}|<>]/.test(password);
  
  const isPasswordStrong =
    (hasUppercase && hasLowercase && hasNumber && hasSpecialCharacter) ||
    (password.length >= 12 && hasUppercase && hasLowercase && hasNumber);
  
  const shouldShowPasswordRules = (isPasswordFocused || password) && !isPasswordStrong;
  const confirmPasswordError = confirmPassword && confirmPassword !== password;

  const getPasswordError = (value) => {
    const hasRequiredUppercase = /[A-Z]/.test(value);
    const hasRequiredLowercase = /[a-z]/.test(value);
    const hasRequiredNumber = /\d/.test(value);
    const hasRequiredSpecialCharacter = /[@#$^&*(),.?:{}|<>]/.test(value);
    const isGoogleStyleStrong =
      value.length >= 12 && hasRequiredUppercase && hasRequiredLowercase && hasRequiredNumber;

    if (
      value &&
      !isGoogleStyleStrong &&
      (!hasRequiredUppercase || !hasRequiredLowercase || !hasRequiredNumber || !hasRequiredSpecialCharacter)
    ) {
      return 'Weak Password';
    }

    return '';
  };

  const handlePasswordChange = (event) => {
    const nextPassword = event.target.value;
    setPassword(nextPassword);
    if (passwordError) setPasswordError(getPasswordError(nextPassword));
  };

  const handlePasswordBlur = () => {
    setIsPasswordFocused(false);
    setPasswordError(getPasswordError(password));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!token) {
      toast.error('Invalid reset token');
      return;
    }

    const nextPasswordError = getPasswordError(password);
    setPasswordError(nextPasswordError);

    if (nextPasswordError) {
      trackEvent('password_reset_validation_failed', { field: 'password' });
      return;
    }

    if (confirmPassword !== password) {
      trackEvent('password_reset_validation_failed', { field: 'confirmPassword' });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.resetPassword({
        newPassword: password,
        token,
      });

      if (error) {
        throw error;
      }

      setIsSuccess(true);
      trackEvent('password_reset_success');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (error) {
      const message = error?.message || 'Failed to reset password. Please try again.';
      trackEvent('password_reset_failed', { reason: message });
      
      if (message.toLowerCase().includes('token') || message.toLowerCase().includes('expired')) {
        setTokenError('Your reset link has expired. Please request a new one.');
      } else {
        toast.error(message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex w-full relative overflow-hidden bg-qdca-bg">
      <Seo
        title="Reset Password"
        description="Create a new password for your QDCA account."
        path="/reset-password"
      />

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden" aria-hidden="true">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#F3E5D8] rounded-full mix-blend-multiply filter blur-3xl opacity-70"></div>
        <div className="absolute top-40 right-1/4 w-72 h-72 bg-[#F3E5D8] rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-[#F3E5D8] rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
        <div className="absolute top-10 left-10 w-32 h-32 dotted-pattern opacity-50"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 dotted-pattern opacity-50"></div>
        <svg className="absolute bottom-0 left-0 w-full h-64 text-[#F0E6DD] opacity-50" viewBox="0 0 1440 320" preserveAspectRatio="none">
          <path fill="currentColor" fillOpacity="1" d="M0,288L48,272C96,256,192,224,288,197.3C384,171,480,149,576,165.3C672,181,768,235,864,250.7C960,267,1056,245,1152,224C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
        </svg>
      </div>

      <AuthIllustration panelKey="reset-password-left-panel" brainId="rp-brain-half" />

      <main className="w-full lg:w-1/2 flex items-start justify-center overflow-y-auto py-6 lg:py-4 px-4 sm:px-6 relative z-20 lg:h-screen">
        <div className="bg-white w-full max-w-[520px] rounded-[32px] p-6 sm:p-8 glass-shadow my-auto">
          <div className="flex flex-col items-center text-center mb-5">
            <div className="flex items-center justify-center gap-0 mb-3">
              <img
                src={qdcaLogo}
                alt="QDCA logo"
                className="h-12 sm:h-14 w-auto shrink-0 object-contain -mr-1"
              />
              <span className="text-2xl sm:text-3xl font-extrabold text-qdca-purple tracking-tight">QDCA</span>
            </div>

            {isSuccess ? (
              <>
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle size={28} className="text-green-600" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Password Reset Successful!</h1>
                <p className="text-sm text-gray-500 font-medium">
                  Redirecting you to login...
                </p>
              </>
            ) : tokenError ? (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Invalid Reset Link</h1>
                <p className="text-sm text-gray-500 font-medium text-center max-w-xs">
                  {tokenError}
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Reset Your Password</h1>
                <p className="text-sm text-gray-500 font-medium text-center max-w-xs">
                  Enter your new password below.
                </p>
              </>
            )}
          </div>

          {isSuccess ? (
            <div className="space-y-3.5">
              <div className="w-full rounded-2xl bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3" role="status">
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium text-green-700">
                  Your password has been reset successfully. You can now sign in with your new password.
                </p>
              </div>

              <Link
                to="/login"
                className="w-full py-3 px-4 bg-gradient-to-r from-qdca-grad-start to-qdca-grad-end text-white text-lg font-semibold rounded-2xl hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qdca-purple flex items-center justify-center gap-2"
              >
                Go to Login
              </Link>
            </div>
          ) : tokenError ? (
            <div className="space-y-3.5">
              <div className="w-full rounded-2xl bg-red-50 border border-red-200 px-4 py-3 flex items-start gap-3" role="alert">
                <p className="text-sm font-medium text-red-700">
                  {tokenError}
                </p>
              </div>

              <Link
                to="/forgot-password"
                className="w-full py-3 px-4 bg-gradient-to-r from-qdca-grad-start to-qdca-grad-end text-white text-lg font-semibold rounded-2xl hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qdca-purple flex items-center justify-center gap-2"
              >
                Request New Reset Link
              </Link>

              <div className="text-center pt-0">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-qdca-purple hover:underline">
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back to Login
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="new-password">
                  New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={handlePasswordChange}
                    onFocus={() => setIsPasswordFocused(true)}
                    onBlur={handlePasswordBlur}
                    autoComplete="new-password"
                    aria-invalid={passwordError ? 'true' : 'false'}
                    aria-describedby={passwordError ? 'password-error' : undefined}
                    className={`block w-full pl-11 pr-11 py-2 border rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow text-base ${
                      passwordError ? 'border-red-300 bg-red-50/40 focus:ring-red-400' : 'border-gray-200 focus:ring-qdca-purple'
                    }`}
                    placeholder="Create a new password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {passwordError && (
                  <p id="password-error" className="mt-1.5 text-xs font-semibold text-red-600">{passwordError}</p>
                )}
                {shouldShowPasswordRules && (
                  <div className="mt-1.5 space-y-1 text-xs font-semibold">
                    {!password && <p className="text-green-600">Enter strong password</p>}
                    <p className="text-gray-600">Password should contain atleast one capital alphabet and atleast one small alphabet</p>
                    <p className="text-gray-600">Atleast one numeric digit and one special character (@#$^&amp;*(),.?:{}|&lt;&gt;)</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1" htmlFor="confirm-new-password">
                  Confirm New Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock size={18} className="text-gray-400" />
                  </div>
                  <input
                    id="confirm-new-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    autoComplete="new-password"
                    aria-invalid={confirmPasswordError ? 'true' : 'false'}
                    aria-describedby={confirmPasswordError ? 'confirm-password-error' : undefined}
                    className={`block w-full pl-11 pr-11 py-2 border rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow text-base ${
                      confirmPasswordError ? 'border-red-300 bg-red-50/40 focus:ring-red-400' : 'border-gray-200 focus:ring-qdca-purple'
                    }`}
                    placeholder="Confirm your new password"
                  />
                  <button
                    type="button"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                    onClick={() => setShowConfirmPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {confirmPasswordError && (
                  <p id="confirm-password-error" className="mt-1.5 text-xs font-semibold text-red-600">
                    It doesn't match with password
                  </p>
                )}
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-qdca-grad-start to-qdca-grad-end text-white text-lg font-semibold rounded-2xl shadow-lg shadow-purple-900/15 hover:brightness-110 hover:shadow-xl hover:shadow-purple-900/25 transition-[filter,box-shadow] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qdca-purple disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                {...(!isLoading ? authButtonHover : {})}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" aria-hidden="true" />
                    Resetting Password...
                  </>
                ) : (
                  'Reset Password'
                )}
              </motion.button>

              <div className="text-center pt-0">
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold text-qdca-purple hover:underline">
                  <ArrowLeft size={16} aria-hidden="true" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

export default ResetPassword;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle, Loader2 } from 'lucide-react';
import AuthIllustration from '../components/AuthIllustration.jsx';
import Seo from '../components/Seo.jsx';
import qdcaLogo from '../assets/qdca-logo-new.png';
import { authClient } from '../lib/authClient.js';
import { appUrl } from '../lib/env.js';
import { toast } from '../lib/toast.js';
import { trackEvent } from '../lib/monitoring.js';

const authButtonHover = {
  whileHover: { scale: 1.03, y: -2 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 420, damping: 18 },
};

const getEmailError = (value) => {
  const trimmed = value.trim().toLowerCase();
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const commonGmailTypos = new Set([
    'gamil.com',
    'gmial.com',
    'gmai.com',
    'gmail.co',
    'gmail.con',
    'gmail.cm',
    'gnail.com',
    'gmal.com',
    'googlemail.co',
  ]);
  const domain = trimmed.split('@')[1];

  if (!trimmed) return 'Email address is required.';
  if (!emailPattern.test(trimmed)) return 'Please enter a valid email address, for example name@gmail.com.';
  if (commonGmailTypos.has(domain)) return 'Did you mean to write @gmail.com? Please check your email address.';
  return '';
};

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
    if (emailError) setEmailError(getEmailError(event.target.value));
  };

  const handleEmailBlur = () => {
    if (email) setEmailError(getEmailError(email));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = getEmailError(email);

    if (error) {
      setEmailError(error);
      trackEvent('password_reset_validation_failed', { field: 'email' });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await authClient.requestPasswordReset({
        email: email.trim().toLowerCase(),
        redirectTo: `${appUrl}/reset-password`,
      });

      if (error) {
        throw error;
      }

      setSubmittedEmail(email);
      setIsSubmitted(true);
      trackEvent('password_reset_requested');
    } catch (error) {
      const message = error?.message || 'Unable to send reset link. Please try again.';
      trackEvent('password_reset_failed', { reason: message });
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:h-screen flex w-full relative overflow-hidden bg-qdca-bg">
      <Seo
        title="Reset Password"
        description="Request a secure password reset link for your QDCA account."
        path="/forgot-password"
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

      <AuthIllustration panelKey="forgot-password-left-panel" brainId="fp-brain-half" />

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

            {isSubmitted ? (
              <>
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4">
                  <CheckCircle size={28} className="text-green-600" aria-hidden="true" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Check Your Inbox</h1>
                <p className="text-sm text-gray-500 font-medium">
                  We sent a reset link to <span className="font-semibold text-gray-700">{submittedEmail}</span>
                </p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-gray-900 mb-1">Forgot Password?</h1>
                <p className="text-sm text-gray-500 font-medium text-center max-w-xs">
                  Enter your email and we&apos;ll send a password reset link.
                </p>
              </>
            )}
          </div>

          {isSubmitted ? (
            <div className="space-y-3.5">
              <div className="w-full rounded-2xl bg-green-50 border border-green-200 px-4 py-3 flex items-start gap-3" role="status">
                <CheckCircle size={20} className="text-green-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
                <p className="text-sm font-medium text-green-700">
                  Password reset link sent successfully. Please check your spam folder if you don&apos;t see it.
                </p>
              </div>

              <Link
                to="/login"
                className="w-full py-3 px-4 bg-gradient-to-r from-qdca-grad-start to-qdca-grad-end text-white text-lg font-semibold rounded-2xl hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-qdca-purple flex items-center justify-center gap-2"
              >
                <ArrowLeft size={20} aria-hidden="true" />
                Back to Login
              </Link>
            </div>
          ) : (
            <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5" htmlFor="fp-email">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail size={20} className="text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    id="fp-email"
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    onBlur={handleEmailBlur}
                    autoComplete="email"
                    placeholder="Enter your email"
                    aria-invalid={emailError ? 'true' : 'false'}
                    aria-describedby={emailError ? 'fp-email-error' : undefined}
                    disabled={isLoading}
                    className={`block w-full pl-12 pr-4 py-3 border rounded-2xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent transition-shadow text-base disabled:opacity-60 disabled:cursor-not-allowed ${
                      emailError ? 'border-red-300 bg-red-50/40 focus:ring-red-400' : 'border-gray-200 focus:ring-qdca-purple'
                    }`}
                  />
                </div>
                {emailError && (
                  <p id="fp-email-error" role="alert" className="mt-2 text-sm font-medium text-red-600">
                    {emailError}
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
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
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

export default ForgotPassword;

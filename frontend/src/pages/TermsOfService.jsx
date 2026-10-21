import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import qdcaLogo from '../assets/qdca-logo-new.png';

const sections = [
  {
    title: 'Introduction',
    content:
      'Welcome to the Question Difficulty Classification Agent (QDCA). By accessing or using our platform, you agree to be bound by these Terms of Service. Please read them carefully before creating an account or using any of our features. If you do not agree to these terms, you may not use the service.',
  },
  {
    title: 'User Responsibilities',
    content:
      'As a user of QDCA, you are responsible for maintaining the confidentiality of your account credentials, ensuring that all information you provide is accurate and up to date, using the platform only for lawful and intended purposes, and notifying us promptly of any unauthorized use of your account. You agree not to share your login credentials with others or allow third parties to access your account.',
  },
  {
    title: 'Account Security',
    content:
      'You are solely responsible for all activities that occur under your account. QDCA employs industry-standard security measures to protect your data, but we cannot guarantee absolute security. You should use a strong, unique password and enable any additional security features available. We reserve the right to suspend or terminate accounts that we believe have been compromised or are being used in violation of these terms.',
  },
  {
    title: 'Acceptable Use',
    content:
      'You agree to use QDCA only for its intended purpose of classifying question difficulty levels. Prohibited activities include uploading malicious content, attempting to reverse-engineer or tamper with the platform, using automated scripts to overload our systems, and any activity that violates applicable laws or infringes on the rights of others. Violation of acceptable use policies may result in immediate account termination.',
  },
  {
    title: 'Service Availability',
    content:
      'QDCA strives to maintain high availability, but we do not guarantee uninterrupted service. We may perform scheduled maintenance, updates, or emergency repairs that temporarily affect availability. We are not liable for any losses or damages resulting from service interruptions, downtime, or technical issues beyond our reasonable control. We will make reasonable efforts to notify users of planned maintenance in advance.',
  },
  {
    title: 'Contact Information',
    content:
      'If you have any questions, concerns, or feedback regarding these Terms of Service, please reach out to us. You can contact our support team via the help center within the platform or by emailing support@qdca.ai. We aim to respond to all inquiries within 2 business days.',
  },
];

function TermsOfService() {
  return (
    <div className="min-h-screen bg-qdca-bg relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-[#F3E5D8] rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>
        <div className="absolute top-40 right-0 w-72 h-72 bg-[#F3E5D8] rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute -bottom-32 left-1/3 w-80 h-80 bg-[#F3E5D8] rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
        <div className="absolute top-10 left-10 w-32 h-32 dotted-pattern opacity-40"></div>
        <div className="absolute bottom-10 right-10 w-48 h-48 dotted-pattern opacity-40"></div>
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-12">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-qdca-purple font-semibold hover:underline mb-8 group"
        >
          <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>

        {/* Card */}
        <div className="bg-white rounded-[32px] p-8 sm:p-10 glass-shadow">
          {/* Logo */}
          <div className="flex items-center gap-0 mb-8">
            <img
              src={qdcaLogo}
              alt="QDCA logo"
              className="h-12 sm:h-14 w-auto shrink-0 object-contain -mr-1"
            />
            <span className="text-2xl sm:text-3xl font-extrabold text-qdca-purple tracking-tight">QDCA</span>
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-400 text-sm font-medium mb-10">Last updated: June 18, 2026</p>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <section key={section.title}>
                <h2 className="flex items-center gap-3 text-lg font-bold text-qdca-purple mb-3">
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-gradient-to-br from-[#7B2CBF] to-[#5A189A] text-white text-xs font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  {section.title}
                </h2>
                <p className="text-gray-600 leading-relaxed text-sm sm:text-base">{section.content}</p>
              </section>
            ))}
          </div>

          {/* Divider */}
          <div className="mt-10 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">
              By using QDCA you agree to these terms.
            </p>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <Link to="/privacy" className="text-qdca-purple hover:underline">
                Privacy Policy
              </Link>
              <Link to="/" className="bg-gradient-to-r from-qdca-grad-start to-qdca-grad-end text-white px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity">
                Back to App
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TermsOfService;

import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import qdcaLogo from '../assets/qdca-logo-new.png';

const sections = [
  {
    title: 'Information We Collect',
    content:
      'When you register for QDCA, we collect personal information such as your name, email address, and password. As you use the platform, we may also collect usage data including questions you submit for classification, interaction logs, device information, browser type, and IP address. This information helps us provide, maintain, and improve our services.',
  },
  {
    title: 'How We Use Information',
    content:
      'We use the information we collect to operate and improve the QDCA platform, authenticate your identity and secure your account, process your classification requests, send important service-related communications, and analyze usage patterns to enhance user experience. We do not sell your personal information to third parties for marketing purposes.',
  },
  {
    title: 'Data Security',
    content:
      'We take the security of your data seriously. QDCA implements industry-standard security measures including encryption of data in transit and at rest, regular security audits, and strict access controls. However, no system can be completely secure, and we cannot guarantee that unauthorized parties will never overcome these measures. You should protect your account credentials and notify us immediately if you suspect unauthorized access.',
  },
  {
    title: 'Third-Party Services',
    content:
      'QDCA may integrate with third-party services such as Google for authentication and cloud infrastructure providers for hosting. These third parties have their own privacy policies governing how they handle your data. We encourage you to review their policies. We only share data with third parties to the extent necessary to provide our services, and we require them to maintain appropriate data protection standards.',
  },
  {
    title: 'User Rights',
    content:
      'You have the right to access the personal data we hold about you, request corrections to inaccurate information, request deletion of your account and associated data, opt out of non-essential communications, and request a portable copy of your data. To exercise any of these rights, please contact us using the information below. We will respond to verified requests within 30 days.',
  },
  {
    title: 'Contact Information',
    content:
      'If you have questions about this Privacy Policy or how we handle your personal data, please contact our privacy team at privacy@qdca.ai or through the support center within the platform. For formal data subject requests or legal inquiries, you may also write to us at our registered business address. We are committed to addressing all privacy concerns promptly and transparently.',
  },
];

function PrivacyPolicy() {
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

          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-2">Privacy Policy</h1>
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
              Your privacy matters to us at QDCA.
            </p>
            <div className="flex items-center gap-4 text-sm font-semibold">
              <Link to="/terms" className="text-qdca-purple hover:underline">
                Terms of Service
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

export default PrivacyPolicy;

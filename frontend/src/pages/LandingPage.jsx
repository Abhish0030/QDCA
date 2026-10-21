import { motion, useInView, useReducedMotion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  ChevronRight,
  Mail,
  FileText,
  Layers3,
  Menu,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import Seo from '../components/Seo.jsx';
import qdcaLogo from '../assets/qdca-logo-new.png';
import AuthIllustration from '../components/AuthIllustration.jsx';

const navLinks = [
  { label: 'Home', href: '#home' },
  { label: 'Features', href: '#features' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
];

const features = [
  {
    icon: BrainCircuit,
    title: 'Question Difficulty Classification',
    description: 'Predict five calibrated labels, from Very Easy to Expert, based on cognitive depth.',
  },
  {
    icon: Target,
    title: 'Confidence Score Generation',
    description: 'See how certain the agent is so educators can review edge cases with clarity.',
  },
  {
    icon: Layers3,
    title: "Bloom's Taxonomy Analysis",
    description: 'Map questions to cognitive levels such as recall, apply, analyze, and evaluate.',
  },
  {
    icon: BarChart3,
    title: 'Topic-wise Difficulty Analysis',
    description: 'Compare difficulty across topics and identify areas that need better learning support.',
  },
  {
    icon: Search,
    title: 'Similar Question Discovery',
    description: 'Find related questions to improve paper balance, revision sets, and practice banks.',
  },
  {
    icon: FileText,
    title: 'PDF Question Paper Analysis',
    description: 'Analyze complete question papers and extract structured difficulty insights faster.',
  },
];

const workflowSteps = [
  { icon: FileText, title: 'Submit Question', description: 'Paste a question or upload a paper for analysis.' },
  { icon: BrainCircuit, title: 'AI Analysis', description: 'NLP and ML pipelines inspect wording, concepts, and complexity.' },
  { icon: Target, title: 'Difficulty Prediction', description: 'QDCA assigns one of five difficulty levels with a confidence score.' },
  { icon: Sparkles, title: 'Detailed Explanation', description: 'Get concise reasoning that helps educators trust the result.' },
];

const difficultyCards = [
  {
    label: 'Very Easy',
    color: 'green',
    question: 'What is the capital of France?',
    confidence: '99%',
    reasoning: 'A factual recall question with no additional reasoning required.',
  },
  {
    label: 'Easy',
    color: 'lime',
    question: 'What is the value of 8 + 5?',
    confidence: '98%',
    reasoning: 'Direct recall and a single arithmetic step make this accessible to beginners.',
  },
  {
    label: 'Medium',
    color: 'yellow',
    question: 'Explain how photosynthesis supports energy flow in an ecosystem.',
    confidence: '91%',
    reasoning: 'Requires conceptual connection between a biological process and ecosystem behavior.',
  },
  {
    label: 'Hard',
    color: 'orange',
    question: 'Derive the time complexity of merge sort and compare it with quicksort under worst-case input.',
    confidence: '94%',
    reasoning: 'Combines derivation, comparison, and algorithmic reasoning across multiple cases.',
  },
  {
    label: 'Expert',
    color: 'red',
    question: 'Design and defend a novel distributed consensus protocol under Byzantine faults.',
    confidence: '92%',
    reasoning: 'Requires advanced synthesis, original design choices, and research-level evaluation.',
  },
];

const stats = [
  { value: 10000, suffix: '+', label: 'Questions Analyzed' },
  { value: 95, suffix: '%', label: 'Classification Accuracy' },
  { value: 500, suffix: '+', label: 'Active Students' },
  { value: 50, suffix: '+', label: 'Educators' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const buttonMotion = {
  whileHover: { scale: 1.04, y: -2 },
  whileTap: { scale: 0.98 },
  transition: { type: 'spring', stiffness: 420, damping: 18 },
};

function LogoLockup() {
  return (
    <a href="/home" className="flex items-center gap-0 shrink-0" aria-label="QDCA home">
      <img src={qdcaLogo} alt="QDCA logo" className="h-11 sm:h-12 w-auto object-contain -mr-1" />
      <span className="text-2xl font-extrabold tracking-tight text-qdca-purple">QDCA</span>
    </a>
  );
}

function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  const closeMenu = () => setIsOpen(false);

  return (
    <motion.header
      className="sticky top-0 z-50 border-b border-white/70 bg-white/85 shadow-sm backdrop-blur-xl"
      initial={{ y: -80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 150, damping: 22 }}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <LogoLockup />

        <div className="hidden items-center gap-8 lg:flex">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-sm font-semibold text-gray-600 transition-colors hover:text-qdca-purple"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <motion.div {...buttonMotion}>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl px-5 py-2.5 text-sm font-semibold text-qdca-purple transition-colors hover:bg-[#F7F1FF]"
            >
              Sign In
            </Link>
          </motion.div>
          <motion.div {...buttonMotion}>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-gradient-to-r from-qdca-grad-start to-qdca-grad-end px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-900/15 transition-[filter,box-shadow] hover:brightness-110 hover:shadow-xl hover:shadow-purple-900/25"
            >
              Get Started
            </Link>
          </motion.div>
        </div>

        <button
          type="button"
          className="inline-flex h-11 w-11 items-center justify-center rounded-2xl text-qdca-purple transition-colors hover:bg-[#F7F1FF] lg:hidden"
          onClick={() => setIsOpen((value) => !value)}
          aria-label={isOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={isOpen}
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </nav>

      {isOpen && (
        <motion.div
          className="border-t border-gray-100 bg-white px-4 py-4 shadow-lg lg:hidden"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
        >
          <div className="flex flex-col gap-2">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={closeMenu}
                className="rounded-xl px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-[#F7F1FF] hover:text-qdca-purple"
              >
                {link.label}
              </a>
            ))}
            <div className="mt-2 grid grid-cols-2 gap-3">
              <Link
                to="/login"
                onClick={closeMenu}
                className="rounded-2xl border border-gray-200 px-4 py-2.5 text-center text-sm font-semibold text-qdca-purple"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={closeMenu}
                className="rounded-2xl bg-gradient-to-r from-qdca-grad-start to-qdca-grad-end px-4 py-2.5 text-center text-sm font-semibold text-white shadow-lg shadow-purple-900/15"
              >
                Get Started
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </motion.header>
  );
}

function SectionShell({ id, eyebrow, title, description, children, className = '' }) {
  return (
    <section id={id} className={`relative px-4 py-16 sm:px-6 lg:px-8 lg:py-24 ${className}`}>
      <div className="mx-auto max-w-7xl">
        {(title || description) && (
          <Reveal className="mx-auto mb-10 max-w-3xl text-center lg:mb-14">
            {eyebrow && <p className="mb-3 text-sm font-bold uppercase tracking-[0.18em] text-qdca-purple">{eyebrow}</p>}
            {title && <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>}
            {description && <p className="mt-4 text-base font-medium leading-7 text-gray-500 sm:text-lg">{description}</p>}
          </Reveal>
        )}
        {children}
      </div>
    </section>
  );
}

function Reveal({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={reduceMotion ? undefined : fadeUp}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion || isInView ? 'visible' : 'hidden'}
      transition={{ duration: 0.55, ease: 'easeOut', delay }}
    >
      {children}
    </motion.div>
  );
}

function HeroIllustration() {
  return (
    <>
      {/* Desktop — full AuthIllustration panel */}
      <div className="hidden lg:flex items-center justify-center relative overflow-hidden w-full">
        <AuthIllustration panelKey="landing-hero" brainId="landing-brain-half" showBranding={false} className="!w-full" />
      </div>

      {/* Mobile / Tablet — compact inline illustration */}
      <div className="flex lg:hidden justify-center mt-8 mb-2" aria-hidden="true">
        <div className="relative w-full max-w-[340px] sm:max-w-[420px]">
          {/* Ambient glow */}
          <div className="absolute inset-0 rounded-full bg-[#F3E5D8] blur-3xl opacity-60 scale-75" />

          {/* Brain + cards layout */}
          <div className="relative flex flex-col items-center gap-4">
            {/* Top row — ? bubbles + brain */}
            <div className="relative flex items-center justify-center w-full h-[180px] sm:h-[200px]">
              {/* Purple ? bubble */}
              <motion.div
                className="absolute left-[8%] top-0 w-12 h-12 rounded-2xl bg-[#EBE2F8] flex items-center justify-center glass-shadow -rotate-2"
                animate={{ y: [0, -6, 0] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              >
                <span className="text-xl font-extrabold text-[#3D1A6A]">?</span>
              </motion.div>
              {/* Beige ? bubble */}
              <motion.div
                className="absolute left-[22%] top-[40%] w-10 h-10 rounded-xl bg-[#F5E8D3] flex items-center justify-center glass-shadow rotate-2"
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              >
                <span className="text-base font-extrabold text-[#4A3B2C]">?</span>
              </motion.div>
              {/* Brain SVG — center */}
              <motion.div
                className="w-[130px] h-[130px] sm:w-[150px] sm:h-[150px]"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.3, type: 'spring', stiffness: 200, damping: 18 }}
              >
                <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl">
                  <defs>
                    <g id="mobile-brain-half">
                      <path d="M 50 10 C 42 10, 38 12, 36 16 C 28 14, 22 18, 20 24 C 12 26, 8 32, 10 40 C 4 44, 4 52, 8 58 C 4 66, 8 74, 16 76 C 18 84, 26 88, 34 84 C 40 90, 48 90, 50 86" fill="#EBE2F8" stroke="#A27BCF" strokeWidth="1.5" strokeLinejoin="round"/>
                      <path d="M 46 22 L 38 22 L 32 28 L 22 28" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="22" cy="28" r="1.5" fill="#A27BCF"/>
                      <path d="M 32 28 L 32 38 L 26 38" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="26" cy="38" r="1.5" fill="#A27BCF"/>
                      <path d="M 34 44 L 28 44 L 24 38 L 16 38" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="16" cy="38" r="1.5" fill="#A27BCF"/>
                      <path d="M 34 56 L 28 56 L 24 62 L 16 62" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="16" cy="62" r="1.5" fill="#A27BCF"/>
                      <path d="M 46 78 L 38 78 L 32 72 L 22 72" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round"/>
                      <circle cx="22" cy="72" r="1.5" fill="#A27BCF"/>
                    </g>
                  </defs>
                  <use href="#mobile-brain-half"/>
                  <use href="#mobile-brain-half" transform="translate(100,0) scale(-1,1)"/>
                  <path d="M 50 10 L 50 34" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round"/>
                  <path d="M 50 66 L 50 86" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round"/>
                  <rect x="33" y="33" width="34" height="34" rx="6" fill="#4A2385"/>
                  <text x="50" y="55" fill="white" fontSize="17" fontWeight="bold" textAnchor="middle" fontFamily="Poppins">AI</text>
                </svg>
              </motion.div>
              {/* Analytics mini card — right */}
              <motion.div
                className="absolute right-0 top-2 w-[100px] sm:w-[115px] bg-white rounded-2xl p-3 glass-shadow"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5, type: 'spring', stiffness: 200, damping: 18 }}
              >
                <div className="flex justify-between items-end mb-2">
                  <div className="flex items-end gap-1 h-8">
                    <div className="w-2.5 bg-[#D1C4E9] rounded-t h-3"></div>
                    <div className="w-2.5 bg-[#9575CD] rounded-t h-5"></div>
                    <div className="w-2.5 bg-[#4527A0] rounded-t h-8"></div>
                  </div>
                  <svg className="w-8 h-8" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EDE7F6" strokeWidth="9"/>
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 15.9155 15.9155" fill="none" stroke="#4527A0" strokeWidth="9"/>
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="h-1.5 bg-[#EAEAEA] rounded-full w-full"></div>
                  <div className="h-1.5 bg-[#EAEAEA] rounded-full w-3/4"></div>
                </div>
              </motion.div>
            </div>

            {/* Bottom row — Easy / Medium / Hard cards */}
            <div className="flex gap-3 sm:gap-4">
              {[
                { level: 'Easy',   color: '#67A06F', face: 'easy'   },
                { level: 'Medium', color: '#EEB34A', face: 'medium' },
                { level: 'Hard',   color: '#D46C64', face: 'hard'   },
              ].map(({ level, color, face }, i) => (
                <motion.div
                  key={level}
                  className="bg-white rounded-[16px] px-3 py-3 glass-shadow w-[88px] sm:w-[100px] flex flex-col items-center gap-2"
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + i * 0.1, type: 'spring', stiffness: 200, damping: 18 }}
                >
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex flex-col items-center justify-center shadow-inner" style={{ backgroundColor: color }}>
                    <div className={`flex gap-2 ${face === 'hard' ? 'mb-1.5' : 'mb-1'}`}>
                      <div className="w-1 h-1 bg-[#1F2937] rounded-full"></div>
                      <div className="w-1 h-1 bg-[#1F2937] rounded-full"></div>
                    </div>
                    {face === 'easy' && <svg width="14" height="7" viewBox="0 0 24 12" fill="none"><path d="M4 4 C4 4 12 12 20 4" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                    {face === 'medium' && <div className="w-3 h-0.5 bg-[#1F2937] rounded-full mt-1"></div>}
                    {face === 'hard' && <svg width="14" height="7" viewBox="0 0 24 12" fill="none"><path d="M4 8 C4 8 12 0 20 8" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round"/></svg>}
                  </div>
                  <span className="text-xs font-semibold text-gray-800">{level}</span>
                  <div className="flex w-full h-1.5 rounded-full overflow-hidden">
                    <div className="w-1/2" style={{ backgroundColor: color }}></div>
                    <div className="w-1/2 bg-[#EAEAEA]"></div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function HeroSection() {
  return (
    <section id="home" className="relative overflow-hidden px-4 pb-16 pt-12 sm:px-6 lg:px-8 lg:pb-24 lg:pt-20">
      <div className="absolute -left-24 top-10 h-96 w-96 rounded-full bg-[#F3E5D8] opacity-70 blur-3xl" aria-hidden="true" />
      <div className="absolute right-0 top-40 h-72 w-72 rounded-full bg-[#F3E5D8] opacity-60 blur-3xl" aria-hidden="true" />
      <div className="absolute left-10 top-24 h-32 w-32 dotted-pattern opacity-50" aria-hidden="true" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1fr_0.95fr]">
        <div className="max-w-3xl text-center lg:text-left">
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-purple-100 bg-white px-4 py-2 text-sm font-bold text-qdca-purple shadow-sm">
            <Sparkles size={16} />
            AI-powered academic intelligence
          </div>
          <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            AI-Powered Question Difficulty Classification
          </h1>
          <p className="mt-6 text-base font-medium leading-8 text-gray-500 sm:text-lg lg:max-w-2xl">
            Classify academic questions across five clear levels, from Very Easy to Expert.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center lg:justify-start">
            <motion.div {...buttonMotion}>
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-qdca-grad-start to-qdca-grad-end px-6 py-3.5 text-base font-semibold text-white shadow-lg shadow-purple-900/15 transition-[filter,box-shadow] hover:brightness-110 hover:shadow-xl hover:shadow-purple-900/25"
              >
                Get Started
                <ArrowRight size={19} />
              </Link>
            </motion.div>
            <motion.a
              href="#features"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-gray-200 bg-white px-6 py-3.5 text-base font-semibold text-qdca-purple shadow-sm transition-colors hover:bg-[#F7F1FF]"
              {...buttonMotion}
            >
              Explore Features
              <ChevronRight size={19} />
            </motion.a>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-3 sm:grid-cols-3 lg:max-w-2xl">
            {['95%\nAccuracy', '10K+ Questions Analyzed', '500+\nStudents'].map((item) => (
              <div key={item} className="rounded-[20px] bg-white px-5 py-2.5 text-center glass-shadow">
                <p className="whitespace-pre-line text-sm font-extrabold text-qdca-purple sm:text-base">{item}</p>
              </div>
            ))}
          </div>
        </div>

        <HeroIllustration />
      </div>
    </section>
  );
}

function FeaturesSection() {
  return (
    <SectionShell
      id="features"
      eyebrow="Features"
      title="Powerful AI Features"
      description="Everything educators need to classify, compare, and explain academic question difficulty with confidence."
    >
      <motion.div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <motion.article
              key={feature.title}
              variants={fadeUp}
              whileHover={{ y: -8, scale: 1.02 }}
              transition={{ type: 'spring', stiffness: 320, damping: 22 }}
              className="rounded-[28px] bg-white p-6 glass-shadow"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F1FF] text-qdca-purple">
                <Icon size={27} />
              </div>
              <h3 className="text-lg font-extrabold text-gray-900">{feature.title}</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-gray-500">{feature.description}</p>
            </motion.article>
          );
        })}
      </motion.div>
    </SectionShell>
  );
}

function HowItWorks() {
  return (
    <SectionShell id="how-it-works" eyebrow="Workflow" title="How It Works">
      <motion.div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {workflowSteps.map((step, index) => {
          const Icon = step.icon;
          return (
            <motion.article
              key={step.title}
              variants={fadeUp}
              whileHover={{ y: -6 }}
              className="relative rounded-[28px] bg-white p-6 glass-shadow"
            >
              {index < workflowSteps.length - 1 && (
                <div className="absolute -right-5 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white text-qdca-purple shadow-md lg:flex">
                  <ArrowRight size={20} />
                </div>
              )}
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-qdca-grad-start to-qdca-grad-end text-white shadow-lg shadow-purple-900/15">
                <Icon size={26} />
              </div>
              <p className="mb-2 text-sm font-extrabold text-qdca-purple">Step {index + 1}</p>
              <h3 className="text-lg font-extrabold text-gray-900">{step.title}</h3>
              <p className="mt-3 text-sm font-medium leading-6 text-gray-500">{step.description}</p>
            </motion.article>
          );
        })}
      </motion.div>
    </SectionShell>
  );
}

function DifficultyShowcase() {
  const theme = {
    green: {
      badge: 'bg-green-100 text-green-700',
      ring: 'border-green-100',
      dot: 'bg-green-500',
      bar: 'from-green-400 to-green-600',
    },
    lime: {
      badge: 'bg-lime-100 text-lime-700',
      ring: 'border-lime-100',
      dot: 'bg-lime-500',
      bar: 'from-lime-400 to-lime-600',
    },
    yellow: {
      badge: 'bg-yellow-100 text-yellow-700',
      ring: 'border-yellow-100',
      dot: 'bg-yellow-500',
      bar: 'from-yellow-400 to-yellow-600',
    },
    orange: {
      badge: 'bg-orange-100 text-orange-700',
      ring: 'border-orange-100',
      dot: 'bg-orange-500',
      bar: 'from-orange-400 to-orange-600',
    },
    red: {
      badge: 'bg-red-100 text-red-700',
      ring: 'border-red-100',
      dot: 'bg-red-500',
      bar: 'from-red-400 to-red-600',
    },
  };

  return (
    <SectionShell
      id="showcase"
      eyebrow="Difficulty"
      title="Difficulty Showcase"
      description="Preview how QDCA presents classification labels, confidence, and reasoning in one readable result."
    >
      <motion.div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {difficultyCards.map((card) => {
          const cardTheme = theme[card.color];
          return (
            <motion.article
              key={card.label}
              variants={fadeUp}
              whileHover={{ scale: 1.025, y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              className={`rounded-[28px] border bg-white p-6 glass-shadow ${cardTheme.ring}`}
            >
              <div className="mb-5 flex items-center justify-between gap-4">
                <span className={`rounded-full px-4 py-1.5 text-sm font-extrabold ${cardTheme.badge}`}>{card.label}</span>
                <div className="flex items-center gap-2 text-sm font-bold text-gray-500">
                  <span className={`h-2.5 w-2.5 rounded-full ${cardTheme.dot}`} />
                  {card.confidence}
                </div>
              </div>
              <p className="min-h-[92px] rounded-2xl bg-gray-50 p-4 text-sm font-semibold leading-6 text-gray-700">
                {card.question}
              </p>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-xs font-bold uppercase tracking-[0.14em] text-gray-400">
                  <span>Confidence</span>
                  <span>{card.confidence}</span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-gray-100">
                  <div className={`h-full rounded-full bg-gradient-to-r ${cardTheme.bar}`} style={{ width: card.confidence }} />
                </div>
              </div>
              <p className="mt-5 text-sm font-medium leading-6 text-gray-500">{card.reasoning}</p>
            </motion.article>
          );
        })}
      </motion.div>
    </SectionShell>
  );
}

function AnimatedCounter({ value, suffix }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const [count, setCount] = useState(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!isInView || reduceMotion) return undefined;

    let frameId;
    const duration = 1200;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(value * eased));
      if (progress < 1) frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isInView, reduceMotion, value]);

  return (
    <span ref={ref}>
      {(isInView && reduceMotion ? value : count).toLocaleString()}
      {suffix}
    </span>
  );
}

function StatisticsSection() {
  return (
    <SectionShell id="statistics" eyebrow="Impact" title="QDCA By The Numbers" className="pt-10 lg:pt-14">
      <motion.div
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4"
        variants={stagger}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: '-80px' }}
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={fadeUp}
            whileHover={{ y: -6 }}
            className="rounded-[28px] bg-white p-6 text-center glass-shadow"
          >
            <p className="text-4xl font-extrabold text-qdca-purple">
              <AnimatedCounter value={stat.value} suffix={stat.suffix} />
            </p>
            <p className="mt-3 text-sm font-bold text-gray-500">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>
    </SectionShell>
  );
}

function CTASection() {
  return (
    <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
      <Reveal className="mx-auto max-w-5xl overflow-hidden rounded-[32px] bg-gradient-to-r from-qdca-grad-start to-qdca-grad-end p-8 text-center text-white shadow-2xl shadow-purple-900/20 sm:p-12">
        <p className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-white/70">Get Started</p>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Ready to Classify Questions Smarter?</h2>
        <p className="mx-auto mt-4 max-w-2xl text-base font-medium leading-7 text-white/80">
          Join QDCA and leverage AI-powered difficulty classification.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <motion.div {...buttonMotion}>
            <Link
              to="/signup"
              className="inline-flex items-center justify-center rounded-2xl bg-white px-6 py-3.5 text-base font-bold text-qdca-purple shadow-lg"
            >
              Create Account
            </Link>
          </motion.div>
          <motion.div {...buttonMotion}>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-2xl border border-white/30 px-6 py-3.5 text-base font-bold text-white transition-colors hover:bg-white/10"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </Reveal>
    </section>
  );
}

function ContactSection() {
  return (
    <SectionShell
      id="contact"
      eyebrow="Contact"
      title="Get In Touch"
      description="Have questions about QDCA, classroom use, or AI-powered question analysis? Reach out to the team."
    >
      <Reveal className="mx-auto grid max-w-4xl gap-5 md:grid-cols-2">
        <motion.a
          href="mailto:support@qdca.ai"
          className="rounded-[28px] bg-white p-6 glass-shadow"
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F1FF] text-qdca-purple">
            <Mail size={26} />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">Email Support</h3>
          <p className="mt-3 text-sm font-medium leading-6 text-gray-500">support@qdca.ai</p>
        </motion.a>

        <motion.div
          className="rounded-[28px] bg-white p-6 glass-shadow"
          whileHover={{ y: -6, scale: 1.02 }}
          transition={{ type: 'spring', stiffness: 320, damping: 22 }}
        >
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#F7F1FF] text-qdca-purple">
            <Sparkles size={26} />
          </div>
          <h3 className="text-lg font-extrabold text-gray-900">Platform Queries</h3>
          <p className="mt-3 text-sm font-medium leading-6 text-gray-500">
            Ask about AI classification, educator workflows, question paper analysis, or account setup.
          </p>
        </motion.div>
      </Reveal>
    </SectionShell>
  );
}

function Footer() {
  const footerLinks = [
    { label: 'Home', href: '#home' },
    { label: 'Features', href: '#features' },
    { label: 'Login', to: '/login' },
    { label: 'Signup', to: '/signup' },
    { label: 'Privacy Policy', to: '/privacy' },
    { label: 'Terms of Service', to: '/terms' },
  ];

  return (
    <footer className="border-t border-purple-900/10 bg-[linear-gradient(135deg,#2D0B59_0%,#3B126E_46%,#181022_100%)] px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <a href="/home" className="flex items-center gap-0 shrink-0" aria-label="QDCA home">
            <img src={qdcaLogo} alt="QDCA logo" className="h-11 sm:h-12 w-auto object-contain -mr-1" />
            <span className="text-2xl font-extrabold tracking-tight text-white">QDCA</span>
          </a>
          <p className="mt-3 max-w-md text-sm font-medium leading-6 text-white/70">
            AI-powered difficulty classification for academic questions, question papers, and learning analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-3 lg:justify-end">
          {footerLinks.map((link) =>
            link.to ? (
              <Link key={link.label} to={link.to} className="text-sm font-semibold text-white/70 transition-colors hover:text-white">
                {link.label}
              </Link>
            ) : (
              <a key={link.label} href={link.href} className="text-sm font-semibold text-white/70 transition-colors hover:text-white">
                {link.label}
              </a>
            ),
          )}
        </div>
      </div>
      <div className="mx-auto mt-8 max-w-7xl border-t border-white/15 pt-6 text-sm font-medium text-white/45">
        © 2026 Question Difficulty Classification Agent (QDCA)
      </div>
    </footer>
  );
}

function LandingPage() {
  return (
    <main className="min-h-screen bg-qdca-bg text-gray-900">
      <Seo
        title="Question Difficulty Classification Agent"
        description="AI-powered question difficulty classification for academic questions using NLP and Machine Learning."
        path="/home"
      />
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <HowItWorks />
      <DifficultyShowcase />
      <StatisticsSection />
      <CTASection />
      <ContactSection />
      <Footer />
    </main>
  );
}

export {
  CTASection,
  DifficultyShowcase,
  FeaturesSection,
  Footer,
  HeroSection,
  HowItWorks,
  ContactSection,
  StatisticsSection,
};

export default LandingPage;

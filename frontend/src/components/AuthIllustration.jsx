import { motion, useReducedMotion } from 'framer-motion';

const illustrationPopHover = {
  whileHover: {
    scale: 1.08,
    boxShadow: '0 20px 50px -12px rgba(45, 11, 89, 0.22)',
  },
  transition: { type: 'spring', stiffness: 400, damping: 20 },
};

const brainPopHover = {
  whileHover: { scale: 1.08 },
  transition: illustrationPopHover.transition,
};

const titleWords = ['Question', 'Difficulty', 'Classification', 'Agent'];

const titleWordPop = {
  hidden: { opacity: 0, y: 24, scale: 0.82 },
  visible: (index) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: 0.18 + index * 0.16,
      type: 'spring',
      stiffness: 420,
      damping: 18,
    },
  }),
};

const figurePop = {
  hidden: { opacity: 0, y: 28, scale: 0.72 },
  visible: (delay) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay,
      type: 'spring',
      stiffness: 360,
      damping: 18,
    },
  }),
};

function PopFigure({ delay, className = '', children }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      className={className}
      custom={delay}
      variants={reduceMotion ? undefined : figurePop}
      initial={reduceMotion ? false : 'hidden'}
      animate={reduceMotion ? undefined : 'visible'}
    >
      {children}
    </motion.div>
  );
}

function Floating({ children, y = -8, duration = 2, delay = 0 }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      animate={reduceMotion ? undefined : { y: [0, y, 0] }}
      transition={{ duration, repeat: Infinity, ease: 'easeInOut', delay }}
    >
      {children}
    </motion.div>
  );
}

function DifficultyCard({ delay, level, color, face }) {
  return (
    <PopFigure delay={delay}>
      <motion.div
        className="bg-white px-5 py-5 rounded-[20px] glass-shadow w-[110px] flex flex-col items-center gap-3 cursor-pointer"
        animate={{ y: [0, -5, 0] }}
        whileHover={illustrationPopHover.whileHover}
        transition={{
          y: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' },
          scale: illustrationPopHover.transition,
          boxShadow: illustrationPopHover.transition,
        }}
      >
        <div className="w-14 h-14 rounded-full flex flex-col items-center justify-center shadow-inner" style={{ backgroundColor: color }}>
          <div className={`flex gap-2.5 ${face === 'medium' ? 'mb-1.5' : face === 'hard' ? 'mb-2' : 'mb-1'}`}>
            <div className="w-1.5 h-1.5 bg-[#1F2937] rounded-full"></div>
            <div className="w-1.5 h-1.5 bg-[#1F2937] rounded-full"></div>
          </div>
          {face === 'easy' && (
            <svg width="20" height="10" viewBox="0 0 24 12" fill="none" aria-hidden="true">
              <path d="M4 4 C4 4 12 12 20 4" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
          {face === 'medium' && <div className="w-[18px] h-[3px] bg-[#1F2937] mt-1.5 rounded-full"></div>}
          {face === 'hard' && (
            <svg width="20" height="10" viewBox="0 0 24 12" fill="none" aria-hidden="true">
              <path d="M4 8 C4 8 12 0 20 8" stroke="#1F2937" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          )}
        </div>
        <span className="text-sm font-semibold text-gray-900 mt-1">{level}</span>
        <div className="flex w-full h-2.5 rounded-full overflow-hidden mt-1">
          <div className="w-1/2" style={{ backgroundColor: color }}></div>
          <div className="w-1/2 bg-[#EAEAEA]"></div>
        </div>
      </motion.div>
    </PopFigure>
  );
}

function BrainGraphic({ brainId = 'brain-half' }) {
  return (
    <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-xl" role="img" aria-label="AI brain illustration">
      <defs>
        <g id={brainId}>
          <path d="M 50 10 C 42 10, 38 12, 36 16 C 28 14, 22 18, 20 24 C 12 26, 8 32, 10 40 C 4 44, 4 52, 8 58 C 4 66, 8 74, 16 76 C 18 84, 26 88, 34 84 C 40 90, 48 90, 50 86" fill="#EBE2F8" stroke="#A27BCF" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M 46 22 L 38 22 L 32 28 L 22 28" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="22" cy="28" r="1.5" fill="#A27BCF" />
          <path d="M 32 28 L 32 38 L 26 38" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="26" cy="38" r="1.5" fill="#A27BCF" />
          <path d="M 34 44 L 28 44 L 24 38 L 16 38" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="38" r="1.5" fill="#A27BCF" />
          <path d="M 34 56 L 28 56 L 24 62 L 16 62" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="16" cy="62" r="1.5" fill="#A27BCF" />
          <path d="M 46 78 L 38 78 L 32 72 L 22 72" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="22" cy="72" r="1.5" fill="#A27BCF" />
          <path d="M 32 72 L 32 62 L 26 62" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="26" cy="62" r="1.5" fill="#A27BCF" />
          <path d="M 14 48 L 18 48 L 20 50 L 20 54" fill="none" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </defs>
      <use href={`#${brainId}`} />
      <use href={`#${brainId}`} transform="translate(100, 0) scale(-1, 1)" />
      <path d="M 50 10 L 50 34" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M 50 66 L 50 86" stroke="#A27BCF" strokeWidth="1.5" strokeLinecap="round" />
      <rect x="33" y="33" width="34" height="34" rx="6" fill="#4A2385" />
      <text x="50" y="55" fill="white" fontSize="17" fontWeight="bold" textAnchor="middle" fontFamily="Poppins">AI</text>
    </svg>
  );
}

function NetworkLines() {
  return (
    <motion.svg
      className="absolute inset-0 w-full h-full text-[#B5A5C4] opacity-60 pointer-events-none"
      style={{ zIndex: 0 }}
      animate={{ opacity: [0.3, 1, 0.3] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      aria-hidden="true"
    >
      <path d="M 620 50 L 720 80 L 800 60 L 750 140 Z" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <path d="M 720 80 L 660 30" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <path d="M 800 60 L 840 40" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <circle cx="620" cy="50" r="6" fill="#D3C5E5" />
      <circle cx="720" cy="80" r="7" fill="#D3C5E5" />
      <circle cx="800" cy="60" r="6" fill="#D3C5E5" />
      <circle cx="750" cy="140" r="7" fill="#D3C5E5" />
      <circle cx="660" cy="30" r="5" fill="#D3C5E5" />
      <path d="M 360 200 L 280 150 L 240 150" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <circle cx="240" cy="150" r="4" fill="#D3C5E5" />
      <path d="M 330 250 L 200 230 L 160 230" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <circle cx="160" cy="230" r="4" fill="#D3C5E5" />
      <path d="M 350 340 L 280 340 L 280 380 L 250 380" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <path d="M 370 380 L 320 420 L 250 420" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <circle cx="250" cy="380" r="4" fill="#D3C5E5" />
      <circle cx="250" cy="420" r="4" fill="#D3C5E5" />
      <path d="M 500 220 L 560 220" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <path d="M 520 280 L 560 280 L 560 260" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <circle cx="560" cy="220" r="4" fill="#D3C5E5" />
      <circle cx="560" cy="280" r="4" fill="#D3C5E5" />
      <path d="M 400 390 L 370 410 L 370 440" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <path d="M 460 390 L 480 410 L 480 440" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
      <path d="M 510 360 L 590 390 L 590 440" stroke="currentColor" strokeWidth="2" strokeDasharray="6,6" fill="none" />
    </motion.svg>
  );
}

function AuthIllustration({ panelKey = 'auth-left-panel', brainId = 'brain-half', showBranding = true, className = '' }) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.aside
      key={panelKey}
      className={`hidden lg:flex flex-col justify-center w-1/2 relative z-10 ${showBranding ? 'px-16 xl:px-24' : 'px-4 xl:px-8 items-center'} ${className}`}
      initial={reduceMotion ? false : { opacity: 0, x: -90 }}
      animate={reduceMotion ? undefined : { opacity: 1, x: 0 }}
      transition={{ type: 'spring', stiffness: 120, damping: 22 }}
      aria-label="Question difficulty classification overview"
    >
      {showBranding && (
      <div className="max-w-xl mb-6 relative">
        <svg className="absolute -right-20 top-1/2 w-48 h-48 text-gray-300 opacity-50 pointer-events-none" viewBox="0 0 200 200" aria-hidden="true">
          <path d="M0,100 C50,100 100,50 200,50" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="5,5" />
        </svg>
        <div className="flex items-start gap-4 xl:gap-5 mb-4">
          <motion.h1
            className="text-qdca-purple text-4xl xl:text-5xl font-extrabold leading-[1.1] tracking-tight cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ scale: { type: 'spring', stiffness: 400, damping: 20 } }}
          >
            {titleWords.map((word, index) => (
              <motion.span
                key={word}
                className="inline-block mr-3"
                custom={index}
                variants={reduceMotion ? undefined : titleWordPop}
                initial={reduceMotion ? false : 'hidden'}
                animate={reduceMotion ? undefined : 'visible'}
              >
                {word}
                {index === 1 && <br />}
              </motion.span>
            ))}
          </motion.h1>
        </div>
        <motion.p
          className="text-gray-500 text-base xl:text-lg font-medium leading-relaxed max-w-md cursor-pointer"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={reduceMotion ? undefined : { opacity: 1 }}
          whileHover={{ scale: 1.02 }}
          transition={{
            opacity: { delay: 0.4, duration: 0.8 },
            scale: { type: 'spring', stiffness: 400, damping: 20 },
          }}
        >
          AI-powered classification across five levels, from Very Easy to Expert.
        </motion.p>
      </div>
      )}

      <div className="relative w-full mt-4 h-[300px] xl:h-[330px] 2xl:h-[390px] min-[1800px]:h-[480px]" aria-hidden="true">
        <div className="absolute top-0 left-0 w-[800px] h-[600px] origin-top-left scale-[0.5] xl:scale-[0.55] 2xl:scale-[0.65] min-[1800px]:scale-[0.8] transition-transform duration-300">
          <motion.div
            className="relative w-full h-full"
            initial={reduceMotion ? false : { opacity: 0, scale: 0.95 }}
            animate={reduceMotion ? undefined : { opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
          >
            <NetworkLines />

            <div className="absolute top-[280px] left-[420px] transform -translate-x-1/2 -translate-y-1/2 z-10 w-[260px] h-[260px] cursor-pointer">
              <PopFigure delay={0.85} className="w-full h-full">
                <Floating y={-12} duration={3}>
                  <motion.div className="w-full h-full" {...brainPopHover}>
                    <BrainGraphic brainId={brainId} />
                  </motion.div>
                </Floating>
              </PopFigure>
            </div>

            <div className="absolute top-[80px] left-[160px] transform -rotate-2 z-10 cursor-pointer">
              <PopFigure delay={1.05}>
                <Floating delay={0}>
                  <motion.div className="bg-[#EBE2F8] rounded-[24px] rounded-br-sm w-20 h-16 flex items-center justify-center glass-shadow" {...illustrationPopHover}>
                    <span className="text-[#3D1A6A] font-extrabold text-3xl">?</span>
                  </motion.div>
                </Floating>
              </PopFigure>
            </div>

            <div className="absolute top-[180px] left-[80px] transform rotate-2 z-10 cursor-pointer">
              <PopFigure delay={1.2}>
                <Floating delay={0.5}>
                  <motion.div className="bg-[#F5E8D3] rounded-[20px] rounded-bl-sm w-16 h-14 flex items-center justify-center glass-shadow" {...illustrationPopHover}>
                    <span className="text-[#4A3B2C] font-extrabold text-2xl">?</span>
                  </motion.div>
                </Floating>
              </PopFigure>
            </div>

            <div className="absolute top-[120px] left-[560px] z-10 cursor-pointer">
              <PopFigure delay={1.35}>
                <Floating delay={1}>
                  <motion.div className="bg-white p-6 rounded-[20px] glass-shadow w-[250px]" {...illustrationPopHover}>
                    <div className="flex justify-between items-end mb-6">
                      <div className="flex items-end gap-2 h-14">
                        <div className="w-4 bg-[#D1C4E9] h-6 rounded-t-sm"></div>
                        <div className="w-4 bg-[#9575CD] h-10 rounded-t-sm"></div>
                        <div className="w-4 bg-[#4527A0] h-14 rounded-t-sm"></div>
                      </div>
                      <svg className="w-14 h-14" viewBox="0 0 36 36" aria-hidden="true">
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#EDE7F6" strokeWidth="9" />
                        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 15.9155 15.9155" fill="none" stroke="#4527A0" strokeWidth="9" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-start gap-5">
                      <div className="w-[40%] mt-2"><div className="h-3 bg-[#EAEAEA] rounded-full w-full"></div></div>
                      <div className="w-[50%] space-y-3">
                        <div className="h-2 bg-[#EAEAEA] rounded-full w-full"></div>
                        <div className="h-2 bg-[#EAEAEA] rounded-full w-full"></div>
                        <div className="h-2 bg-[#EAEAEA] rounded-full w-3/4"></div>
                      </div>
                    </div>
                  </motion.div>
                </Floating>
              </PopFigure>
            </div>

            <div className="absolute top-[260px] left-[20px] z-10 cursor-pointer">
              <PopFigure delay={1.5}>
                <motion.div className="bg-white p-5 rounded-[20px] glass-shadow w-56" {...illustrationPopHover}>
                  <div className="flex items-center gap-4 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[#EAE2F3] flex items-center justify-center shadow-sm">
                      <span className="text-[#3D1A6A] font-extrabold text-lg">Q</span>
                    </div>
                    <div className="space-y-2.5 flex-1">
                      <div className="h-2.5 bg-[#EAEAEA] rounded-full w-full"></div>
                      <div className="h-2.5 bg-[#EAEAEA] rounded-full w-2/3"></div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {['A', 'B', 'C', 'D'].map((letter) => (
                      <div key={letter} className="flex items-center gap-4">
                        <div className="w-6 h-6 rounded-full bg-[#F3F0F7] flex items-center justify-center text-[11px] font-bold text-[#3D1A6A]">{letter}</div>
                        <div className="h-2.5 rounded-full flex-1 bg-[#EAEAEA]"></div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              </PopFigure>
            </div>

            <div className="absolute top-[440px] left-[320px] flex gap-6 z-10">
              <DifficultyCard delay={1.65} level="Easy" color="#67A06F" face="easy" />
              <DifficultyCard delay={1.8} level="Medium" color="#EEB34A" face="medium" />
              <DifficultyCard delay={1.95} level="Hard" color="#D46C64" face="hard" />
            </div>
          </motion.div>
        </div>
      </div>
    </motion.aside>
  );
}

export default AuthIllustration;

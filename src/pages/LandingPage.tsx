import React from 'react';
import {
  FileText,
  Users,
  HardDrive,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Sigma,
  GitBranch,
  Sparkles,
  Lock,
  Layers,
  FileCheck,
} from 'lucide-react';

interface LandingPageProps {
  onOpenEditor: () => void;
  onOpenDashboard: () => void;
  onOpenLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenEditor,
  onOpenDashboard,
  onOpenLogin,
}) => {
  return (
    <div className="min-h-full bg-stone-50 text-stone-900 selection:bg-indigo-100 selection:text-indigo-900 font-sans">
      {/* Hero Section */}
      <section className="relative pt-12 pb-16 md:pt-20 md:pb-24 border-b border-stone-200 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center space-x-2 text-xs font-semibold text-indigo-700 bg-indigo-50 px-3 py-1 rounded-md border border-indigo-100">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Next-Generation Academic Writing Infrastructure</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-serif font-bold text-stone-900 tracking-tight leading-[1.15] text-balance">
                Write, review, and publish scientific research together in real time.
              </h1>

              <p className="text-base sm:text-lg text-stone-600 font-serif leading-relaxed max-w-2xl">
                A centralized research workspace combining genuine multi-user CRDT synchronization, scientific equation typesetting, reference indexing, and institutional Google Drive integration.
              </p>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-wrap items-center gap-3">
                <button
                  onClick={onOpenEditor}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm rounded-xl shadow-xs flex items-center space-x-2 transition-all cursor-pointer"
                >
                  <span>Open Active Manuscript</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={onOpenDashboard}
                  className="px-5 py-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-sm rounded-xl border border-stone-300/80 transition-colors cursor-pointer"
                >
                  View Research Hub
                </button>
              </div>

              {/* Trust Metadata */}
              <div className="pt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-stone-500 font-medium">
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Real-time Yjs CRDT engine</span>
                </span>
                <span className="text-stone-300">·</span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>KaTeX mathematical notation</span>
                </span>
                <span className="text-stone-300">·</span>
                <span className="flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Google Drive connected</span>
                </span>
              </div>
            </div>

            {/* Right Hero Image */}
            <div className="lg:col-span-5 relative">
              <div className="rounded-2xl overflow-hidden border border-stone-200 shadow-xl bg-stone-100 relative group">
                <img
                  src="/src/assets/images/research_hero_banner_1793246708956.jpg"
                  alt="Modern scientific research laboratory"
                  className="w-full h-[360px] object-cover group-hover:scale-102 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-stone-900/60 via-transparent to-transparent flex items-end p-5">
                  <div className="text-white">
                    <p className="text-xs font-mono uppercase tracking-wider text-indigo-200">
                      Collaborative Lab Workspace
                    </p>
                    <p className="text-sm font-semibold mt-0.5">
                      Distributed Multi-Agent Systems Research Lab
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quantitative Rigor Strip */}
          <div className="mt-14 pt-8 border-t border-stone-200 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-stone-900 tabular-nums">0</p>
              <p className="text-xs text-stone-500 font-medium mt-1">Merge conflicts with Yjs CRDT</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-stone-900 tabular-nums">&lt; 30ms</p>
              <p className="text-xs text-stone-500 font-medium mt-1">WebSocket broadcast latency</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-stone-900 tabular-nums">100%</p>
              <p className="text-xs text-stone-500 font-medium mt-1">Non-destructive version recovery</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-mono font-bold text-stone-900 tabular-nums">4 Styles</p>
              <p className="text-xs text-stone-500 font-medium mt-1">IEEE, APA, Nature & Chicago</p>
            </div>
          </div>
        </div>
      </section>

      {/* Core Architectural Pillars */}
      <section className="py-16 md:py-24 bg-stone-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="text-2xl sm:text-3xl font-serif font-bold text-stone-900">
              Engineered for academic rigour and simultaneous collaboration.
            </h2>
            <p className="text-sm sm:text-base text-stone-600 font-serif mt-2">
              Unlike generic word processors, ResearchLab is purpose-built around peer review standards, academic equation typesetting, and institutional permissions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">Real-Time Multi-Author Editing</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Multiple authorized researchers edit different sections concurrently. Live cursors, character selections, and user avatars update near real time with conflict-free convergence.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                <Sigma className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">Scientific Mathematical Typesetting</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                First-class LaTeX math formula support with instant KaTeX rendering, formula palettes, and standard academic equation numbering (Eq. 1, Eq. 2).
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <BookOpen className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">BibTeX & Citation Synchronization</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Import from BibTeX and RIS files, insert in-text citations [1], [2], and automatically maintain bibliography numbering across IEEE, APA, and Nature formats.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                <GitBranch className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">Suggestions & Tracked Changes</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Reviewers suggest edits without overwriting main text. Co-authors discuss revisions via inline comments and @mentions, then accept or reject proposed changes.
              </p>
            </div>

            {/* Feature 5 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
                <FileCheck className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">DOCX & PDF Publication Exports</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Compile cleanly formatted Word (.docx) and PDF files with title page, abstract, justified paragraphs, tables, figure callouts, and formatted reference lists.
              </p>
            </div>

            {/* Feature 6 */}
            <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-2xs space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center font-bold">
                <HardDrive className="w-5 h-5" />
              </div>
              <h3 className="font-semibold text-stone-900 text-base">Google Drive Project Archiving</h3>
              <p className="text-xs text-stone-600 leading-relaxed font-serif">
                Export verified manuscript snapshots into designated Google Drive laboratory folders. Versioned filenames prevent accidental overwrites.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Visual Showcase Section */}
      <section className="py-16 md:py-24 bg-white border-t border-stone-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            <div>
              <img
                src="/src/assets/images/academic_paper_preview_1793246709732.jpg"
                alt="Academic journal manuscript preview"
                className="rounded-xl shadow-lg border border-stone-200 object-cover w-full h-[320px]"
              />
            </div>
            <div className="space-y-4">
              <span className="text-xs font-mono uppercase tracking-wider text-indigo-700 font-semibold">
                Publication-Ready Formatting
              </span>
              <h3 className="text-2xl font-serif font-bold text-stone-900">
                Seamless transition from raw collaborative draft to journal submission.
              </h3>
              <p className="text-sm text-stone-600 font-serif leading-relaxed">
                Whether submitting to IEEE, ACM, Nature, or arXiv, CollabScholar enforces academic layout standards including two-column layouts, running heads, and figure-table numbering.
              </p>
              <div className="pt-2">
                <button
                  onClick={onOpenEditor}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <span>Experience the live editor</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom CTA Banner */}
      <section className="py-16 bg-stone-900 text-white border-t border-stone-800">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold">
            Ready to collaborate on your next research manuscript?
          </h2>
          <p className="text-sm text-stone-400 font-serif max-w-xl mx-auto">
            Open the centralized editor now, invite co-authors, and experience real-time synchronized scientific writing.
          </p>
          <div className="flex justify-center items-center gap-3 pt-2">
            <button
              onClick={onOpenEditor}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors"
            >
              Open Editor
            </button>
            <button
              onClick={onOpenLogin}
              className="px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs rounded-xl border border-stone-700 transition-colors"
            >
              Sign In to Lab
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import {
  Brain, CheckCircle, AlertTriangle, XCircle, Zap, Send,
  IndianRupee, Home, RotateCcw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { plannerAPI } from '../../api';
import { formatCurrency } from '../../utils/helpers';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const FEASIBILITY_CONFIG = {
  'Possible':           { color: 'text-green-600',  bg: 'bg-green-50  border-green-200',  icon: CheckCircle,    bar: 'bg-green-500'  },
  'Partially Possible': { color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200', icon: AlertTriangle,  bar: 'bg-yellow-500' },
  'Not Recommended':    { color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200', icon: AlertTriangle,  bar: 'bg-orange-500' },
  'Not Possible':       { color: 'text-red-600',    bg: 'bg-red-50    border-red-200',    icon: XCircle,        bar: 'bg-red-500'    },
};

// Parse `FEASIBILITY: X` and `SCORE: Y` from the AI response text
function parseFeasibility(text) {
  const labelMatch = text.match(/FEASIBILITY:\s*(Possible|Partially Possible|Not Recommended|Not Possible)/i);
  const scoreMatch = text.match(/SCORE:\s*(\d+)/i);
  return {
    label: labelMatch?.[1] || 'Possible',
    score: scoreMatch ? Math.min(100, Math.max(0, parseInt(scoreMatch[1]))) : 80,
  };
}

// Convert markdown text to an array of {title, body} sections split by ## headings
function parseSections(text) {
  const parts = text.split(/^## /m).filter(Boolean);
  return parts.map(part => {
    const newline = part.indexOf('\n');
    return {
      title: newline > -1 ? part.slice(0, newline).trim() : part.trim(),
      body:  newline > -1 ? part.slice(newline + 1).trim() : '',
    };
  });
}

// Simple inline markdown renderer: **bold**, `code`
function InlineText({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
  return (
    <>
      {parts.map((p, i) => {
        if (p.startsWith('**') && p.endsWith('**')) return <strong key={i}>{p.slice(2, -2)}</strong>;
        if (p.startsWith('`')  && p.endsWith('`'))  return <code key={i} className="bg-gray-100 px-1 rounded text-xs font-mono">{p.slice(1, -1)}</code>;
        return p;
      })}
    </>
  );
}

// Render a markdown body (bullets, numbered lists, plain text)
function MarkdownBody({ text }) {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let inList = false;
  let listItems = [];

  const flushList = () => {
    if (listItems.length) {
      elements.push(
        <ul key={`list-${elements.length}`} className="space-y-1 mt-1 mb-2">
          {listItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600">
              <span className="text-primary flex-shrink-0 mt-0.5">•</span>
              <span><InlineText text={item} /></span>
            </li>
          ))}
        </ul>
      );
      listItems = [];
      inList = false;
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) { flushList(); continue; }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
      inList = true;
      listItems.push(trimmed.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, ''));
    } else if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(<p key={elements.length} className="font-semibold text-secondary text-sm mt-3 mb-1">{trimmed.slice(4)}</p>);
    } else {
      flushList();
      elements.push(<p key={elements.length} className="text-sm text-gray-600 mb-1"><InlineText text={trimmed} /></p>);
    }
  }
  flushList();
  return <>{elements}</>;
}

// ─── Section card ─────────────────────────────────────────────────────────────

const SECTION_ICONS = {
  'Feasibility Assessment':            '🏗️',
  'Floor-wise Room Layout':            '🏠',
  'Vastu & Orientation Guide':         '🧭',
  'Construction Phases & Timeline':    '📅',
  'Material Recommendations':          '🧱',
  'Detailed Budget Breakdown':         '💰',
  'Key Warnings & Legal Points':       '⚠️',
  'Expert Recommendations':            '💡',
};

function SectionCard({ title, body }) {
  const [open, setOpen] = useState(true);
  const icon = SECTION_ICONS[title] || '📋';
  const isWarning = title.includes('Warning') || title.includes('Legal');

  return (
    <div className={`card border ${isWarning ? 'border-orange-200 bg-orange-50' : ''}`}>
      <button
        className="w-full flex items-center justify-between gap-3 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">{icon}</span>
          <h3 className={`font-semibold text-sm ${isWarning ? 'text-orange-800' : 'text-secondary'}`}>{title}</h3>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-gray-400 flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <MarkdownBody text={body} />
        </div>
      )}
    </div>
  );
}

// ─── Streaming text display ───────────────────────────────────────────────────

function StreamingDisplay({ text }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.scrollTop = ref.current.scrollHeight;
  }, [text]);

  return (
    <div
      ref={ref}
      className="bg-gray-900 rounded-xl p-4 text-green-400 font-mono text-xs leading-relaxed max-h-96 overflow-y-auto"
    >
      <span className="text-gray-500 text-[10px] block mb-2">▶ AI is generating your house plan...</span>
      <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>
      <span className="inline-block w-2 h-3 bg-green-400 ml-0.5 animate-pulse" />
    </div>
  );
}

// ─── Chat panel ───────────────────────────────────────────────────────────────

function ChatPanel({ planContext }) {
  const [history,  setHistory]  = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  const send = async () => {
    const q = input.trim();
    if (!q || loading) return;
    setInput('');
    const newHistory = [...history, { role: 'user', content: q }];
    setHistory(newHistory);
    setLoading(true);
    try {
      const res = await plannerAPI.chat({ question: q, planContext, history });
      setHistory([...newHistory, { role: 'assistant', content: res.data.data.answer }]);
    } catch (e) {
      setHistory([...newHistory, { role: 'assistant', content: 'Sorry, could not get a response. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <h3 className="font-semibold text-secondary mb-3 flex items-center gap-2">
        <Brain className="w-4 h-4 text-primary" /> Ask a Follow-up Question
      </h3>

      {history.length === 0 && (
        <div className="text-sm text-gray-400 mb-3 space-y-1">
          <p>Ask anything about your plan, e.g.:</p>
          <ul className="list-disc list-inside text-xs space-y-0.5">
            <li>"What if I add a home office on Floor 2?"</li>
            <li>"How much extra for premium flooring?"</li>
            <li>"Which contractor should I hire first?"</li>
          </ul>
        </div>
      )}

      <div className="space-y-3 max-h-64 overflow-y-auto mb-3">
        {history.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-xl text-sm ${
              msg.role === 'user'
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700'
            }`}>
              <MarkdownBody text={msg.content} />
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-3 py-2 rounded-xl flex gap-1">
              {[0,1,2].map(i => <span key={i} className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />)}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2">
        <input
          className="flex-1 form-input text-sm"
          placeholder="Type your question..."
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          disabled={loading}
        />
        <button
          onClick={send}
          disabled={!input.trim() || loading}
          className="btn-primary py-2 px-3"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AIPlannerPage() {
  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      floors: '1', bedrooms: '3', bathrooms: '2',
      constructionType: 'Standard', houseStyle: 'Modern',
      vastuPreference: 'false', parkingRequired: 'false',
    },
  });

  const [phase,         setPhase]         = useState('idle');   // idle | streaming | done | error
  const [streamText,    setStreamText]    = useState('');
  const [sections,      setSections]      = useState([]);
  const [feasibility,   setFeasibility]   = useState(null);
  const [estimatedCost, setEstimatedCost] = useState(null);
  const [errorMsg,      setErrorMsg]      = useState('');
  const [formData,      setFormData]      = useState(null);
  const abortRef = useRef(null);

  const plotLength = watch('plotLength');
  const plotWidth  = watch('plotWidth');
  const computedArea = plotLength && plotWidth ? Math.round(plotLength * plotWidth) : null;

  const onSubmit = async (data) => {
    // Abort any running stream
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const payload = {
      ...data,
      plotLength:      Number(data.plotLength),
      plotWidth:       Number(data.plotWidth),
      plotArea:        computedArea,
      floors:          Number(data.floors),
      bedrooms:        Number(data.bedrooms),
      bathrooms:       Number(data.bathrooms),
      budget:          data.budget ? Number(data.budget) : undefined,
      vastuPreference: data.vastuPreference === 'true',
      parkingRequired: data.parkingRequired === 'true',
    };
    setFormData(payload);
    setPhase('streaming');
    setStreamText('');
    setSections([]);
    setFeasibility(null);
    setEstimatedCost(null);
    setErrorMsg('');

    try {
      const response = await fetch('/api/planner/ai-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const json = await response.json().catch(() => ({}));
        throw new Error(json.message || `Server error ${response.status}`);
      }

      const reader  = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let accumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // incomplete line stays in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          let parsed;
          try { parsed = JSON.parse(line.slice(6)); } catch { continue; }

          if (parsed.type === 'text') {
            accumulated += parsed.text;
            setStreamText(accumulated);
          } else if (parsed.type === 'done') {
            const feas  = parseFeasibility(accumulated);
            const sects = parseSections(accumulated);
            setFeasibility(feas);
            setSections(sects);
            setEstimatedCost(parsed.estimatedCost);
            setPhase('done');
          } else if (parsed.type === 'error') {
            throw new Error(parsed.message);
          }
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setErrorMsg(err.message || 'Failed to generate plan. Check backend is running and ANTHROPIC_API_KEY is set.');
      setPhase('error');
    }
  };

  const handleReset = () => {
    abortRef.current?.abort();
    setPhase('idle');
    setStreamText('');
    setSections([]);
    setFeasibility(null);
    setEstimatedCost(null);
    setErrorMsg('');
    setFormData(null);
    reset();
  };

  const feasConfig = feasibility ? FEASIBILITY_CONFIG[feasibility.label] : null;
  const FeasIcon   = feasConfig?.icon;

  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="hero-gradient py-14">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white border border-white/20 px-3 py-1.5 rounded-full text-sm font-medium mb-4">
            <Brain className="w-4 h-4" /> Powered by Claude AI
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-3">AI House Planner</h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Enter your plot details and get a complete house planning report — room layouts, Vastu guide, construction timeline, budget breakdown, and expert tips.
          </p>
        </div>
      </section>

      {/* Main content */}
      <section className="py-10 bg-surface-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Form ── */}
            <div className="lg:col-span-2">
              <div className="card sticky top-24">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="text-lg font-bold text-secondary flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" /> Your Requirements
                  </h2>
                  {phase !== 'idle' && (
                    <button onClick={handleReset} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                      <RotateCcw className="w-3 h-3" /> Reset
                    </button>
                  )}
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  {/* Plot dimensions */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Plot Dimensions</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Length (ft) *</label>
                        <input className="form-input" type="number" placeholder="40" {...register('plotLength', { required: true, min: 10 })} />
                        {errors.plotLength && <p className="text-xs text-red-500 mt-0.5">Min 10 ft</p>}
                      </div>
                      <div>
                        <label className="form-label">Width (ft) *</label>
                        <input className="form-input" type="number" placeholder="60" {...register('plotWidth', { required: true, min: 10 })} />
                        {errors.plotWidth && <p className="text-xs text-red-500 mt-0.5">Min 10 ft</p>}
                      </div>
                    </div>
                    {computedArea && (
                      <div className="mt-2 bg-primary/5 border border-primary/20 px-3 py-1.5 rounded-lg text-xs text-primary font-medium">
                        Plot area: {computedArea.toLocaleString()} sq ft
                      </div>
                    )}
                  </div>

                  {/* Structure */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Structure</p>
                    <div className="space-y-3">
                      <div>
                        <label className="form-label">Floors *</label>
                        <select className="form-input" {...register('floors', { required: true })}>
                          {[1,2,3,4].map(n => <option key={n} value={n}>{n} Floor{n>1?'s':''}</option>)}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="form-label">Bedrooms *</label>
                          <select className="form-input" {...register('bedrooms', { required: true })}>
                            {[1,2,3,4,5,6].map(n => <option key={n} value={n}>{n} BHK</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="form-label">Bathrooms *</label>
                          <select className="form-input" {...register('bathrooms', { required: true })}>
                            {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Style & Quality */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Style & Quality</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Construction Type</label>
                        <select className="form-input" {...register('constructionType')}>
                          {['Economy','Standard','Premium','Luxury'].map(t => <option key={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="form-label">House Style</label>
                        <select className="form-input" {...register('houseStyle')}>
                          {['Modern','Traditional','Contemporary','Colonial','Mediterranean'].map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Preferences */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Preferences</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="form-label">Vastu</label>
                        <select className="form-input" {...register('vastuPreference')}>
                          <option value="false">Not Required</option>
                          <option value="true">Required</option>
                        </select>
                      </div>
                      <div>
                        <label className="form-label">Parking</label>
                        <select className="form-input" {...register('parkingRequired')}>
                          <option value="false">Not Required</option>
                          <option value="true">Required</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Budget & Location */}
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Budget & Location</p>
                    <div className="space-y-3">
                      <div>
                        <label className="form-label">Total Budget (₹)</label>
                        <div className="relative">
                          <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                          <input className="form-input pl-8" type="number" placeholder="e.g. 2500000" {...register('budget')} />
                        </div>
                      </div>
                      <div>
                        <label className="form-label">City / Location</label>
                        <input className="form-input" placeholder="e.g. Patna, Bihar" {...register('city')} />
                      </div>
                    </div>
                  </div>

                  {/* Special requirements */}
                  <div>
                    <label className="form-label">Special Requirements</label>
                    <textarea
                      className="form-input resize-none"
                      rows={2}
                      placeholder="e.g. Home office, puja room, servant quarter, terrace garden..."
                      {...register('specialRequirements')}
                    />
                  </div>

                  {/* Contact */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="form-label">Your Name</label>
                      <input className="form-input" placeholder="Optional" {...register('contactName')} />
                    </div>
                    <div>
                      <label className="form-label">Phone</label>
                      <input className="form-input" placeholder="Optional" {...register('contactPhone')} />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn-primary w-full justify-center"
                    disabled={phase === 'streaming'}
                  >
                    <Brain className="w-4 h-4" />
                    {phase === 'streaming' ? 'Generating Plan...' : 'Generate AI Plan'}
                  </button>
                </form>
              </div>
            </div>

            {/* ── Results ── */}
            <div className="lg:col-span-3 space-y-4">

              {/* Idle state */}
              {phase === 'idle' && (
                <div className="card flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center mb-5">
                    <Home className="w-12 h-12 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold text-secondary mb-2">AI House Planner Ready</h3>
                  <p className="text-gray-400 text-sm max-w-sm">
                    Fill in your plot details on the left. Our AI will generate a complete house planning report including room layouts, Vastu guidelines, budget breakdown, and construction timeline.
                  </p>
                  <div className="mt-6 grid grid-cols-2 gap-3 text-left w-full max-w-sm">
                    {['Room Layout per Floor','Vastu & Orientation','Phase-wise Timeline','Detailed Budget','Material Guide','Expert Tips'].map(f => (
                      <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Streaming */}
              {phase === 'streaming' && (
                <>
                  <div className="card">
                    <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-2">
                      <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      Claude is analyzing your plot and generating recommendations...
                    </p>
                    <StreamingDisplay text={streamText} />
                  </div>
                </>
              )}

              {/* Error */}
              {phase === 'error' && (
                <div className="card border-red-200 bg-red-50">
                  <div className="flex items-start gap-3">
                    <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-800 mb-1">Generation Failed</p>
                      <p className="text-sm text-red-600">{errorMsg}</p>
                      <button onClick={() => setPhase('idle')} className="mt-3 text-sm text-red-700 underline">Try again</button>
                    </div>
                  </div>
                </div>
              )}

              {/* Done — parsed sections */}
              {phase === 'done' && (
                <>
                  {/* Feasibility banner */}
                  {feasibility && feasConfig && (
                    <div className={`card border ${feasConfig.bg}`}>
                      <div className="flex items-center gap-4 mb-3">
                        <FeasIcon className={`w-9 h-9 ${feasConfig.color} flex-shrink-0`} />
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 font-medium">Feasibility Assessment</p>
                          <p className={`text-2xl font-bold ${feasConfig.color}`}>{feasibility.label}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Score</p>
                          <p className={`text-3xl font-bold ${feasConfig.color}`}>
                            {feasibility.score}<span className="text-base">/100</span>
                          </p>
                        </div>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${feasConfig.bar} transition-all duration-700`}
                          style={{ width: `${feasibility.score}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Estimated cost */}
                  {estimatedCost && (
                    <div className="card">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <IndianRupee className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Estimated Construction Cost</p>
                          <p className="text-2xl font-bold text-secondary">{formatCurrency(estimatedCost)}</p>
                          <p className="text-xs text-gray-400">Based on selected quality grade</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AI sections */}
                  {sections.map((sec, i) => (
                    <SectionCard key={i} title={sec.title} body={sec.body} />
                  ))}

                  {/* Chat */}
                  <ChatPanel planContext={streamText} />

                  {/* CTA */}
                  <div className="card bg-primary text-white">
                    <p className="font-semibold mb-1">Ready to start construction?</p>
                    <p className="text-sm text-primary-100 mb-3">Our experts will visit your site for a detailed assessment and formal quotation at no cost.</p>
                    <Link to="/contact" className="inline-flex items-center gap-2 bg-white text-primary px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition-colors">
                      Book Free Site Visit
                    </Link>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

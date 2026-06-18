import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight, Brain, Calculator, Building2, Star, CheckCircle,
  MapPin, Award, Users, Home, Layers, Wrench, Phone
} from 'lucide-react';
import { plannerAPI } from '../../api';
import { formatCurrency } from '../../utils/helpers';

const services = [
  { icon: Home, title: 'House Construction', desc: 'Custom single-family homes built to your specifications with premium materials.' },
  { icon: Layers, title: 'Duplex & Apartments', desc: 'Multi-unit residential projects with modern design and structural excellence.' },
  { icon: Wrench, title: 'Renovation', desc: 'Transform your existing space with expert renovation and remodeling services.' },
  { icon: Building2, title: 'Turnkey Projects', desc: 'End-to-end construction from design to handover. Worry-free building experience.' },
];

const testimonials = [
  { name: 'Rajesh Kumar', location: 'Bhojpur', rating: 5, text: 'Excellent work quality. My dream home was completed on time within budget. Highly recommended!' },
  { name: 'Priya Singh', location: 'Vaishali', rating: 5, text: 'The AI planner helped me visualize my house before construction. The team is very professional.' },
  { name: 'Amit Srivastava', location: 'Chhapra', rating: 5, text: 'Best construction company in Bihar. Transparent pricing and quality materials used throughout.' },
];

const stats = [
  { value: '30+', label: 'Years Experience' },
  { value: '500+', label: 'Projects Completed' },
  { value: '1000+', label: 'Happy Families' },
  { value: '4', label: 'Districts Served' },
];

function CostCalculatorPreview() {
  const [form, setForm] = useState({ area: '', constructionType: 'standard', floors: '1' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleCalc = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await plannerAPI.calculateCost({ area: Number(form.area), constructionType: form.constructionType, floors: Number(form.floors) });
      setResult(res.data);
    } catch {
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card max-w-2xl mx-auto">
      <h3 className="text-xl font-bold text-secondary mb-1">Quick Cost Estimate</h3>
      <p className="text-sm text-gray-500 mb-5">Get an instant estimate for your construction project</p>
      <form onSubmit={handleCalc} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="form-label">Plot Area (Sq Ft)</label>
          <input className="form-input" type="number" placeholder="e.g. 1200" value={form.area} onChange={e => setForm(f => ({ ...f, area: e.target.value }))} required />
        </div>
        <div>
          <label className="form-label">Construction Type</label>
          <select className="form-input" value={form.constructionType} onChange={e => setForm(f => ({ ...f, constructionType: e.target.value }))}>
            <option value="economy">Economy</option>
            <option value="standard">Standard</option>
            <option value="premium">Premium</option>
            <option value="luxury">Luxury</option>
          </select>
        </div>
        <div>
          <label className="form-label">Floors</label>
          <select className="form-input" value={form.floors} onChange={e => setForm(f => ({ ...f, floors: e.target.value }))}>
            {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
        <div className="sm:col-span-3">
          <button className="btn-primary w-full justify-center" type="submit" disabled={loading}>
            {loading ? 'Calculating...' : 'Calculate Cost'}
          </button>
        </div>
      </form>
      {result && (
        <div className="mt-5 p-4 bg-primary/5 rounded-xl border border-primary/20">
          <div className="text-center mb-4">
            <p className="text-sm text-gray-500">Estimated Total Cost</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(result.estimatedTotal)}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-sm">
            <div className="bg-white rounded-lg p-2"><p className="text-gray-500 text-xs">Labor</p><p className="font-semibold text-secondary">{formatCurrency(result.laborCost)}</p></div>
            <div className="bg-white rounded-lg p-2"><p className="text-gray-500 text-xs">Material</p><p className="font-semibold text-secondary">{formatCurrency(result.materialCost)}</p></div>
            <div className="bg-white rounded-lg p-2"><p className="text-gray-500 text-xs">Finishing</p><p className="font-semibold text-secondary">{formatCurrency(result.finishingCost)}</p></div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="hero-gradient min-h-screen flex items-center pt-16 relative overflow-hidden">
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{ backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,.1) 40px,rgba(255,255,255,.1) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,.1) 40px,rgba(255,255,255,.1) 41px)' }} />
        </div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/20 text-primary-100 border border-primary/30 px-3 py-1.5 rounded-full text-sm font-medium mb-6">
              <Brain className="w-4 h-4" /> AI-Powered House Planning Platform
            </div>
            <h1 className="text-5xl lg:text-6xl font-bold text-white leading-tight mb-5">
              Plan Your Dream Home <span className="text-gradient">with AI</span>
            </h1>
            <p className="text-xl text-gray-300 leading-relaxed mb-8">
              AI House Planning, Construction Cost Estimation and Expert Construction Services Across Bihar. Serving Bhojpur, Chhapra, Vaishali and nearby districts.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/ai-planner" className="btn-primary">
                <Brain className="w-4 h-4" /> Plan My House
              </Link>
              <Link to="/cost-calculator" className="btn-outline border-white text-white hover:bg-white hover:text-secondary">
                <Calculator className="w-4 h-4" /> Get Cost Estimate
              </Link>
              <Link to="/contact" className="flex items-center gap-2 text-gray-300 hover:text-white transition-colors font-medium">
                <Phone className="w-4 h-4" /> Contact Us <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-4 gap-6 mt-14 pt-10 border-t border-white/10">
              {stats.map(({ value, label }) => (
                <div key={label}>
                  <p className="text-3xl font-bold text-white">{value}</p>
                  <p className="text-sm text-gray-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">Our Services</h2>
            <p className="section-subtitle">Complete construction solutions for every need</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {services.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="group card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-1 cursor-pointer">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4 group-hover:bg-primary transition-colors duration-200">
                  <Icon className="w-6 h-6 text-primary group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="font-semibold text-secondary mb-2">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Features */}
      <section className="py-20 bg-surface-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-full text-sm font-medium mb-4">
                <Brain className="w-4 h-4" /> AI-Powered Planning
              </div>
              <h2 className="section-title mb-4">Intelligent House Planning at Your Fingertips</h2>
              <p className="text-gray-500 leading-relaxed mb-6">Our AI analyzes your plot dimensions, budget, and requirements to generate feasibility reports, layout suggestions, and cost estimates — all in seconds.</p>
              <ul className="space-y-3">
                {['Feasibility Score & Analysis', 'Vastu-compliant Layout Suggestions', 'Budget vs Cost Analysis', 'Room-wise Space Planning', 'Instant Cost Breakdown'].map(f => (
                  <li key={f} className="flex items-center gap-2.5 text-sm text-gray-700">
                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Link to="/ai-planner" className="btn-primary mt-6">
                Try AI Planner <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="bg-white rounded-2xl shadow-card-hover p-6 border border-gray-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center"><CheckCircle className="w-5 h-5 text-green-600" /></div>
                <div><p className="font-semibold text-secondary">Feasibility: Possible</p><p className="text-xs text-gray-500">Score: 87/100</p></div>
              </div>
              <div className="space-y-3">
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">✓ Plot can accommodate 3 bedrooms and 2 bathrooms comfortably</div>
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-sm text-green-800">✓ Budget is sufficient for standard quality construction</div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">⚠ Vastu layout recommended: East-facing entrance</div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">ℹ Estimated cost: ₹24,00,000 — ₹32,00,000</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Cost Calculator */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="section-title">Construction Cost Calculator</h2>
            <p className="section-subtitle">Get an instant estimate before you commit</p>
          </div>
          <CostCalculatorPreview />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-surface-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="section-title">What Our Clients Say</h2>
            <p className="section-subtitle">Trusted by 1000+ families across Bihar</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map(({ name, location, rating, text }) => (
              <div key={name} className="card">
                <div className="flex gap-1 mb-3">{[...Array(rating)].map((_, i) => <Star key={i} className="w-4 h-4 text-accent fill-accent" />)}</div>
                <p className="text-gray-600 text-sm leading-relaxed mb-4">"{text}"</p>
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold text-sm">{name[0]}</div>
                  <div>
                    <p className="text-sm font-semibold text-secondary">{name}</p>
                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="w-3 h-3" />{location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Build Your Dream Home?</h2>
          <p className="text-primary-100 mb-8 text-lg">Get a free consultation with our expert team. No obligation, no pressure.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact" className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
              <Phone className="w-4 h-4" /> Book Free Consultation
            </Link>
            <Link to="/ai-planner" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all inline-flex items-center gap-2">
              <Brain className="w-4 h-4" /> Start AI Planning
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

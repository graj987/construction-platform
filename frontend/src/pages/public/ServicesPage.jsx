import React from 'react';
import { Link } from 'react-router-dom';
import { Home, Layers, Wrench, Building2, Key, MessageSquare, CheckCircle, ArrowRight } from 'lucide-react';

const services = [
  {
    icon: Home,
    title: 'House Construction',
    desc: 'We build custom single-family homes tailored to your lifestyle, budget, and plot. From RCC framing to final finishing.',
    features: ['Custom floor plans', 'Quality RCC construction', 'Vastu-compliant layouts', 'On-time delivery'],
  },
  {
    icon: Layers,
    title: 'Duplex Construction',
    desc: 'Maximize your plot investment with our expertly designed duplex homes — ideal for joint families or rental income.',
    features: ['Separate entry options', 'Shared structural savings', 'Rental-ready designs', 'Structural durability'],
  },
  {
    icon: Building2,
    title: 'Apartment Construction',
    desc: 'Multi-storey apartment complexes designed for modern urban living with all structural and safety requirements.',
    features: ['G+3 to G+6 floors', 'Lift provisions', 'Parking designs', 'Fire safety compliance'],
  },
  {
    icon: Wrench,
    title: 'Renovation & Remodeling',
    desc: 'Breathe new life into your existing property with structural repairs, redesigning, and modern upgrades.',
    features: ['Structural assessment', 'Room redesign', 'Bathroom & kitchen upgrade', 'Exterior facelift'],
  },
  {
    icon: Key,
    title: 'Turnkey Projects',
    desc: 'Completely hands-free construction from land survey to key handover. You relax while we build your dream home.',
    features: ['Design to delivery', 'Single point of contact', 'Transparent billing', 'Furniture package available'],
  },
  {
    icon: MessageSquare,
    title: 'Free Consultation',
    desc: 'Not sure where to start? Book a free 30-minute consultation with our expert engineer at your site or our office.',
    features: ['Plot assessment', 'Budget planning', 'Vastu advice', 'Design guidance'],
  },
];

export default function ServicesPage() {
  return (
    <div className="pt-20">
      <section className="hero-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Our Services</h1>
          <p className="text-xl text-gray-300">Complete construction solutions from planning to handover across Bihar</p>
        </div>
      </section>

      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {services.map(({ icon: Icon, title, desc, features }) => (
              <div key={title} className="card group hover:shadow-card-hover transition-all duration-200">
                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-primary transition-colors duration-200">
                  <Icon className="w-7 h-7 text-primary group-hover:text-white transition-colors duration-200" />
                </div>
                <h3 className="text-xl font-bold text-secondary mb-2">{title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{desc}</p>
                <ul className="space-y-2">
                  {features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-primary">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-3">Ready to Start Your Project?</h2>
          <p className="text-primary-100 mb-8">Contact us today for a free consultation and cost estimate.</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/contact" className="bg-white text-primary px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-flex items-center gap-2">
              Get Free Consultation <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/ai-planner" className="border-2 border-white text-white px-8 py-3 rounded-lg font-semibold hover:bg-white hover:text-primary transition-all inline-flex items-center gap-2">
              Try AI Planner
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

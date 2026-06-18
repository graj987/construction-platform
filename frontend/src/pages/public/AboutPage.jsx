import React from 'react';
import { Award, Users, MapPin, Target, Eye, CheckCircle } from 'lucide-react';

const milestones = [
  { year: '1994', event: 'Company founded in Bhojpur by Late Shri Ramesh Singh' },
  { year: '2002', event: 'Expanded operations to Chhapra district' },
  { year: '2010', event: 'Completed 200th residential project milestone' },
  { year: '2018', event: 'Launched services in Vaishali district' },
  { year: '2022', event: 'Completed 400+ projects across Bihar' },
  { year: '2024', event: 'Launched AI-powered House Planning Platform' },
];

const areas = ['Bhojpur (Ara)', 'Chhapra (Saran)', 'Vaishali (Hajipur)', 'Patna', 'Buxar', 'Siwan'];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="hero-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">30+ Years of Building Bihar</h1>
          <p className="text-xl text-gray-300">From foundations to rooftops — we've been building homes and trust since 1994.</p>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Award, value: '30+', label: 'Years Experience', color: 'bg-primary/10 text-primary' },
              { icon: CheckCircle, value: '500+', label: 'Projects Completed', color: 'bg-green-100 text-green-600' },
              { icon: Users, value: '1000+', label: 'Happy Families', color: 'bg-blue-100 text-blue-600' },
              { icon: MapPin, value: '4+', label: 'Districts Served', color: 'bg-purple-100 text-purple-600' },
            ].map(({ icon: Icon, value, label, color }) => (
              <div key={label} className="card text-center">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3 ${color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <p className="text-3xl font-bold text-secondary">{value}</p>
                <p className="text-sm text-gray-500 mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-16 bg-surface-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold text-secondary mb-4">Our Story</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                BuildBihar Construction Co. was founded in 1994 in Bhojpur district with a single vision: to make quality construction accessible to every family in Bihar. Starting with small residential projects in Ara, we have grown into one of the most trusted construction companies in the region.
              </p>
              <p className="text-gray-600 leading-relaxed mb-4">
                Over three decades, we have built 500+ homes, duplexes, apartments, and commercial structures across Bhojpur, Chhapra, Vaishali, and Patna. Our team of experienced engineers, architects, and craftsmen ensures every project meets the highest standards of quality.
              </p>
              <p className="text-gray-600 leading-relaxed">
                In 2024, we launched our AI-powered house planning platform — combining 30 years of construction expertise with modern technology to help families plan their dream homes before laying the first brick.
              </p>
            </div>
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-secondary mb-6">Our Journey</h3>
              {milestones.map(({ year, event }, i) => (
                <div key={year} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">{year.slice(2)}</div>
                    {i < milestones.length - 1 && <div className="w-0.5 h-8 bg-primary/20 mt-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-sm font-semibold text-primary">{year}</p>
                    <p className="text-sm text-gray-600">{event}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="card border-l-4 border-l-primary">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><Target className="w-5 h-5 text-primary" /></div>
                <h3 className="text-xl font-bold text-secondary">Our Mission</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To deliver exceptional construction services that transform visions into reality, making quality homes accessible to every family in Bihar through transparent pricing, skilled craftsmanship, and modern technology.
              </p>
            </div>
            <div className="card border-l-4 border-l-accent">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center"><Eye className="w-5 h-5 text-accent" /></div>
                <h3 className="text-xl font-bold text-secondary">Our Vision</h3>
              </div>
              <p className="text-gray-600 leading-relaxed">
                To become Bihar's most trusted construction partner by combining traditional craftsmanship with AI-powered planning tools, creating a future where every family can plan, build, and own their dream home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Service Areas */}
      <section className="py-16 bg-surface-muted">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="section-title mb-3">Service Areas</h2>
          <p className="section-subtitle mb-10">We operate across these districts in Bihar</p>
          <div className="flex flex-wrap justify-center gap-3">
            {areas.map(a => (
              <div key={a} className="flex items-center gap-2 bg-white px-4 py-2.5 rounded-full shadow-sm border border-gray-100 text-sm font-medium text-secondary">
                <MapPin className="w-4 h-4 text-primary" /> {a}
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

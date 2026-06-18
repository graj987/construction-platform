import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, Building2 } from 'lucide-react';
import { projectAPI } from '../../api';
import { formatDate } from '../../utils/helpers';
import Badge from '../../components/shared/Badge';
import LoadingSpinner from '../../components/shared/LoadingSpinner';

const demoProjects = [
  { _id: '1', projectName: 'Modern Villa — Ara', location: 'Bhojpur', status: 'Completed', constructionType: 'House', totalArea: 1800, floors: 2, description: 'A beautiful 4BHK duplex villa with modern architecture and vastu-compliant layout.' },
  { _id: '2', projectName: 'Srivastava Residence', location: 'Chhapra', status: 'Finishing', constructionType: 'House', totalArea: 1400, floors: 2, description: '3BHK residential home with premium finishing and modern interiors.' },
  { _id: '3', projectName: 'Vaishali Heights Apartment', location: 'Vaishali', status: 'Structure', constructionType: 'Apartment', totalArea: 8000, floors: 4, description: 'G+3 apartment complex with 12 units, lift provision and basement parking.' },
  { _id: '4', projectName: 'Kumar Duplex', location: 'Bhojpur', status: 'Completed', constructionType: 'Duplex', totalArea: 2200, floors: 2, description: 'Twin-entry duplex home designed for joint family with separate kitchen facilities.' },
  { _id: '5', projectName: 'Singh Commercial Complex', location: 'Patna', status: 'Foundation', constructionType: 'Commercial', totalArea: 5000, floors: 3, description: 'G+2 commercial building with retail shops and office spaces.' },
  { _id: '6', projectName: 'Pandey Renovation Project', location: 'Chhapra', status: 'Completed', constructionType: 'Renovation', totalArea: 900, floors: 1, description: 'Complete renovation and modernization of a 25-year-old residence.' },
];

export default function ProjectsPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    projectAPI.getAll().then(r => setProjects(r.data?.length ? r.data : demoProjects)).catch(() => setProjects(demoProjects)).finally(() => setLoading(false));
  }, []);

  const statuses = ['All', 'Completed', 'Structure', 'Foundation', 'Finishing'];
  const filtered = filter === 'All' ? projects : projects.filter(p => p.status === filter);

  return (
    <div className="pt-20">
      <section className="hero-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Our Projects</h1>
          <p className="text-xl text-gray-300">500+ successful projects across Bihar — each a story of trust and craftsmanship</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 mb-8">
            {statuses.map(s => (
              <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filter === s ? 'bg-primary text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
            ))}
          </div>

          {loading ? (
            <LoadingSpinner size="lg" className="py-20" />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map(p => (
                <div key={p._id} className="card group hover:shadow-card-hover transition-all duration-200">
                  <div className="h-48 bg-gradient-to-br from-secondary/10 to-primary/10 rounded-lg mb-4 flex items-center justify-center">
                    <Building2 className="w-16 h-16 text-secondary/20" />
                  </div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-secondary text-sm leading-tight">{p.projectName}</h3>
                    <Badge status={p.status} />
                  </div>
                  <p className="text-xs text-gray-500 leading-relaxed mb-3">{p.description}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.location}</span>
                    <span>{p.totalArea} sq ft</span>
                    <span>{p.floors} Floor{p.floors > 1 ? 's' : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

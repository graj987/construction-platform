import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Phone, MapPin, Mail, Clock, CheckCircle } from 'lucide-react';
import { contactAPI } from '../../api';

export default function ContactPage() {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      await contactAPI.submit(data);
      setSubmitted(true);
      reset();
    } catch (e) {
      setError('Failed to submit. Please try again or call us directly.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20">
      <section className="hero-gradient py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-white mb-4">Contact Us</h1>
          <p className="text-xl text-gray-300">Get a free consultation — we respond within 24 hours</p>
        </div>
      </section>

      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
            <div className="space-y-6">
              {[
                { icon: Phone, label: 'Phone', value: '+91 98765 43210', href: 'tel:+919876543210' },
                { icon: Mail, label: 'Email', value: 'info@buildbihar.in', href: 'mailto:info@buildbihar.in' },
                { icon: MapPin, label: 'Office', value: 'Ara, Bhojpur, Bihar — 802301', href: null },
                { icon: Clock, label: 'Working Hours', value: 'Mon–Sat: 9 AM – 7 PM', href: null },
              ].map(({ icon: Icon, label, value, href }) => (
                <div key={label} className="flex gap-4">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium">{label}</p>
                    {href ? <a href={href} className="text-sm font-semibold text-secondary hover:text-primary">{value}</a> : <p className="text-sm font-semibold text-secondary">{value}</p>}
                  </div>
                </div>
              ))}
            </div>

            <div className="lg:col-span-2">
              {submitted ? (
                <div className="card text-center py-12">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-xl font-bold text-secondary mb-2">Thank You!</h3>
                  <p className="text-gray-500">Your request has been submitted. Our team will call you within 24 hours.</p>
                  <button onClick={() => setSubmitted(false)} className="btn-primary mt-6">Submit Another Request</button>
                </div>
              ) : (
                <div className="card">
                  <h3 className="text-xl font-bold text-secondary mb-1">Send Us a Message</h3>
                  <p className="text-sm text-gray-500 mb-6">Fill in your details and we'll get back to you with a free quote.</p>
                  {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-lg mb-4">{error}</div>}
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Full Name *</label>
                        <input className="form-input" placeholder="Ram Kumar" {...register('name', { required: true })} />
                        {errors.name && <p className="text-xs text-red-500 mt-1">Name is required</p>}
                      </div>
                      <div>
                        <label className="form-label">Phone Number *</label>
                        <input className="form-input" placeholder="+91 98765 43210" {...register('phone', { required: true })} />
                        {errors.phone && <p className="text-xs text-red-500 mt-1">Phone is required</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="form-label">Location / Village</label>
                        <input className="form-input" placeholder="Ara, Bhojpur" {...register('location')} />
                      </div>
                      <div>
                        <label className="form-label">Plot Size (approx)</label>
                        <input className="form-input" placeholder="e.g. 40x60 ft or 1200 sq ft" {...register('plotSize')} />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Budget Range</label>
                      <select className="form-input" {...register('budget')}>
                        <option value="">Select Budget</option>
                        <option value="Under ₹15 Lakh">Under ₹15 Lakh</option>
                        <option value="₹15L – ₹30L">₹15L – ₹30L</option>
                        <option value="₹30L – ₹50L">₹30L – ₹50L</option>
                        <option value="₹50L – ₹1 Crore">₹50L – ₹1 Crore</option>
                        <option value="Above ₹1 Crore">Above ₹1 Crore</option>
                      </select>
                    </div>
                    <div>
                      <label className="form-label">Message / Requirements</label>
                      <textarea className="form-input h-28 resize-none" placeholder="Tell us about your project — number of bedrooms, timeline, special requirements..." {...register('message')} />
                    </div>
                    <button type="submit" className="btn-primary w-full justify-center" disabled={loading}>
                      {loading ? 'Sending...' : 'Send Request'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

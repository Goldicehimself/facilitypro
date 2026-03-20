import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-toastify';
import axiosInstance from '../../api/axiosConfig';

const ContactSales = () => {
  const [form, setForm] = useState({
    name: '',
    email: '',
    companyName: '',
    companySize: '',
    message: '',
    currentPlan: 'Pro',
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (event) => {
    setForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.companyName || !form.companySize) {
      toast.error('Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      await axiosInstance.post('/email/contact-sales', {
        name: form.name.trim(),
        email: form.email.trim(),
        companyName: form.companyName.trim(),
        companySize: form.companySize,
        message: form.message.trim(),
        currentPlan: form.currentPlan,
      }, { suppressToast: true });
      toast.success('Thanks! Our sales team will reach out shortly.');
      setForm((prev) => ({
        ...prev,
        name: '',
        email: '',
        companyName: '',
        companySize: '',
        message: '',
      }));
    } catch (error) {
      const message = error?.response?.data?.message || 'Unable to send your request.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-3xl px-6 py-20">
        <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold">Contact Sales</h1>
          <p className="mt-2 text-slate-600">
            Tell us a bit about your team and we’ll follow up with Enterprise options.
          </p>

          <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="sales-name">Name</label>
                <input
                  id="sales-name"
                  type="text"
                  value={form.name}
                  onChange={handleChange('name')}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900"
                  placeholder="Jane Doe"
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="sales-email">Email</label>
                <input
                  id="sales-email"
                  type="email"
                  value={form.email}
                  onChange={handleChange('email')}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900"
                  placeholder="jane@company.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="sales-company">Company name</label>
              <input
                id="sales-company"
                type="text"
                value={form.companyName}
                onChange={handleChange('companyName')}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900"
                placeholder="Acme Facilities"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="sales-size">Company size</label>
                <select
                  id="sales-size"
                  value={form.companySize}
                  onChange={handleChange('companySize')}
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900"
                  required
                >
                  <option value="">Select size</option>
                  <option value="1-10">1-10</option>
                  <option value="11-50">11-50</option>
                  <option value="51-200">51-200</option>
                  <option value="201-500">201-500</option>
                  <option value="500+">500+</option>
                </select>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700" htmlFor="sales-plan">Current plan</label>
                <input
                  id="sales-plan"
                  type="text"
                  value={form.currentPlan}
                  readOnly
                  className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900 bg-slate-100"
                />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700" htmlFor="sales-message">Message (optional)</label>
              <textarea
                id="sales-message"
                value={form.message}
                onChange={handleChange('message')}
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 text-slate-900"
                rows={4}
                placeholder="Tell us what you need..."
              />
            </div>

            <Button type="submit" size="lg" disabled={loading} className="rounded-full px-8">
              {loading ? 'Sending...' : 'Send request'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ContactSales;

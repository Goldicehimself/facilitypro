import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { PRICING_PLANS, formatNgn } from '../../data/pricing';

const Pricing = () => {
  const navigate = useNavigate();

  const plans = PRICING_PLANS;

  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-5xl px-6 py-20">
        <h1 className="text-4xl font-bold mb-4">Pricing</h1>
        <p className="text-gray-600 mb-8">
          Seat-based pricing with a 14-day Pro trial. Save 20% with annual billing.
        </p>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div
              key={p.id}
              className={`border rounded-lg p-6 shadow-sm ${p.popular ? 'border-blue-500 shadow-lg' : 'border-slate-200'}`}
            >
              {p.popular && (
                <div className="text-center mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Most Popular
                  </span>
                </div>
              )}
              <div className="text-center">
                <h3 className="text-xl font-semibold">{p.name}</h3>
                <p className="text-gray-600 mt-1">{p.description}</p>
                <div className="text-3xl font-bold mt-4">
                  {p.id === 'enterprise' ? 'Custom' : formatNgn(p.monthly)}
                  <span className="text-base font-normal text-gray-600">
                    {p.id === 'enterprise' ? '' : '/month'}
                  </span>
                </div>
              </div>
              <ul className="mt-6 space-y-2 text-gray-600">
                {p.features.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
              <Button
                size="lg"
                className="mt-6 w-full rounded-full"
                variant={p.name === 'Enterprise' ? 'outline' : 'default'}
                onClick={() => navigate(p.name === 'Enterprise' ? '/contact-sales' : `/register?plan=${p.id}`)}
              >
                {p.name === 'Enterprise' ? 'Contact Sales' : 'Get Started'}
              </Button>
              {p.name !== 'Enterprise' && (
                <p className="mt-3 text-xs text-slate-500 text-center">20% off annual billing</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Pricing;


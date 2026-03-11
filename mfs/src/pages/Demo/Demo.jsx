import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const steps = [
  { title: 'Create Work Order', description: 'Submit a new work order in seconds.' },
  { title: 'Assign Technician', description: 'Quickly assign to available technicians.' },
  { title: 'Track Progress', description: 'View timeline and status updates.' },
];

const Demo = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-white py-16">
      <div className="mx-auto max-w-4xl px-6">
        <h1 className="text-4xl font-bold mb-4">Interactive Demo</h1>
        <p className="text-gray-600 mb-8">Walkthrough of a typical maintenance workflow.</p>

        <div className="grid md:grid-cols-3 gap-6">
          {steps.map((s, i) => (
            <motion.div key={s.title} whileHover={{ y: -6 }} className="p-6 border rounded-lg shadow-sm">
              <div className="text-xl font-semibold">{s.title}</div>
              <div className="text-gray-600 mt-2">{s.description}</div>
            </motion.div>
          ))}
        </div>

        <div className="mt-8">
          <Button size="lg" onClick={() => navigate('/register')}>Try the Full Product</Button>
          <Button size="lg" variant="outline" className="ml-4" onClick={() => navigate('/login')}>Sign in</Button>
        </div>
      </div>
    </div>
  );
};

export default Demo;
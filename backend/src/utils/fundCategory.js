// Infer an expense category from fund request details.
const normalizeText = (value) => String(value || '').toLowerCase();

const hasAny = (text, keywords) => keywords.some((word) => text.includes(word));

const inferExpenseCategory = ({ purpose, notes } = {}) => {
  const text = `${normalizeText(purpose)} ${normalizeText(notes)}`.trim();
  if (!text) return 'other';

  if (hasAny(text, ['part', 'parts', 'material', 'materials', 'spare', 'component'])) {
    return 'parts';
  }
  if (hasAny(text, ['labor', 'labour', 'technician', 'service', 'repair', 'overtime'])) {
    return 'labor';
  }
  if (hasAny(text, ['travel', 'transport', 'fuel', 'mileage', 'logistics', 'trip'])) {
    return 'travel';
  }
  if (hasAny(text, ['equipment', 'tool', 'tools', 'machine', 'device', 'asset', 'purchase'])) {
    return 'equipment';
  }
  return 'other';
};

module.exports = { inferExpenseCategory };


// Construction cost rates (per sq ft) in INR
const CONSTRUCTION_RATES = {
  economy: {
    label: 'Economy',
    total: 1400,
    labor: 420,
    material: 700,
    finishing: 280,
    description: 'Basic construction with standard materials',
  },
  standard: {
    label: 'Standard',
    total: 1800,
    labor: 540,
    material: 900,
    finishing: 360,
    description: 'Good quality materials with standard finishing',
  },
  premium: {
    label: 'Premium',
    total: 2400,
    labor: 720,
    material: 1200,
    finishing: 480,
    description: 'Premium materials with superior finishing',
  },
  luxury: {
    label: 'Luxury',
    total: 3500,
    labor: 1050,
    material: 1750,
    finishing: 700,
    description: 'Top-grade materials with luxury finishing',
  },
};

module.exports = CONSTRUCTION_RATES;

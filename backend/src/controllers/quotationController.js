const Quotation = require('../models/Quotation');
const RATES = require('../config/rates');

exports.getQuotations = async (req, res) => {
  try {
    const { status, client } = req.query;
    const query = {};
    if (status) query.status = status;
    if (client) query.client = client;
    const quotations = await Quotation.find(query).populate('client', 'name phone').sort({ createdAt: -1 });
    res.json({ success: true, data: quotations });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getQuotationById = async (req, res) => {
  try {
    const quotation = await Quotation.findById(req.params.id).populate('client');
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.generateQuotation = async (req, res) => {
  try {
    const { area, constructionType, floors = 1 } = req.body;
    const rateKey = constructionType?.toLowerCase() || 'standard';
    const rate = RATES[rateKey] || RATES.standard;

    const lineItems = [
      { description: 'Labor Cost', quantity: area * floors, unit: 'Sq Ft', rate: rate.labor, amount: area * floors * rate.labor },
      { description: 'Material Cost', quantity: area * floors, unit: 'Sq Ft', rate: rate.material, amount: area * floors * rate.material },
      { description: 'Finishing Cost', quantity: area * floors, unit: 'Sq Ft', rate: rate.finishing, amount: area * floors * rate.finishing },
    ];

    const quotation = await Quotation.create({
      ...req.body,
      ratePerSqFt: rate.total,
      lineItems,
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });

    res.status(201).json({ success: true, data: quotation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.updateQuotation = async (req, res) => {
  try {
    const quotation = await Quotation.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!quotation) return res.status(404).json({ success: false, message: 'Quotation not found' });
    res.json({ success: true, data: quotation });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getRates = async (req, res) => {
  res.json({ success: true, data: RATES });
};

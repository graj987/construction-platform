const Groq = require('groq-sdk');
const PlanningReport = require('../models/PlanningReport');
const RATES = require('../config/rates');

// ─── Rule-based planner (kept for backward compatibility) ─────────────────────

const analyzePlan = (data) => {
  const { plotLength, plotWidth, plotArea, floors, bedrooms, bathrooms, budget, vastuPreference, parkingRequired } = data;
  const area = plotArea || plotLength * plotWidth;
  const builtUpArea = area * 0.6 * floors;
  const requiredArea = bedrooms * 100 + bathrooms * 40 + (parkingRequired ? 120 : 0) + 200;

  const recommendations = [];
  const warnings = [];
  let score = 100;

  if (builtUpArea < requiredArea) {
    score -= 30;
    warnings.push(`Built-up area (${Math.round(builtUpArea)} sq ft) may be insufficient for ${bedrooms} bedrooms and ${bathrooms} bathrooms.`);
  } else {
    recommendations.push(`Plot can comfortably accommodate ${bedrooms} bedrooms and ${bathrooms} bathrooms.`);
  }

  if (budget) {
    const estimated = builtUpArea * RATES.standard.total;
    if (budget < estimated * 0.7) {
      score -= 25;
      warnings.push(`Budget (₹${budget.toLocaleString()}) appears low. Standard construction would cost approx ₹${Math.round(estimated).toLocaleString()}.`);
    } else if (budget >= estimated) {
      recommendations.push('Budget is sufficient for standard quality construction.');
    }
  }

  if (vastuPreference) {
    if (area >= 1000) recommendations.push('Plot size allows Vastu-compliant layout. Main entrance recommended on East or North side.');
    else { warnings.push('Vastu-compliant layout may be challenging on smaller plot.'); score -= 10; }
  }

  if (parkingRequired && area < 800) { warnings.push('Parking within plot may reduce living space significantly.'); score -= 10; }
  if (floors > 2 && area < 600) { warnings.push('Multi-floor construction on small plot requires structural engineering review.'); score -= 15; }

  if (plotLength && plotWidth) {
    const ratio = Math.max(plotLength, plotWidth) / Math.min(plotLength, plotWidth);
    if (ratio > 3) { warnings.push('Plot shape is very narrow. Room layouts may be constrained.'); score -= 10; }
  }

  recommendations.push(`Recommended construction type: ${builtUpArea > 1500 ? 'Standard to Premium' : 'Economy to Standard'}`);
  recommendations.push(`Estimated built-up area: ${Math.round(builtUpArea)} sq ft across ${floors} floor(s).`);

  const feasibilityLabel = score >= 80 ? 'Possible' : score >= 60 ? 'Partially Possible' : score >= 40 ? 'Not Recommended' : 'Not Possible';

  return {
    feasibilityScore: Math.max(0, score),
    feasibilityLabel,
    recommendations,
    warnings,
    estimatedCost: Math.round(builtUpArea * RATES.standard.total),
    suggestedLayout: {
      totalArea: area,
      builtUpArea: Math.round(builtUpArea),
      floors,
      bedrooms,
      bathrooms,
      parking: parkingRequired,
      vastu: vastuPreference,
      approximateRooms: [
        { name: 'Master Bedroom', size: '14x12 ft' },
        ...(bedrooms > 1 ? [{ name: 'Bedroom 2', size: '12x10 ft' }] : []),
        ...(bedrooms > 2 ? [{ name: 'Bedroom 3', size: '10x10 ft' }] : []),
        { name: 'Living Room', size: '16x14 ft' },
        { name: 'Kitchen', size: '10x8 ft' },
        { name: 'Dining Area', size: '10x8 ft' },
        { name: 'Bathroom 1', size: '8x5 ft' },
        ...(bathrooms > 1 ? [{ name: 'Bathroom 2', size: '6x4 ft' }] : []),
      ],
    },
  };
};

exports.generatePlan = async (req, res) => {
  try {
    const analysis = analyzePlan(req.body);
    const report = await PlanningReport.create({ ...req.body, ...analysis });
    res.status(201).json({ success: true, data: report });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getPlanningReports = async (req, res) => {
  try {
    const reports = await PlanningReport.find().sort({ createdAt: -1 }).limit(50);
    res.json({ success: true, data: reports });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.calculateCost = async (req, res) => {
  try {
    const { area, constructionType, floors = 1 } = req.body;
    const rate = RATES[constructionType?.toLowerCase()] || RATES.standard;
    const totalArea = area * floors;
    res.json({
      success: true,
      data: {
        area: totalArea,
        constructionType: rate.label,
        ratePerSqFt: rate.total,
        laborCost: Math.round(totalArea * rate.labor),
        materialCost: Math.round(totalArea * rate.material),
        finishingCost: Math.round(totalArea * rate.finishing),
        estimatedTotal: Math.round(totalArea * rate.total),
        description: rate.description,
      },
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ─── AI Planner ───────────────────────────────────────────────────────────────

function buildPrompt(data) {
  const {
    plotLength, plotWidth, floors, bedrooms, bathrooms,
    budget, vastuPreference, parkingRequired, constructionType,
    houseStyle, city, specialRequirements,
  } = data;

  const area = plotLength * plotWidth;
  const builtUpArea = Math.round(area * 0.6 * floors);
  const rateKey = (constructionType || 'standard').toLowerCase();
  const rate = RATES[rateKey] || RATES.standard;
  const estimatedCost = builtUpArea * rate.total;

  return `You are a senior Indian residential architect and construction expert with 25+ years of experience. Analyze this house planning request and provide a thorough, practical report.

INPUT PARAMETERS:
- Plot: ${plotLength} ft × ${plotWidth} ft = ${area} sq ft
- Floors: ${floors} | Built-up area: ~${builtUpArea} sq ft (60% FAR × ${floors} floor${floors > 1 ? 's' : ''})
- Bedrooms: ${bedrooms} BHK | Bathrooms: ${bathrooms}
- Budget: ${budget ? `₹${Number(budget).toLocaleString('en-IN')}` : 'Not specified'}
- Vastu: ${vastuPreference ? 'Required' : 'Not required'}
- Parking: ${parkingRequired ? 'Required (within plot)' : 'Not required'}
- Quality: ${rate.label} (₹${rate.total}/sq ft) — estimated ₹${Math.round(estimatedCost).toLocaleString('en-IN')}
- Style: ${houseStyle || 'Modern'}
- Location: ${city || 'North India'}
- Special needs: ${specialRequirements || 'None'}

Write a detailed planning report using exactly these sections (use ## for section headings):

## Feasibility Assessment
Start with FEASIBILITY: [Possible/Partially Possible/Not Recommended/Not Possible] and SCORE: [0-100].
Explain in 2-3 sentences whether this plan can work and the main challenges.

## Floor-wise Room Layout
For each floor, list every room with specific dimensions in feet. Format: "Room Name — W × L ft (area sq ft)". Include passage, staircase if multi-floor, balcony/terrace if applicable. Assign rooms logically per floor.

## Vastu & Orientation Guide
${vastuPreference
    ? 'Provide exact compass directions for main entrance, master bedroom, kitchen, pooja room, bathrooms. Explain each placement reason.'
    : 'Recommend optimal plot orientation, main entrance direction, and window placement for cross-ventilation and natural light.'}

## Construction Phases & Timeline
Break into phases: Foundation → Structure → Masonry → Plumbing & Electrical → Plastering → Flooring → Finishing. Give duration for each phase and total timeline.

## Material Recommendations
For ${rate.label} quality, list specific recommended materials for: Foundation, RCC/Structure, Bricks, Flooring, Doors & Windows, Electrical, Plumbing, Roof, Paint & Finishing.

## Detailed Budget Breakdown
Break the ₹${Math.round(estimatedCost).toLocaleString('en-IN')} estimate into: Civil/Structure, Bricks & Masonry, Flooring, Electrical, Plumbing, Doors & Windows, Painting, Miscellaneous. Show amount and percentage for each.

## Key Warnings & Legal Points
List specific structural concerns, bye-law setback requirements (front/side/rear), FAR limits, permissions needed (building plan approval, completion certificate). Flag any risks for this specific plot.

## Expert Recommendations
5 specific actionable tips for this project to save money, improve quality, or avoid common mistakes. Be concrete, not generic.

Use simple language. All amounts in INR with ₹ symbol. Be specific to Indian construction practices and climate.`;
}

exports.generateAIPlan = async (req, res) => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return res.status(503).json({ success: false, message: 'AI service not configured. Please set GROQ_API_KEY in backend/.env' });
  }

  const area = (req.body.plotLength || 0) * (req.body.plotWidth || 0);
  const builtUpArea = Math.round(area * 0.6 * (req.body.floors || 1));
  const rateKey = (req.body.constructionType || 'standard').toLowerCase();
  const rate = RATES[rateKey] || RATES.standard;
  const estimatedCost = Math.round(builtUpArea * rate.total);

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let fullText = '';

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const stream = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: buildPrompt(req.body) }],
      stream: true,
      max_tokens: 4096,
    });

    for await (const chunk of stream) {
      const text = chunk.choices[0]?.delta?.content || '';
      if (text) {
        fullText += text;
        res.write(`data: ${JSON.stringify({ type: 'text', text })}\n\n`);
      }
    }

    const { plotLength, plotWidth, floors, bedrooms, bathrooms, budget,
            vastuPreference, parkingRequired, constructionType, houseStyle,
            city, specialRequirements, contactName, contactPhone } = req.body;

    await PlanningReport.create({
      plotLength, plotWidth, plotArea: area, floors, bedrooms, bathrooms, budget,
      vastuPreference, parkingRequired, constructionType, houseStyle,
      city, specialRequirements, contactName, contactPhone,
      estimatedCost,
      isAIGenerated: true,
      aiResponse: fullText,
    });

    res.write(`data: ${JSON.stringify({ type: 'done', estimatedCost })}\n\n`);
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
  } finally {
    res.end();
  }
};

exports.chatWithPlanner = async (req, res) => {
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    return res.status(503).json({ success: false, message: 'AI service not configured.' });
  }

  try {
    const { question, planContext, history = [] } = req.body;
    if (!question?.trim()) return res.status(400).json({ success: false, message: 'Question is required.' });

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const messages = [
      {
        role: 'system',
        content: `You are a helpful Indian construction expert assistant. The user has generated a house plan with the following analysis:\n\n${planContext || 'No plan context provided.'}\n\nAnswer follow-up questions concisely and practically. Use Indian construction terminology and prices in INR.`,
      },
      ...history.map(h => ({ role: h.role === 'assistant' ? 'assistant' : 'user', content: h.content })),
      { role: 'user', content: question },
    ];

    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages,
      max_tokens: 1024,
    });

    res.json({ success: true, data: { answer: response.choices[0].message.content } });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

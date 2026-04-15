const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ============================================================
// POST /api/ai/preferences — Save lifestyle quiz answers
// ============================================================
const savePreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;

    // Validate required fields
    const requiredFields = [
      'commuteTolerance', 'schoolNearby', 'noiseSensitivity',
      'greenSpace', 'safetyPriority', 'workFromHome',
      'petOwner', 'preferredFloor'
    ];

    for (const field of requiredFields) {
      if (preferences[field] === undefined || preferences[field] === null) {
        return res.status(400).json({ message: `Missing field: ${field}` });
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        preferences: JSON.stringify(preferences),
        quizCompleted: true,
      },
    });

    return res.json({
      message: 'Preferences saved successfully',
      preferences,
      quizCompleted: true,
    });
  } catch (error) {
    console.error('Save preferences error:', error);
    return res.status(500).json({ message: 'Server error saving preferences' });
  }
};

// ============================================================
// GET /api/ai/preferences — Get current user preferences
// ============================================================
const getPreferences = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { preferences: true, quizCompleted: true },
    });

    if (!user || !user.preferences) {
      return res.json({ preferences: null, quizCompleted: false });
    }

    return res.json({
      preferences: JSON.parse(user.preferences),
      quizCompleted: user.quizCompleted,
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// POST /api/ai/match-score — Calculate match score for a property
// ============================================================
const getMatchScore = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyId } = req.body;

    // Get user preferences
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true, quizCompleted: true },
    });

    if (!user || !user.preferences) {
      return res.json({ score: null, message: 'Complete lifestyle quiz first' });
    }

    // Get property
    const property = await prisma.property.findUnique({
      where: { id: parseInt(propertyId) },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    const prefs = JSON.parse(user.preferences);
    const { score, matches, mismatches } = calculateMatchScore(prefs, property);

    return res.json({ score, matches, mismatches, propertyId: property.id });
  } catch (error) {
    console.error('Match score error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// POST /api/ai/match-scores-bulk — Scores for multiple properties
// ============================================================
const getMatchScoresBulk = async (req, res) => {
  try {
    const userId = req.user.id;
    const { propertyIds } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { preferences: true, quizCompleted: true },
    });

    if (!user || !user.preferences) {
      return res.json({ scores: {} });
    }

    const properties = await prisma.property.findMany({
      where: { id: { in: propertyIds.map(id => parseInt(id)) } },
    });

    const prefs = JSON.parse(user.preferences);
    const scores = {};

    for (const property of properties) {
      const { score, matches, mismatches } = calculateMatchScore(prefs, property);
      scores[property.id] = { score, matches, mismatches };
    }

    return res.json({ scores });
  } catch (error) {
    console.error('Bulk match score error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// SCORE ALGORITHM — Weighted match between prefs and property
// ============================================================
function calculateMatchScore(prefs, property) {
  const matches = [];
  const mismatches = [];
  let totalWeight = 0;
  let earnedScore = 0;

  // --- 1. Noise Sensitivity (weight: 15) ---
  const noiseWeight = 15;
  totalWeight += noiseWeight;
  const propNoise = (property.noiseLevel || inferNoise(property)).toLowerCase();
  const userNoise = prefs.noiseSensitivity.toLowerCase();

  if (userNoise === 'silent') {
    if (propNoise === 'silent') { earnedScore += noiseWeight; matches.push('🔇 Quiet neighborhood — matches your preference'); }
    else if (propNoise === 'moderate') { earnedScore += noiseWeight * 0.5; mismatches.push('🔊 Moderate noise area — you prefer silent'); }
    else { mismatches.push('🔊 Busy/noisy area — you prefer silent surroundings'); }
  } else if (userNoise === 'moderate') {
    if (propNoise === 'silent' || propNoise === 'moderate') { earnedScore += noiseWeight; matches.push('🔇 Acceptable noise level'); }
    else { earnedScore += noiseWeight * 0.4; mismatches.push('🔊 Busier street than preferred'); }
  } else {
    earnedScore += noiseWeight; matches.push('🔇 You\'re flexible on noise levels');
  }

  // --- 2. Safety Priority (weight: 15) ---
  const safetyWeight = 15;
  totalWeight += safetyWeight;
  const propSafety = (property.safetyRating || inferSafety(property)).toLowerCase();
  const userSafety = prefs.safetyPriority.toLowerCase();

  if (userSafety === 'top') {
    if (propSafety === 'high') { earnedScore += safetyWeight; matches.push('🛡️ High safety area — top priority met'); }
    else if (propSafety === 'medium') { earnedScore += safetyWeight * 0.5; mismatches.push('⚠️ Medium safety — you want top security'); }
    else { mismatches.push('⚠️ Lower safety rating — doesn\'t match your priority'); }
  } else if (userSafety === 'medium') {
    if (propSafety !== 'low') { earnedScore += safetyWeight; matches.push('🛡️ Adequate safety for your needs'); }
    else { earnedScore += safetyWeight * 0.3; mismatches.push('⚠️ Safety rating is low'); }
  } else {
    earnedScore += safetyWeight; matches.push('🛡️ Safety is flexible for you');
  }

  // --- 3. School Nearby (weight: 12) ---
  const schoolWeight = 12;
  totalWeight += schoolWeight;
  if (prefs.schoolNearby === 'Yes') {
    if (property.nearSchool) { earnedScore += schoolWeight; matches.push('🏫 School within 2km radius'); }
    else { mismatches.push('🏫 No school listed nearby — important for you'); }
  } else {
    earnedScore += schoolWeight; matches.push('🏫 School proximity not required');
  }

  // --- 4. Green Space (weight: 10) ---
  const greenWeight = 10;
  totalWeight += greenWeight;
  if (prefs.greenSpace === 'Park nearby essential') {
    if (property.nearPark) { earnedScore += greenWeight; matches.push('🌳 Park / green space nearby'); }
    else { mismatches.push('🌳 No park listed nearby — you prefer green space'); }
  } else if (prefs.greenSpace === 'Nice to have') {
    if (property.nearPark) { earnedScore += greenWeight; matches.push('🌳 Bonus — park nearby'); }
    else { earnedScore += greenWeight * 0.7; }
  } else {
    earnedScore += greenWeight;
  }

  // --- 5. Pet Owner (weight: 10) ---
  const petWeight = 10;
  totalWeight += petWeight;
  if (prefs.petOwner === 'Yes') {
    if (property.petFriendly) { earnedScore += petWeight; matches.push('🐾 Pet-friendly property'); }
    else if (property.propertyType === 'Villa' || property.propertyType === 'Independent House') {
      earnedScore += petWeight * 0.7; matches.push('🐾 Independent property — likely pet-friendly');
    } else { earnedScore += petWeight * 0.3; mismatches.push('🐾 Not listed as pet-friendly'); }
  } else {
    earnedScore += petWeight;
  }

  // --- 6. Floor Preference (weight: 10) ---
  const floorWeight = 10;
  totalWeight += floorWeight;
  const propFloor = (property.floor || 'any').toLowerCase();
  const userFloor = prefs.preferredFloor.toLowerCase();

  if (userFloor === 'any') {
    earnedScore += floorWeight; matches.push('🏢 Any floor works for you');
  } else if (userFloor === 'ground' && propFloor === 'ground') {
    earnedScore += floorWeight; matches.push('🏢 Ground floor — matches your preference');
  } else if (userFloor === 'low' && (propFloor === 'low' || propFloor === 'ground')) {
    earnedScore += floorWeight; matches.push('🏢 Low floor — matches your preference');
  } else if (userFloor === 'high' && propFloor === 'high') {
    earnedScore += floorWeight; matches.push('🏢 High floor — matches your preference');
  } else if (propFloor === 'any' || !property.floor) {
    earnedScore += floorWeight * 0.6;
  } else {
    earnedScore += floorWeight * 0.3; mismatches.push(`🏢 Floor (${propFloor}) doesn't match your preference (${userFloor})`);
  }

  // --- 7. Work from Home (weight: 10) ---
  const wfhWeight = 10;
  totalWeight += wfhWeight;
  if (prefs.workFromHome === 'Yes' || prefs.workFromHome === 'Hybrid') {
    // WFH people prefer quieter areas, more space
    if (property.areaSqFt >= 800 && (propNoise === 'silent' || propNoise === 'moderate')) {
      earnedScore += wfhWeight; matches.push('💻 Spacious & quiet — great for WFH');
    } else if (property.areaSqFt >= 800) {
      earnedScore += wfhWeight * 0.6; matches.push('💻 Decent space for WFH setup');
    } else {
      earnedScore += wfhWeight * 0.3; mismatches.push('💻 Compact space — may be tight for WFH');
    }
  } else {
    earnedScore += wfhWeight;
  }

  // --- 8. Commute Tolerance (weight: 8) ---
  const commuteWeight = 8;
  totalWeight += commuteWeight;
  if (prefs.commuteTolerance === '< 15 min' || prefs.commuteTolerance === '15–30 min') {
    if (property.nearMetro) { earnedScore += commuteWeight; matches.push('🚇 Near metro/transit — short commute'); }
    else { earnedScore += commuteWeight * 0.5; mismatches.push('🚇 No transit listed nearby — commute may be longer'); }
  } else {
    earnedScore += commuteWeight; matches.push('🚇 Commute distance is flexible for you');
  }

  // --- 9. Gated Community Bonus (weight: 5) ---
  const gatedWeight = 5;
  totalWeight += gatedWeight;
  if (property.isGated) {
    earnedScore += gatedWeight; matches.push('🏘️ Gated community — added security');
  } else {
    earnedScore += gatedWeight * 0.5;
  }

  // --- 10. Verified Property Bonus (weight: 5) ---
  const verifiedWeight = 5;
  totalWeight += verifiedWeight;
  if (property.isVerified) {
    earnedScore += verifiedWeight; matches.push('✅ Verified listing — trusted');
  } else {
    earnedScore += verifiedWeight * 0.4;
  }

  const score = Math.round((earnedScore / totalWeight) * 100);

  return { score: Math.min(100, Math.max(0, score)), matches, mismatches };
}

// Infer noise level from property metadata when not explicitly set
function inferNoise(property) {
  if (property.isGated) return 'Silent';
  if (property.propertyType === 'Villa' || property.propertyType === 'Independent House') return 'Moderate';
  if (property.locality) {
    const quietLocalities = ['whitefield', 'hinjewadi', 'sector 78', 'malviya nagar'];
    if (quietLocalities.some(l => property.locality.toLowerCase().includes(l))) return 'Moderate';
  }
  return 'Busy';
}

// Infer safety from property metadata when not explicitly set
function inferSafety(property) {
  if (property.isGated && property.isVerified) return 'High';
  if (property.isGated || property.isVerified) return 'Medium';
  return 'Medium';
}

// ============================================================
// POST /api/ai/negotiation — AI Negotiation Assistant
// ============================================================
const getNegotiationAssist = async (req, res) => {
  try {
    const { propertyId } = req.body;

    const property = await prisma.property.findUnique({
      where: { id: parseInt(propertyId) },
      include: { uploader: { select: { name: true } } },
    });

    if (!property) {
      return res.status(404).json({ message: 'Property not found' });
    }

    // Fetch comparable listings (same city + same BHK, last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const comparables = await prisma.property.findMany({
      where: {
        city: property.city,
        bhk: property.bhk,
        id: { not: property.id },
        createdAt: { gte: sixMonthsAgo },
      },
      orderBy: { price: 'asc' },
    });

    // Calculate analysis
    const pricePerSqft = property.price / property.areaSqFt;
    const compPrices = comparables.map(c => c.price / c.areaSqFt);
    const avgPricePerSqft = compPrices.length > 0
      ? compPrices.reduce((a, b) => a + b, 0) / compPrices.length
      : pricePerSqft;
    const medianPricePerSqft = compPrices.length > 0
      ? compPrices.sort((a, b) => a - b)[Math.floor(compPrices.length / 2)]
      : pricePerSqft;

    // Days on market
    const daysOnMarket = Math.floor((Date.now() - new Date(property.createdAt).getTime()) / (1000 * 60 * 60 * 24));

    // Fair value range
    const fairLow = Math.round(medianPricePerSqft * property.areaSqFt * 0.95);
    const fairHigh = Math.round(medianPricePerSqft * property.areaSqFt * 1.05);
    const recommendedOffer = Math.round(medianPricePerSqft * property.areaSqFt * 0.93);

    // Seller motivation
    let sellerMotivation = 'Neutral';
    let discountRange = '2-5%';
    if (daysOnMarket > 90) { sellerMotivation = 'Motivated'; discountRange = '6-12%'; }
    else if (daysOnMarket > 45) { sellerMotivation = 'Hot'; discountRange = '4-8%'; }

    // Price comparison
    const priceDiffPercent = ((pricePerSqft - avgPricePerSqft) / avgPricePerSqft * 100).toFixed(1);
    const isOverpriced = parseFloat(priceDiffPercent) > 5;
    const isUnderpriced = parseFloat(priceDiffPercent) < -5;

    // Generate negotiation script
    const scripts = [];
    if (isOverpriced) {
      scripts.push(`"I've compared ${comparables.length} similar ${property.bhk} properties in ${property.locality || property.city}. The average rate is ₹${Math.round(avgPricePerSqft).toLocaleString('en-IN')}/sqft, while this one is listed at ₹${Math.round(pricePerSqft).toLocaleString('en-IN')}/sqft — that's ${priceDiffPercent}% above market."`);
    }
    if (daysOnMarket > 30) {
      scripts.push(`"I notice this property has been listed for ${daysOnMarket} days. I'm a serious buyer ready to close quickly, which saves you ongoing maintenance and opportunity costs."`);
    }
    scripts.push(`"Based on recent transactions in this area, I'd like to start the discussion at ₹${formatINR(recommendedOffer)}. This is backed by market data from ${comparables.length} comparable listings."`);
    if (comparables.length > 3) {
      scripts.push(`"There are currently ${comparables.length} similar listings active in this area, giving buyers more options. A competitive price will help us close faster."`);
    }

    return res.json({
      propertyId: property.id,
      propertyTitle: property.title,
      currentPrice: property.price,
      pricePerSqft: Math.round(pricePerSqft),
      avgPricePerSqft: Math.round(avgPricePerSqft),
      medianPricePerSqft: Math.round(medianPricePerSqft),
      fairValueRange: { low: fairLow, high: fairHigh },
      recommendedOffer,
      daysOnMarket,
      comparableCount: comparables.length,
      sellerMotivation,
      discountRange,
      priceDiffPercent: parseFloat(priceDiffPercent),
      isOverpriced,
      isUnderpriced,
      negotiationScripts: scripts,
    });
  } catch (error) {
    console.error('Negotiation assist error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

function formatINR(val) {
  if (val >= 10000000) return `₹${(val / 10000000).toFixed(2)} Cr`;
  if (val >= 100000) return `₹${(val / 100000).toFixed(2)} L`;
  return `₹${val.toLocaleString('en-IN')}`;
}

module.exports = { savePreferences, getPreferences, getMatchScore, getMatchScoresBulk, getNegotiationAssist };

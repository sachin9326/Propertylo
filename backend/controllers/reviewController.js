const prisma = require('../db');

// Get reviews for a property or locality
const getReviews = async (req, res) => {
  try {
    const { propertyId, locality } = req.query;

    const where = {};
    if (propertyId) where.propertyId = parseInt(propertyId);
    if (locality) where.locality = { contains: locality };
    where.isFlagged = false;

    const reviews = await prisma.review.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    // Compute aggregate scores
    const count = reviews.length;
    const avg = (field) => count > 0 ? (reviews.reduce((sum, r) => sum + r[field], 0) / count).toFixed(1) : 0;

    const aggregate = count > 0 ? {
      waterSupply: avg('waterSupply'),
      powerBackup: avg('powerBackup'),
      security: avg('security'),
      maintenance: avg('maintenance'),
      noiseLevel: avg('noiseLevel'),
      parking: avg('parking'),
      neighborly: avg('neighborly'),
      management: avg('management'),
      overall: (
        (parseFloat(avg('waterSupply')) +
          parseFloat(avg('powerBackup')) +
          parseFloat(avg('security')) +
          parseFloat(avg('maintenance')) +
          (6 - parseFloat(avg('noiseLevel'))) + // inverted — lower noise = better
          parseFloat(avg('parking')) +
          parseFloat(avg('neighborly')) +
          parseFloat(avg('management'))) / 8
      ).toFixed(1),
    } : null;

    return res.json({ reviews, count, aggregate });
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Submit a review
const createReview = async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      propertyId, locality, society,
      waterSupply, powerBackup, security, maintenance,
      noiseLevel, parking, neighborly, management, comment
    } = req.body;

    // Detect fresh account abuse (created < 24hrs ago)
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const ageHours = (Date.now() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60);
    const isFlagged = ageHours < 24;

    const review = await prisma.review.create({
      data: {
        userId,
        propertyId: propertyId ? parseInt(propertyId) : null,
        locality: locality || null,
        society: society || null,
        waterSupply: parseInt(waterSupply) || 3,
        powerBackup: parseInt(powerBackup) || 3,
        security: parseInt(security) || 3,
        maintenance: parseInt(maintenance) || 3,
        noiseLevel: parseInt(noiseLevel) || 3,
        parking: parseInt(parking) || 3,
        neighborly: parseInt(neighborly) || 3,
        management: parseInt(management) || 3,
        comment: comment || null,
        isFlagged,
      },
      include: { user: { select: { name: true } } },
    });

    return res.status(201).json({
      review,
      message: isFlagged
        ? 'Review submitted and pending moderation'
        : 'Review published successfully!',
    });
  } catch (error) {
    console.error('Create review error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Flag a review
const flagReview = async (req, res) => {
  try {
    await prisma.review.update({
      where: { id: parseInt(req.params.id) },
      data: { isFlagged: true },
    });
    return res.json({ message: 'Review flagged for moderation' });
  } catch (error) {
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getReviews, createReview, flagReview };

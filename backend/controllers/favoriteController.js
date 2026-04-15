const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/favorites — get user's saved properties
const getFavorites = async (req, res) => {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId: req.user.id },
      include: {
        property: {
          include: {
            uploader: { select: { name: true, email: true, phone: true } }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const properties = favorites.map(f => ({
      ...f.property,
      imageUrls: f.property.imageUrls ? JSON.parse(f.property.imageUrls) : [],
      favoriteId: f.id,
      savedAt: f.createdAt,
    }));

    res.json(properties);
  } catch (error) {
    console.error("GET /favorites error:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/favorites/:propertyId — toggle save/unsave
const toggleFavorite = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const userId = req.user.id;

    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } }
    });

    if (existing) {
      await prisma.favorite.delete({ where: { id: existing.id } });
      res.json({ saved: false, message: 'Property removed from favorites' });
    } else {
      await prisma.favorite.create({ data: { userId, propertyId } });
      res.json({ saved: true, message: 'Property saved to favorites' });
    }
  } catch (error) {
    console.error("POST /favorites error:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/favorites/check/:propertyId — check if saved
const checkFavorite = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId: req.user.id, propertyId } }
    });
    res.json({ saved: !!existing });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/dashboard/stats — seller stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const myListings = await prisma.property.findMany({
      where: { uploaderId: userId },
      orderBy: { createdAt: 'desc' }
    });

    const totalViews = myListings.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalFavorites = await prisma.favorite.count({
      where: { property: { uploaderId: userId } }
    });

    const listings = myListings.map(p => ({
      ...p,
      imageUrls: p.imageUrls ? JSON.parse(p.imageUrls) : []
    }));

    res.json({
      totalListings: listings.length,
      totalViews,
      totalFavorites,
      listings,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getFavorites, toggleFavorite, checkFavorite, getDashboardStats };

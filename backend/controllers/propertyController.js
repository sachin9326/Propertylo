const { PrismaClient } = require('@prisma/client');
const cache = require('memory-cache');
const prisma = require('../db');

const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes cache
const PROPERTIES_CACHE_KEY = 'properties_list_';

// ============================================================
// GET /api/properties — Advanced multi-filter search
// ============================================================
const getProperties = async (req, res) => {
  try {
    const {
      search,
      type,
      propertyType,
      bhk,
      possessionStatus,
      listingType,
      isVerified,
      isGated,
      withPhotos,
      withVideos,
      minPrice,
      maxPrice,
      minArea,
      maxArea,
      city,
      category,
    } = req.query;
    console.log("Incoming Query Params:", req.query);

    let whereClause = {};

    // --- Listing type (RENT / SALE / BUY) ---
    if (type && type !== 'ALL') {
      whereClause.type = type;
    }

    // --- Smart text search (city, locality, title, address) ---
    if (search) {
      whereClause.OR = [
        { title: { contains: search } },
        { address: { contains: search } },
        { city: { contains: search } },
        { locality: { contains: search } },
      ];
    }

    // --- City filter ---
    if (city) {
      whereClause.city = { contains: city };
    }

    // --- Category filter ---
    if (category) {
      const catValues = category.split(',');
      if (catValues.length === 1) {
        whereClause.category = catValues[0];
      } else {
        whereClause.category = { in: catValues };
      }
    }

    // --- Property Type (Flat, Villa, Plot...) multi-select ---
    if (propertyType) {
      const types = propertyType.split(',');
      if (types.length === 1) {
        whereClause.propertyType = types[0];
      } else {
        whereClause.propertyType = { in: types };
      }
    }

    // --- BHK multi-select (1BHK,2BHK,3BHK) ---
    if (bhk) {
      const bhkValues = bhk.split(',');
      if (bhkValues.length === 1) {
        whereClause.bhk = bhkValues[0];
      } else {
        whereClause.bhk = { in: bhkValues };
      }
    }

    // --- Possession Status ---
    if (possessionStatus) {
      whereClause.possessionStatus = possessionStatus;
    }

    // --- Listing Type (New Launch, Resale, etc.) ---
    if (listingType) {
      const ltValues = listingType.split(',');
      if (ltValues.length === 1) {
        whereClause.listingType = ltValues[0];
      } else {
        whereClause.listingType = { in: ltValues };
      }
    }

    // --- Verified toggle ---
    if (isVerified === 'true') {
      whereClause.isVerified = true;
    }

    // --- Gated Society toggle ---
    if (isGated === 'true') {
      whereClause.isGated = true;
    }

    // --- Budget range ---
    if (minPrice || maxPrice) {
      whereClause.price = {};
      if (minPrice) whereClause.price.gte = parseFloat(minPrice);
      if (maxPrice) whereClause.price.lte = parseFloat(maxPrice);
    }

    // --- Area range ---
    if (minArea || maxArea) {
      whereClause.areaSqFt = {};
      if (minArea) whereClause.areaSqFt.gte = parseFloat(minArea);
      if (maxArea) whereClause.areaSqFt.lte = parseFloat(maxArea);
    }

    // --- Media filters ---
    if (withPhotos === 'true') {
      whereClause.NOT = { imageUrls: '[]' };
    }
    if (withVideos === 'true') {
      whereClause.videoUrl = { not: null };
    }

    const page = parseInt(req.query.page) || 1;
    const limit = Math.min(parseInt(req.query.limit) || 8, 50); // Default 8, max 50
    const skip = (page - 1) * limit;

    // Create a unique cache key based on query params
    const cacheKey = PROPERTIES_CACHE_KEY + JSON.stringify({ ...req.query, skip, limit });
    const cachedData = cache.get(cacheKey);
    
    if (cachedData) {
      console.log("Serving from Cache:", cacheKey);
      return res.json(cachedData);
    }

    // Run queries in parallel instead of a sequential transaction for better performance
    const [total, properties] = await Promise.all([
      prisma.property.count({ where: whereClause }),
      prisma.property.findMany({
        where: whereClause,
        select: {
          id: true,
          title: true,
          price: true,
          address: true,
          city: true,
          type: true,
          propertyType: true,
          bhk: true,
          areaSqFt: true,
          imageUrls: true,
          isVerified: true,
          isGated: true,
          possessionStatus: true,
          listingType: true,
          createdAt: true,
          // NOTE: uploader join removed — not shown in card view, saves a DB JOIN
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      })
    ]);

    const propertiesWithParsedImages = properties.map(prop => ({
      ...prop,
      imageUrls: prop.imageUrls ? JSON.parse(prop.imageUrls) : []
    }));

    // Optionally calculate match scores if userId is provided
    let matchScores = {};
    const userId = req.query.userId;
    if (userId) {
      try {
        // Simple mock score generation or call internal logic
        // For now, let's just indicate we could do it here
        // (In a real app, you'd call your AI scoring function here)
      } catch (e) {}
    }

    const responseData = {
      properties: propertiesWithParsedImages,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      matchScores // Included in the same request
    };

    // Cache the result
    cache.put(cacheKey, responseData, CACHE_DURATION);
    res.set('Cache-Control', 'public, max-age=300');
    res.json(responseData);
  } catch (error) {
    console.error("GET /properties error:", error);
    res.status(500).json({ message: 'Server error fetching properties' });
  }
};

// ============================================================
// GET /api/properties/:id
// ============================================================
const getPropertyById = async (req, res) => {
  try {
    const property = await prisma.property.findUnique({
      where: { id: parseInt(req.params.id) },
      include: {
        uploader: {
          select: { name: true, phone: true, email: true }
        }
      }
    });

    if (property) {
      property.imageUrls = property.imageUrls ? JSON.parse(property.imageUrls) : [];
      res.json(property);
    } else {
      res.status(404).json({ message: 'Property not found' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};

// ============================================================
// POST /api/properties — Create with new fields
// ============================================================
const createProperty = async (req, res) => {
  try {
    const {
      title, description, address, areaSqFt, price, type,
      city, locality, propertyType, bhk, possessionStatus, listingType,
      isVerified, isGated, isNewLaunch, isNewBooking, category,
      propertyKind, contactInfo
    } = req.body;

    // Process files from multer
    const files = req.files || [];
    let imageUrls = [];
    let videoUrl = null;

    files.forEach(file => {
      if (file.mimetype.startsWith('image/')) {
        imageUrls.push(`/uploads/${file.filename}`);
      } else if (file.mimetype.startsWith('video/')) {
        videoUrl = `/uploads/${file.filename}`;
      }
    });

    // Optionally accept videoUrl as text link if no file
    if (!videoUrl && req.body.videoUrl) {
      videoUrl = req.body.videoUrl;
    }

    const property = await prisma.property.create({
      data: {
        title,
        description,
        address,
        city: city || null,
        locality: locality || null,
        areaSqFt: parseFloat(areaSqFt),
        price: parseFloat(price),
        type,
        propertyType: propertyType || null,
        bhk: bhk || null,
        possessionStatus: possessionStatus || null,
        listingType: listingType || null,
        isVerified: isVerified === 'true' || isVerified === true,
        isGated: isGated === 'true' || isGated === true,
        isNewLaunch: isNewLaunch === 'true' || isNewLaunch === true,
        isNewBooking: isNewBooking === 'true' || isNewBooking === true,
        category: category || null,
        propertyKind: propertyKind || null,
        contactInfo: contactInfo || null,
        imageUrls: JSON.stringify(imageUrls),
        videoUrl: videoUrl || null,
        uploaderId: req.user.id
      }
    });

    // Clear property caches to show new listing
    cache.clear();

    res.status(201).json(property);
  } catch (error) {
    console.error("POST /properties error:", error);
    res.status(500).json({ message: 'Server error creating property', error: error.message });
  }
};

module.exports = { getProperties, getPropertyById, createProperty };

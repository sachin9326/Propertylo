const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

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

    const properties = await prisma.property.findMany({
      where: whereClause,
      include: {
        uploader: {
          select: { name: true, email: true, phone: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const propertiesWithParsedImages = properties.map(prop => ({
      ...prop,
      imageUrls: prop.imageUrls ? JSON.parse(prop.imageUrls) : []
    }));

    res.json(propertiesWithParsedImages);
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

    res.status(201).json(property);
  } catch (error) {
    console.error("POST /properties error:", error);
    res.status(500).json({ message: 'Server error creating property', error: error.message });
  }
};

module.exports = { getProperties, getPropertyById, createProperty };

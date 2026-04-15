const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Generate available time slots for a property
const getAvailableSlots = async (req, res) => {
  try {
    const propertyId = parseInt(req.params.propertyId);
    const { date } = req.query;

    const allSlots = [
      '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM',
      '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM'
    ];

    // Get already booked slots for this property on this date
    const booked = await prisma.visit.findMany({
      where: {
        propertyId,
        date: date || '',
        status: { in: ['PENDING', 'CONFIRMED'] },
        isGroupTour: false,
      },
    });

    const bookedSlots = booked.map(b => b.timeSlot);
    const available = allSlots.filter(s => !bookedSlots.includes(s));

    return res.json({ available, booked: bookedSlots });
  } catch (error) {
    console.error('Get slots error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Book a visit
const bookVisit = async (req, res) => {
  try {
    const { propertyId, date, timeSlot, isGroupTour } = req.body;
    const userId = req.user.id;

    // Check if slot already taken
    const existing = await prisma.visit.findFirst({
      where: {
        propertyId: parseInt(propertyId),
        date,
        timeSlot,
        status: { in: ['PENDING', 'CONFIRMED'] },
        isGroupTour: false,
      },
    });

    if (existing && !isGroupTour) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }

    const visit = await prisma.visit.create({
      data: {
        userId,
        propertyId: parseInt(propertyId),
        date,
        timeSlot,
        status: 'CONFIRMED',
        isGroupTour: isGroupTour || false,
      },
      include: {
        property: { select: { title: true, address: true } },
        user: { select: { name: true, email: true } },
      },
    });

    return res.status(201).json({ message: 'Visit booked!', visit });
  } catch (error) {
    console.error('Book visit error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Get user's visits
const getMyVisits = async (req, res) => {
  try {
    const visits = await prisma.visit.findMany({
      where: { userId: req.user.id },
      include: {
        property: { select: { id: true, title: true, address: true, imageUrls: true } },
      },
      orderBy: { date: 'asc' },
    });

    const mapped = visits.map(v => ({
      ...v,
      property: { ...v.property, imageUrls: v.property.imageUrls ? JSON.parse(v.property.imageUrls) : [] },
    }));

    return res.json(mapped);
  } catch (error) {
    console.error('Get visits error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

// Cancel a visit
const cancelVisit = async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const visit = await prisma.visit.findUnique({ where: { id } });

    if (!visit || visit.userId !== req.user.id) {
      return res.status(404).json({ message: 'Visit not found' });
    }

    await prisma.visit.update({ where: { id }, data: { status: 'CANCELLED' } });
    return res.json({ message: 'Visit cancelled' });
  } catch (error) {
    console.error('Cancel visit error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getAvailableSlots, bookVisit, getMyVisits, cancelVisit };

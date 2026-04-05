import express from 'express';
import userAuth from '../middleware/userAuth.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';

const router = express.Router();

/**
 * Generate a standards-compliant .ics (iCalendar) file for an event.
 * Users can add this to Google Calendar, Apple Calendar, Outlook, etc.
 * 
 * GET /api/calendar/event/:eventId
 */
router.get('/event/:eventId', async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId)
      .populate({ path: 'creator', model: User, select: 'name email' })
      .lean();

    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }

    // Parse date and time robustly
    const eventDate = new Date(event.date);
    let [hours, minutes] = (event.time || '18:00').split(':').map(str => parseInt(str, 10));
    if (isNaN(hours)) hours = 18;
    if (isNaN(minutes)) minutes = 0;
    eventDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000); // Default 2hr duration

    const formatICSDate = (date) => {
      return date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    };

    const uid = `${event._id}@joinme.app`;
    const now = formatICSDate(new Date());
    const dtStart = formatICSDate(eventDate);
    const dtEnd = formatICSDate(endDate);

    // Escape special characters for iCal
    const escapeICS = (str) => (str || '').replace(/[,;\\]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
    
    const organizerName = event.creator?.name || 'JoinMe Host';
    const organizerEmail = event.creator?.email || 'noreply@joinme.app';

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//JoinMe//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTAMP:${now}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      `SUMMARY:${escapeICS(event.title)}`,
      `DESCRIPTION:${escapeICS(event.description || 'JoinMe Event')}\\n\\nCategory: ${event.category}\\nVenue: ${event.venue}\\nCity: ${event.city}\\nHost: ${organizerName}`,
      `LOCATION:${escapeICS(event.venue + ', ' + event.city)}`,
      `ORGANIZER;CN=${escapeICS(organizerName)}:mailto:${organizerEmail}`,
      `STATUS:${event.status === 'cancelled' ? 'CANCELLED' : 'CONFIRMED'}`,
      'BEGIN:VALARM',
      'TRIGGER:-PT60M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS(event.title)} starts in 1 hour!`,
      'END:VALARM',
      'BEGIN:VALARM',
      'TRIGGER:-PT15M',
      'ACTION:DISPLAY',
      `DESCRIPTION:${escapeICS(event.title)} starts in 15 minutes!`,
      'END:VALARM',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${event.title.replace(/[^a-zA-Z0-9]/g, '_')}.ics"`);
    res.send(icsContent);
  } catch (error) {
    console.error('Calendar export error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

/**
 * Export all user's upcoming events as a single .ics calendar
 * GET /api/calendar/my-events
 */
router.get('/my-events', userAuth, async (req, res) => {
  try {
    const userId = req.user.id;

    const events = await Event.find({
      $or: [
        { creator: userId },
        { 'requests.user': userId, 'requests.status': 'approved' },
      ],
      status: { $in: ['upcoming', 'live'] },
      date: { $gte: new Date() },
    })
      .populate({ path: 'creator', model: User, select: 'name email' })
      .sort({ date: 1 })
      .lean();

    const formatICSDate = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
    const escapeICS = (str) => (str || '').replace(/[,;\\]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
    const now = formatICSDate(new Date());

    const vevents = events.map(event => {
      const eventDate = new Date(event.date);
      const [hours, minutes] = (event.time || '18:00').split(':').map(Number);
      eventDate.setHours(hours || 18, minutes || 0, 0, 0);
      const endDate = new Date(eventDate.getTime() + 2 * 60 * 60 * 1000);

      return [
        'BEGIN:VEVENT',
        `UID:${event._id}@joinme.app`,
        `DTSTAMP:${now}`,
        `DTSTART:${formatICSDate(eventDate)}`,
        `DTEND:${formatICSDate(endDate)}`,
        `SUMMARY:${escapeICS(event.title)}`,
        `DESCRIPTION:${escapeICS(event.description || '')}\\nCategory: ${event.category}`,
        `LOCATION:${escapeICS(event.venue + ', ' + event.city)}`,
        'BEGIN:VALARM',
        'TRIGGER:-PT60M',
        'ACTION:DISPLAY',
        `DESCRIPTION:${escapeICS(event.title)} starts in 1 hour!`,
        'END:VALARM',
        'END:VEVENT',
      ].join('\r\n');
    });

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//JoinMe//Event Calendar//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      `X-WR-CALNAME:JoinMe Events`,
      ...vevents,
      'END:VCALENDAR',
    ].join('\r\n');

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="joinme-events.ics"');
    res.send(icsContent);
  } catch (error) {
    console.error('Calendar export all error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

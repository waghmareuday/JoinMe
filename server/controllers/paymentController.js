import Stripe from 'stripe';
import Event from '../models/eventModel.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: "Event not found" });

    if (!event.isPaid || !event.amount) {
      return res.status(400).json({ success: false, message: "This is not a paid event." });
    }

    if (!['upcoming', 'live'].includes(event.status)) {
      return res.status(400).json({ success: false, message: "Event is no longer accepting payments." });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      metadata: {
        eventId: String(event._id),
        userId: String(userId),
      },
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: `Entry Ticket: ${event.title}`,
              description: `${event.category} at ${event.venue}`,
            },
            unit_amount: event.amount * 100,
          },
          quantity: 1,
        },
      ],
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?payment=cancelled`,
    });

    res.status(200).json({ success: true, url: session.url });

  } catch (error) {
    console.error("Stripe Checkout Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to create payment session" });
  }
};

export const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      const { eventId, userId } = session.metadata;

      // JM-002: Ownership check — ensure calling user matches the one who paid
      if (String(userId) !== String(req.user.id)) {
        return res.status(403).json({ success: false, message: "Unauthorized: Payment ownership mismatch." });
      }

      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ success: false, message: "Event not found" });

      const existingRequest = event.requests.find(r => String(r.user._id || r.user) === String(userId));
      
      if (!existingRequest) {
        event.requests.push({ user: userId, status: 'approved' });
      } else {
        existingRequest.status = 'approved';
      }

      event.markModified('requests');
      await event.save();

      return res.status(200).json({ success: true, message: "Payment verified! You are in." });
    } else {
      return res.status(400).json({ success: false, message: "Payment was not completed." });
    }
  } catch (error) {
    console.error("Verification Error:", error.message);
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
};

// Refund payment for cancelled paid events
export const refundPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, message: "Session ID is required" });
    }

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    if (session.payment_status !== 'paid' || !session.payment_intent) {
      return res.status(400).json({ success: false, message: "No paid session found to refund" });
    }

    // JM-005: Ownership check — ensure calling user matches the original payer
    if (String(session.metadata.userId) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: "Unauthorized: You can only refund your own payments." });
    }

    const refund = await stripe.refunds.create({
      payment_intent: session.payment_intent,
    });

    return res.status(200).json({ success: true, message: "Refund processed", refundId: refund.id });
  } catch (error) {
    console.error("Refund Error:", error.message);
    res.status(500).json({ success: false, message: "Failed to process refund" });
  }
};
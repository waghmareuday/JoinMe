import Stripe from 'stripe';
import Event from '../models/eventModel.js';

// Initialize Stripe with your secret key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const createCheckoutSession = async (req, res) => {
  try {
    const { eventId } = req.body;
    const userId = req.user.id;

    // 1. Fetch the event to get the exact price and details
    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ message: "Event not found" });

    if (!event.isPaid || !event.amount) {
      return res.status(400).json({ message: "This is not a paid event." });
    }

    // 2. Create the Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      // 🟢 THE SECRET SAUCE: Metadata lets us pass the event and user IDs through Stripe 
      // so the webhook knows exactly who paid for what later!
      metadata: {
        eventId: String(event._id),
        userId: String(userId),
      },
      line_items: [
        {
          price_data: {
            currency: 'inr', // Or 'usd', depending on your target audience
            product_data: {
              name: `Entry Ticket: ${event.title}`,
              description: `${event.category} Match at ${event.venue}`,
            },
            unit_amount: event.amount * 100, // Stripe expects the amount in the smallest currency unit (paise/cents)
          },
          quantity: 1,
        },
      ],
      // Where Stripe sends the user after they pay (or cancel)
      // Change this line inside stripe.checkout.sessions.create:
      success_url: `${process.env.FRONTEND_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/dashboard?payment=cancelled`,
    });

    // 3. Send the secure Stripe URL to the frontend
    res.status(200).json({ success: true, url: session.url });

  } catch (error) {
    console.error("Stripe Checkout Error:", error);
    res.status(500).json({ success: false, message: "Failed to create payment session" });
  }
}

export const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    
    // 1. Ask Stripe if this session actually got paid
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === 'paid') {
      // 2. Extract the IDs we hid in the metadata earlier!
      const { eventId, userId } = session.metadata;

      const event = await Event.findById(eventId);
      if (!event) return res.status(404).json({ message: "Event not found" });

      // 3. Update or Add the user
      const existingRequest = event.requests.find(r => String(r.user._id || r.user) === String(userId));
      
      if (!existingRequest) {
        event.requests.push({ user: userId, status: 'approved' });
      } else {
        existingRequest.status = 'approved';
      }

      // 🟢 THE FIX: Force Mongoose to save the nested array changes
      event.markModified('requests');
      await event.save();

      return res.status(200).json({ success: true, message: "Payment verified! You are in." });
    } else {
      return res.status(400).json({ success: false, message: "Payment was not completed." });
    }
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ success: false, message: "Server error during verification" });
  }
}
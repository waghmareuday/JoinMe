import Joi from 'joi';

// Middleware factory: validates req.body against a Joi schema
export const validate = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
  if (error) {
    const messages = error.details.map(d => d.message).join(', ');
    return res.status(400).json({ success: false, message: messages });
  }
  next();
};

// ===================== SCHEMAS =====================

export const registerSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  gender: Joi.string().valid('Male', 'Female', 'Other').required(),
  age: Joi.number().integer().min(13).max(120).required(),
  city: Joi.string().trim().min(2).max(100).required(),
  profession: Joi.string().trim().max(100).allow('').optional(),
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  rememberMe: Joi.boolean().optional(),
});

export const createEventSchema = Joi.object({
  title: Joi.string().trim().min(3).max(200).required(),
  description: Joi.string().trim().max(1000).allow('').optional(),
  category: Joi.string().valid('Cricket', 'Football', 'Volleyball', 'Movie', 'Trip', 'Carpooling', 'Other').required(),
  city: Joi.string().trim().min(2).max(100).required(),
  venue: Joi.string().trim().min(2).max(200).required(),
  date: Joi.date().iso().required(),
  time: Joi.string().trim().required(),
  requiredPeople: Joi.number().integer().min(1).max(500).required(),
  isPaid: Joi.boolean().optional(),
  amount: Joi.number().min(0).max(100000).when('isPaid', { is: true, then: Joi.required() }).optional(),
  notes: Joi.string().trim().max(500).allow('').optional(),
  isRecurring: Joi.boolean().optional(),
  recurringPattern: Joi.string().valid('daily', 'weekly', 'biweekly', 'monthly').when('isRecurring', { is: true, then: Joi.required() }).optional(),
});

export const updateEventSchema = Joi.object({
  eventId: Joi.string().required(),
  title: Joi.string().trim().min(3).max(200).optional(),
  description: Joi.string().trim().max(1000).allow('').optional(),
  venue: Joi.string().trim().min(2).max(200).optional(),
  date: Joi.date().iso().optional(),
  time: Joi.string().trim().optional(),
  requiredPeople: Joi.number().integer().min(1).max(500).optional(),
  notes: Joi.string().trim().max(500).allow('').optional(),
});

export const rateUserSchema = Joi.object({
  targetUserId: Joi.string().required(),
  rating: Joi.number().integer().min(1).max(5).required(),
  eventId: Joi.string().required(),
});

export const commentSchema = Joi.object({
  eventId: Joi.string().required(),
  text: Joi.string().trim().min(1).max(500).required(),
});

export const reportSchema = Joi.object({
  targetUserId: Joi.string().required(),
  reason: Joi.string().valid('spam', 'harassment', 'fraud', 'inappropriate', 'other').required(),
  description: Joi.string().trim().max(500).allow('').optional(),
});

export const updateProfileSchema = Joi.object({
  bio: Joi.string().trim().max(150).allow('').optional(),
  city: Joi.string().trim().max(100).optional(),
  profession: Joi.string().trim().max(100).allow('').optional(),
  age: Joi.number().integer().min(13).max(120).optional(),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional(),
  availability: Joi.array().items(Joi.object({
    day: Joi.string().valid('Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday').required(),
    startTime: Joi.string().required(),
    endTime: Joi.string().required(),
  })).optional(),
});

export const resetPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
  otp: Joi.string().length(6).required(),
  newPassword: Joi.string().min(6).max(128).required(),
});

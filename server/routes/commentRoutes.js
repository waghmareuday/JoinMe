import express from 'express';
import userAuth from '../middleware/userAuth.js';
import Comment from '../models/commentModel.js';
import Event from '../models/eventModel.js';
import User from '../models/userModel.js';
import sanitize from 'sanitize-html';

const router = express.Router();

// GET /api/comments/:eventId - Get all comments for an event (public Q&A)
router.get('/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const [comments, total] = await Promise.all([
      Comment.find({ event: eventId, parentComment: null })
        .populate({ path: 'author', model: User, select: 'name averageRating' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Comment.countDocuments({ event: eventId, parentComment: null }),
    ]);

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      comments.map(async (comment) => {
        const replies = await Comment.find({ parentComment: comment._id })
          .populate({ path: 'author', model: User, select: 'name' })
          .sort({ createdAt: 1 })
          .limit(5)
          .lean();
        return { ...comment, replies };
      })
    );

    res.status(200).json({
      success: true,
      comments: commentsWithReplies,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get comments error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/comments - Add a comment (authenticated)
router.post('/', userAuth, async (req, res) => {
  try {
    const { eventId, text, parentComment } = req.body;

    if (!eventId || !text?.trim()) {
      return res.status(400).json({ success: false, message: 'Event ID and comment text are required' });
    }

    const event = await Event.findById(eventId);
    if (!event) return res.status(404).json({ success: false, message: 'Event not found' });

    const sanitizedText = sanitize(text.trim(), { allowedTags: [], allowedAttributes: {} });

    const comment = new Comment({
      event: eventId,
      author: req.user.id,
      text: sanitizedText,
      parentComment: parentComment || null,
    });

    await comment.save();

    const populated = await Comment.findById(comment._id)
      .populate({ path: 'author', model: User, select: 'name averageRating' })
      .lean();

    res.status(201).json({ success: true, comment: populated });
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// DELETE /api/comments/:commentId - Delete own comment
router.delete('/:commentId', userAuth, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.commentId);
    if (!comment) return res.status(404).json({ success: false, message: 'Comment not found' });

    if (String(comment.author) !== String(req.user.id)) {
      return res.status(403).json({ success: false, message: 'You can only delete your own comments' });
    }

    await Comment.deleteMany({ parentComment: comment._id }); // Delete replies too
    await comment.deleteOne();

    res.status(200).json({ success: true, message: 'Comment deleted' });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;

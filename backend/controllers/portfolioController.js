const mongoose = require("mongoose");
const Portfolio = require("../models/Portfolio");
const User = require("../models/User");
const { validate } = require("../utils/validators");
const { sendSuccess, sendError } = require("../utils/response");

async function createPortfolio(req, res) {
  try {
    const { error, value } = validate(req.body, "portfolio");
    if (error) {
      const messages = error.details.map((e) => e.message);
      return sendError(res, "Validation Error", 400, messages);
    }

    const existingPortfolio = await Portfolio.findOne({
      userId: req.user.userId,
    });
    if (existingPortfolio) {
      return sendError(
        res,
        "You already have a portfolio. Use update to modify it.",
        400
      );
    }

    const portfolio = new Portfolio({
      userId: req.user.userId,
      ...value,
    });

    await portfolio.save();

    return sendSuccess(res, portfolio, "Portfolio created successfully", 201);
  } catch (err) {
    console.error("Create portfolio error:", err);
    return sendError(res, err.message || "Failed to create portfolio", 500);
  }
}

async function getPortfolio(req, res) {
  try {
    const { identifier } = req.params;

    let query = {};
    if (mongoose.Types.ObjectId.isValid(identifier)) {
      query = { $or: [{ userId: identifier }, { email: identifier }] };
    } else {
      query = { email: identifier };
    }

    let portfolio = await Portfolio.findOne(query).populate("userId", "name email role");

    if (!portfolio) {
      return sendError(res, "Portfolio not found", 404);
    }

    portfolio.viewCount += 1;
    await portfolio.save();

    return sendSuccess(res, portfolio);
  } catch (err) {
    console.error("Get portfolio error:", err);
    return sendError(res, err.message || "Failed to fetch portfolio", 500);
  }
}

async function getMyPortfolio(req, res) {
  try {
    const portfolio = await Portfolio.findOne({
      userId: req.user.userId,
    }).populate("userId", "name email role");

    if (!portfolio) {
      return sendError(res, "Portfolio not found", 404);
    }

    return sendSuccess(res, portfolio);
  } catch (err) {
    console.error("Get my portfolio error:", err);
    return sendError(res, err.message || "Failed to fetch portfolio", 500);
  }
}

async function updatePortfolio(req, res) {
  try {
    const portfolio = await Portfolio.findOne({
      userId: req.user.userId,
    });

    if (!portfolio) {
      return sendError(res, "Portfolio not found", 404);
    }

    const { error, value } = validate(req.body, "portfolio");
    if (error) {
      const messages = error.details.map((e) => e.message);
      return sendError(res, "Validation Error", 400, messages);
    }

    const updated = await Portfolio.findByIdAndUpdate(
      portfolio._id,
      value,
      { new: true, runValidators: true }
    ).populate("userId", "name email role");

    return sendSuccess(res, updated, "Portfolio updated successfully");
  } catch (err) {
    console.error("Update portfolio error:", err);
    return sendError(res, err.message || "Failed to update portfolio", 500);
  }
}

async function deletePortfolio(req, res) {
  try {
    const portfolio = await Portfolio.findOne({
      userId: req.user.userId,
    });

    if (!portfolio) {
      return sendError(res, "Portfolio not found", 404);
    }

    await Portfolio.findByIdAndDelete(portfolio._id);

    return sendSuccess(res, null, "Portfolio deleted successfully");
  } catch (err) {
    console.error("Delete portfolio error:", err);
    return sendError(res, err.message || "Failed to delete portfolio", 500);
  }
}

async function togglePublishPortfolio(req, res) {
  try {
    const portfolio = await Portfolio.findOne({
      userId: req.user.userId,
    });

    if (!portfolio) {
      return sendError(res, "Portfolio not found", 404);
    }

    portfolio.isPublished = !portfolio.isPublished;
    await portfolio.save();

    return sendSuccess(
      res,
      portfolio,
      `Portfolio ${portfolio.isPublished ? "published" : "unpublished"} successfully`
    );
  } catch (err) {
    console.error("Toggle publish error:", err);
    return sendError(res, err.message || "Failed to update portfolio", 500);
  }
}

async function getAllPublishedPortfolios(req, res) {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (page - 1) * limit;

    const portfolios = await Portfolio.find({ isPublished: true })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("userId", "name email");

    const total = await Portfolio.countDocuments({ isPublished: true });

    return sendSuccess(res, {
      portfolios,
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error("Get all portfolios error:", err);
    return sendError(
      res,
      err.message || "Failed to fetch portfolios",
      500
    );
  }
}

async function deletePortfolioAdmin(req, res) {
  try {
    const { portfolioId } = req.params;

    const portfolio = await Portfolio.findByIdAndDelete(portfolioId);

    if (!portfolio) {
      return sendError(res, "Portfolio not found", 404);
    }

    return sendSuccess(res, null, "Portfolio deleted successfully");
  } catch (err) {
    console.error("Admin delete portfolio error:", err);
    return sendError(res, err.message || "Failed to delete portfolio", 500);
  }
}

async function toggleLikePortfolio(req, res) {
  try {
    const { portfolioId } = req.params;
    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return sendError(res, "Portfolio not found", 404);
    }
    
    const userId = req.user.userId;
    const index = portfolio.likes.indexOf(userId);
    
    if (index === -1) {
      portfolio.likes.push(userId);
    } else {
      portfolio.likes.splice(index, 1);
    }
    
    await portfolio.save();
    return sendSuccess(
      res,
      { likesCount: portfolio.likes.length, isLiked: index === -1 },
      "Like toggled successfully"
    );
  } catch (err) {
    console.error("Toggle like error:", err);
    return sendError(res, err.message || "Failed to toggle like", 500);
  }
}

async function addComment(req, res) {
  try {
    const { portfolioId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return sendError(res, "Comment text is required", 400);
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return sendError(res, "Portfolio not found", 404);
    }
    
    const newComment = {
      userId: req.user.userId,
      userName: user.name,
      text: text.trim(),
      replies: []
    };
    
    portfolio.comments.push(newComment);
    await portfolio.save();
    
    const addedComment = portfolio.comments[portfolio.comments.length - 1];
    
    return sendSuccess(res, addedComment, "Comment added successfully");
  } catch (err) {
    console.error("Add comment error:", err);
    return sendError(res, err.message || "Failed to add comment", 500);
  }
}

async function addReply(req, res) {
  try {
    const { portfolioId, commentId } = req.params;
    const { text } = req.body;
    if (!text || !text.trim()) {
      return sendError(res, "Reply text is required", 400);
    }
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return sendError(res, "User not found", 404);
    }

    const portfolio = await Portfolio.findById(portfolioId);
    if (!portfolio) {
      return sendError(res, "Portfolio not found", 404);
    }
    
    const comment = portfolio.comments.id(commentId);
    if (!comment) {
      return sendError(res, "Comment not found", 404);
    }
    
    const newReply = {
      userId: req.user.userId,
      userName: user.name,
      text: text.trim()
    };
    
    comment.replies.push(newReply);
    await portfolio.save();
    
    return sendSuccess(res, comment, "Reply added successfully");
  } catch (err) {
    console.error("Add reply error:", err);
    return sendError(res, err.message || "Failed to add reply", 500);
  }
}

module.exports = {
  createPortfolio,
  getPortfolio,
  getMyPortfolio,
  updatePortfolio,
  deletePortfolio,
  togglePublishPortfolio,
  getAllPublishedPortfolios,
  deletePortfolioAdmin,
  toggleLikePortfolio,
  addComment,
  addReply,
};
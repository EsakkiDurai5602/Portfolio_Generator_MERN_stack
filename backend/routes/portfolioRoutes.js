const express = require("express");
const router = express.Router();
const fs = require("fs");

const {
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
} = require("../controllers/portfolioController");

const authMiddleware = require("../middleware/authMiddleware");
const authorizationMiddleware = require("../middleware/authorizationMiddleware");
const upload = require("../middleware/upload");

router.get("/public", getAllPublishedPortfolios);
router.get("/:identifier", getPortfolio);

router.post("/", authMiddleware, createPortfolio);
router.get("/my/portfolio", authMiddleware, getMyPortfolio);
router.put("/", authMiddleware, updatePortfolio);
router.delete("/", authMiddleware, deletePortfolio);
router.patch("/publish", authMiddleware, togglePublishPortfolio);

router.post("/upload", authMiddleware, upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  try {
    const filePath = req.file.path;
    const fileBuffer = fs.readFileSync(filePath);
    const mimeType = req.file.mimetype;
    const base64Data = fileBuffer.toString("base64");
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // Clean up local ephemeral file after conversion to Base64
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting temporary uploaded file:", err);
    });

    return res.json({
      success: true,
      message: "File uploaded successfully",
      url: dataUrl,
    });
  } catch (err) {
    console.error("Upload process error:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to process file upload",
    });
  }
});

router.delete(
  "/:portfolioId/admin",
  authMiddleware,
  authorizationMiddleware(["admin"]),
  deletePortfolioAdmin
);

router.post("/:portfolioId/like", authMiddleware, toggleLikePortfolio);
router.post("/:portfolioId/comment", authMiddleware, addComment);
router.post("/:portfolioId/comment/:commentId/reply", authMiddleware, addReply);

module.exports = router;

import { Router } from "express";
import { getReviews, postReview, deleteReview } from "../controllers/review_controller.js";

const reviewsRouter = Router();

// GET /movies/:id/reviews
reviewsRouter.get("/:id/reviews", getReviews);

// POST /movies/:id/reviews
reviewsRouter.post("/:id/reviews", postReview);

// DELETE /movies/:id/reviews  -> delete current user's review for movie
reviewsRouter.delete("/:id/reviews", deleteReview);

export default reviewsRouter;

import { Router } from "express";
import { getReviews, postReview, deleteReview } from "../controllers/review_controller.js";

const reviewsRouter = Router();
reviewsRouter.get("/:id/reviews", getReviews);
reviewsRouter.post("/:id/reviews", postReview);
reviewsRouter.delete("/:id/reviews", deleteReview);

export default reviewsRouter;

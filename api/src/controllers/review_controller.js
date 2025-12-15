import jwt from "jsonwebtoken";
import { getReviewsByMovie, addReview, findReviewByAccountAndMovie, removeReviewByAccountAndMovie, updateReviewByAccountAndMovie } from "../models/review_model.js";

const JWT_SECRET = process.env.JWT_SECRET || "dev_jwt_secret";

function extractAccount(req) {
  const auth = req.headers.authorization || "";
  const parts = auth.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") return null;
  try {
    const decoded = jwt.verify(parts[1], JWT_SECRET);
    return decoded;
  } catch (e) {
    return null;
  }
}

export async function getReviews(req, res, next) {
  try {
    const movie_id = req.params.id;
    if (!movie_id) return res.status(400).json({ error: "Missing movie id" });
    const rows = await getReviewsByMovie(movie_id);
    res.json(rows.map(r => ({ id: r.review_id, movie_id: r.movie_id, account_id: r.account_id, username: r.username, rating: r.rating, comment: r.comment, created_at: r.created_at, avatar: r.avatar })));
  } catch (err) {
    console.error('Error in getReviews:', err);
    next(err);
  }
}

export async function postReview(req, res, next) {
  try {
    const movie_id = req.params.id;
    if (!movie_id) return res.status(400).json({ error: "Missing movie id" });

    const { rating, comment } = req.body || {};
    const parsedRating = Number(rating);
    if (!parsedRating || parsedRating < 1 || parsedRating > 5) return res.status(400).json({ error: "Invalid rating (1-5)" });

    const acct = extractAccount(req);
    const account_id = acct ? acct.account_id : null;
    const username = acct ? acct.username : (req.body.user || req.body.username || "Anonyymi");

    console.log('postReview called', { movie_id, account_id, username, rating: parsedRating, comment });
    if (account_id) {
      const existing = await findReviewByAccountAndMovie(account_id, movie_id);
      if (existing) {
        const updated = await updateReviewByAccountAndMovie(
          account_id,
          movie_id,
          parsedRating,
          comment || null
        );
        console.log("postReview updated existing", updated);
        return res.json({ message: "Review updated", review: updated });
      }
    }

    const created = await addReview(movie_id, account_id, username, parsedRating, comment || null);
    console.log('postReview inserted', created);
    res.status(201).json({ message: "Review added", review: created });
  } catch (err) {
    console.error('Error in postReview:', err);
    next(err);
  }
}

export async function deleteReview(req, res, next) {
  try {
    const acct = extractAccount(req);
    if (!acct) return res.status(401).json({ error: 'Unauthorized' });
    const account_id = acct.account_id;
    const movie_id = req.params.id;
    if (!movie_id) return res.status(400).json({ error: 'Missing movie id' });

    const removed = await removeReviewByAccountAndMovie(account_id, movie_id);
    console.log('deleteReview', { account_id, movie_id, removed: !!removed });
    if (!removed) return res.status(404).json({ error: 'Review not found' });
    res.json({ message: 'Review deleted' });
  } catch (err) {
    console.error('Error in deleteReview:', err);
    next(err);
  }
}

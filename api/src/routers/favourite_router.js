import { Router } from "express";
import { getFavorites, addFavorite, deleteFavorite, debugAllFavorites, getPublicList } from "../controllers/favourite_controller.js";

const router = Router();

// GET /favorites -> returns list for logged-in account
router.get("/", getFavorites);

// POST /favorites -> { id: movieId, title }
router.post("/", addFavorite);

// DELETE /favorites/:id -> remove movie id from current account's favourites
router.delete("/:id", deleteFavorite);

// Debug route: GET /favorites/debug -> list all favourite rows (dev only)
router.get("/debug", debugAllFavorites);

// Public shared list (no auth)
router.get("/public/:id", getPublicList);

export default router;

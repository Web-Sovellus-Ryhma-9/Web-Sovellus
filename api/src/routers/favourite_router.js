import { Router } from "express";
import { getFavorites, addFavorite, deleteFavorite, debugAllFavorites, getPublicList } from "../controllers/favourite_controller.js";

const router = Router();
router.get("/", getFavorites);
router.post("/", addFavorite);
router.delete("/:id", deleteFavorite);
router.get("/debug", debugAllFavorites);
router.get("/public/:id", getPublicList);

export default router;

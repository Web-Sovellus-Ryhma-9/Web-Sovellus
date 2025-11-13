import { Router } from "express";
import { search, details, now_playing } from "../controllers/tmdb_controller.js";

const tmdbRouter = Router();

tmdbRouter.get("/search", search);
tmdbRouter.get("/movie/:id", details);
tmdbRouter.get("/now_playing", now_playing);

export default tmdbRouter;

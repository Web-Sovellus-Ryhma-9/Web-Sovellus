import { Router } from "express";
import { search, details } from "../controllers/tmdb_controller.js";

const tmdbRouter = Router();

tmdbRouter.get("/search", search);
tmdbRouter.get("/movie/:id", details);

export default tmdbRouter;

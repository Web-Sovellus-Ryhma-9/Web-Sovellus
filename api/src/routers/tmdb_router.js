import { Router } from "express";
import { search, details, now_playing, genres, search_person, person_movies } from "../controllers/tmdb_controller.js";

const tmdbRouter = Router();

tmdbRouter.get("/search", search);
tmdbRouter.get("/movie/:id", details);
tmdbRouter.get("/now_playing", now_playing);
tmdbRouter.get("/genres", genres);
tmdbRouter.get("/search_person", search_person);
tmdbRouter.get("/person_movies", person_movies);

export default tmdbRouter;

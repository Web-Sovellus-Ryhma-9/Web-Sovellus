import { Router } from "express";
import { search, details, tv_details, now_playing, genres, search_person, person_movies, credits, tv_credits } from "../controllers/tmdb_controller.js";

const tmdbRouter = Router();

tmdbRouter.get("/search", search);
tmdbRouter.get("/movie/:id", details);
tmdbRouter.get("/movie/:id/credits", credits);
tmdbRouter.get("/tv/:id", tv_details);
tmdbRouter.get("/tv/:id/credits", tv_credits);
tmdbRouter.get("/now_playing", now_playing);
tmdbRouter.get("/genres", genres);
tmdbRouter.get("/search_person", search_person);
tmdbRouter.get("/person_movies", person_movies);

export default tmdbRouter;

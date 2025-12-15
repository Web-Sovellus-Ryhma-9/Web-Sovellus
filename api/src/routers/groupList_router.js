import { Router } from "express";
import {
  getGroups,
  createNewGroup,
  deleteGroupHandler,
  updateGroupHandler,
  getMembers,
  joinGroupHandler,
  approveMemberHandler,
  deleteMemberHandler,
  getGroupMovies,
  addMovieToGroupHandler,
  removeMovieFromGroupHandler,
} from "../controllers/group_controller.js";

const router = Router();
router.get("/getGroups", getGroups);
router.get("/", getGroups);
router.post("/creategroup", createNewGroup);
router.delete("/delete/:id", deleteGroupHandler);
router.put("/update/:id", updateGroupHandler);
router.get("/members/:id", getMembers);
router.post("/members/join", joinGroupHandler);
router.post("/members/approve", approveMemberHandler);
router.delete("/members/:id", deleteMemberHandler);
router.get('/movies/:id', getGroupMovies);
router.post('/movies/add', addMovieToGroupHandler);
router.post('/movies/remove', removeMovieFromGroupHandler);

export default router;

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

// Get groups (public). Response includes role_status for requesting user when authenticated.
router.get("/getGroups", getGroups);
router.get("/", getGroups);

// Create group (authenticated)
router.post("/creategroup", createNewGroup);

// Delete group (owner)
router.delete("/delete/:id", deleteGroupHandler);

// Update group (rename) - owner only
router.put("/update/:id", updateGroupHandler);

// Members: list, join, approve, delete
router.get("/members/:id", getMembers);
router.post("/members/join", joinGroupHandler);
router.post("/members/approve", approveMemberHandler);
router.delete("/members/:id", deleteMemberHandler);

// Group movies: list, add, remove
router.get('/movies/:id', getGroupMovies);
router.post('/movies/add', addMovieToGroupHandler);
router.post('/movies/remove', removeMovieFromGroupHandler);

export default router;

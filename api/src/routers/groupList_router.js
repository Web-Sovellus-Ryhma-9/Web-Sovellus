import { Router } from "express";
import {
  getGroups,
  createNewGroup,
  deleteGroupHandler,
  getMembers,
  joinGroupHandler,
  approveMemberHandler,
  deleteMemberHandler,
} from "../controllers/group_controller.js";

const router = Router();

// Get groups (public). Response includes role_status for requesting user when authenticated.
router.get("/getGroups", getGroups);
router.get("/", getGroups);

// Create group (authenticated)
router.post("/creategroup", createNewGroup);

// Delete group (owner)
router.delete("/delete/:id", deleteGroupHandler);

// Members: list, join, approve, delete
router.get("/members/:id", getMembers);
router.post("/members/join", joinGroupHandler);
router.post("/members/approve", approveMemberHandler);
router.delete("/members/:id", deleteMemberHandler);

export default router;

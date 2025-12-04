import { Router } from "express";
import { createGroup, getOwnGroups, getGroups, deleteGroup, getGroupMembers, requestJoinGroup, approveMember } from "../controllers/groupList_controller.js";

const groupListRouter = Router();



// POST to "/" — mount your router in main server as app.use("/api/groups", groupListRouter)
groupListRouter.post("/creategroup", createGroup);

// GET own groups at "/" (requires Authorization header)
groupListRouter.get("/getOwnGroups", getOwnGroups);

groupListRouter.get("/getGroups", getGroups);

groupListRouter.delete("/delete/:id", deleteGroup);

groupListRouter.get("/members/:id", getGroupMembers);

// POST to request join (body: { group_id })
groupListRouter.post("/members/join", requestJoinGroup);

// POST to approve member (body: { group_id, account_id }) — protect in production
groupListRouter.post("/members/approve", approveMember);

export default groupListRouter;
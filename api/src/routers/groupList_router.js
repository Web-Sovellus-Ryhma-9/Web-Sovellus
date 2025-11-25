import { Router } from "express";
import { createGroup, getOwnGroups } from "../controllers/groupList_controller.js";

const groupListRouter = Router();



// POST to "/" — mount your router in main server as app.use("/api/groups", groupListRouter)
groupListRouter.post("/creategroup", createGroup);

// GET own groups at "/" (requires Authorization header)
groupListRouter.get("/getOwnGroups", getOwnGroups);

export default groupListRouter;
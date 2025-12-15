import { Router } from "express";
import { register, login, deleteAccount, logout, changeAvatar } from "../controllers/account_controller.js";

const accountRouter = Router();
accountRouter.post("/register", register);
accountRouter.post("/login", login);
accountRouter.delete("/", deleteAccount);
accountRouter.post("/logout", logout);
accountRouter.put("/avatar", changeAvatar);

export default accountRouter;

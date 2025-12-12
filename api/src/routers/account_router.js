import { Router } from "express";
import { register, login, deleteAccount, logout, changeAvatar } from "../controllers/account_controller.js";

const accountRouter = Router();

// Register: expects { username, email, password }
accountRouter.post("/register", register);

// Login: expects { identifier, password } where identifier is username or email
accountRouter.post("/login", login);

// Delete logged-in account: expects Authorization: Bearer <token>
accountRouter.delete("/", deleteAccount);

// Logout (client-side): expects Authorization: Bearer <token>
accountRouter.post("/logout", logout);

// Change avatar: expects Authorization header + { avatar }
accountRouter.put("/avatar", changeAvatar);

export default accountRouter;

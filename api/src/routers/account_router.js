import { Router } from "express";
import { register, login, deleteAccount } from "../controllers/account_controller.js";

const accountRouter = Router();

// Register: expects { username, email, password }
accountRouter.post("/register", register);

// Login: expects { identifier, password } where identifier is username or email
accountRouter.post("/login", login);

// Delete logged-in account: expects Authorization: Bearer <token>
accountRouter.delete("/", deleteAccount);

export default accountRouter;

import express from "express";
import cors from "cors";
import "dotenv/config";

import tmdbRouter from "./routers/tmdb_router.js";
import accountRouter from "./routers/account_router.js";

import groupListRouter from "./routers/groupList_router.js";


import favouriteRouter from "./routers/favourite_router.js";
import reviewsRouter from "./routers/reviews_router.js";



const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  res.send("Postgres API esimerkki");
});

app.use("/tmdb", tmdbRouter);
app.use("/auth", accountRouter);
app.use("/groups", groupListRouter);
app.use("/favorites", favouriteRouter);
app.use("/movies", reviewsRouter);

// Central error handler to ensure JSON responses instead of HTML
// This catches errors passed with next(err) from controllers.
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) {
    return next(err);
  }
  const status = err.status || 500;
  const message = err.message || "Internal server error";
  res.status(status).json({ error: message });
});

app.listen(port, () => {
  console.log(`Server is listening port ${port}`);
});

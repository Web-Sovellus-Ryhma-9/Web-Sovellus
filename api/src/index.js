import express from "express";
import cors from "cors";
import "dotenv/config";

import tmdbRouter from "./routers/tmdb_router.js";
import accountRouter from "./routers/account_router.js";
import favouriteRouter from "./routers/favourite_router.js";


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
app.use("/favorites", favouriteRouter);
// Note: `/book` routes are not mounted because `book` table was removed from the DB schema

app.listen(port, () => {
  console.log(`Server is listening port ${port}`);
});

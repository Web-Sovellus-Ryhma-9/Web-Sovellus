import express from "express";
import cors from "cors";
import "dotenv/config";

import bookRouter from "./routers/book_router.js";
import tmdbRouter from "./routers/tmdb_router.js";


const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.get("/", async (req, res) => {
  res.send("Postgres API esimerkki");
});

app.use("/book", bookRouter);
app.use("/tmdb", tmdbRouter);

app.listen(port, () => {
  console.log(`Server is listening port ${port}`);
});

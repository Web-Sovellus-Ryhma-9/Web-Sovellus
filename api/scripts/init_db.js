import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import pool from "../src/database.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  try {
    const sqlPath = path.join(__dirname, "../../book.sql");
    const sql = await fs.readFile(sqlPath, "utf8");

    console.log("Running schema init from", sqlPath);
    await pool.query(sql);
    console.log("Database schema initialized successfully.");
  } catch (err) {
    console.error("Failed to initialize database schema:", err);
    process.exitCode = 1;
  } finally {
    await pool.end().catch(() => {});
  }
}

run();

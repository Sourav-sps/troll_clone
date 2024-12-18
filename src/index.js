import "dotenv/config";
import * as dotenv from "dotenv";
import { connectDB } from "./db/index.js";
import { app } from "./app.js";

dotenv.config({
  path: "./env",
});

(async () => {
  connectDB()
    .then(() => {
      app.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at : ${process.env.PORT}`);
      });
    })
    .catch((error) => {
      console.log("DB connection failed !!", error);
    });
})();

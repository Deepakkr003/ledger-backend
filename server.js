import "dotenv/config";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";
import cors from "cors";

connectDB();
  
app.use(cors());

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
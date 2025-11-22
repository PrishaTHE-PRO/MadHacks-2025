const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const app = express();

app.use(cors({
    origin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());

// simple health route
app.get("/health", (req, res) => {
    res.json({ status: "ok" });
});

// TODO: app.use("/profiles", require("./routes/profiles.routes"));
// TODO: app.use("/events", require("./routes/events.routes"));
// etc.

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`API listening on port ${PORT}`);
});

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import { readdirSync } from "fs"; // fs comes with node.js by default. used to access the routes folder and load all files within

const morgan = require("morgan");
require("dotenv").config();

const app = express();
const http = require("http").createServer(app);
const io = require("socket.io")(http, {
  path: "/socket.io",
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    allowedHeaders: ["Content-type"],
  },
});
// db
mongoose
  .connect(process.env.DATABASE, {})
  .then(() => console.log("db connected"))
  .catch((err) => console.log("DB CONN ERR =>", err));

// middlewares
app.use(express.json({ limit: "5mb" })); // we don't need it, but if you're processing large photos/videos, you might wanna set a limit
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: [process.env.CLIENT_URL] }));

// auto load routes
readdirSync("./routes").map((r) => app.use("/api", require(`./routes/${r}`)));

// socket.io
// io.on("connect", (socket) => {
//   // console.log("socket.io => ", socket.id);
//   socket.on("send-message", (message) => {
//     // console.log("new message receieved => ", message);
//     socket.broadcast.emit("receive-message", message);
//   });
// });

io.on("connect", (socket) => {
  // console.log("socket.io => ", socket.id);
  socket.on("new-post", (newPost) => {
    // console.log("socketio new post => ", newPost);
    socket.broadcast.emit("new-post", newPost);
  });
});

const port = process.env.PORT || 8000;

http.listen(port, () => console.log(`Server running on port ${port}`));

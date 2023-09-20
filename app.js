const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const authRouter = require("./routes/auth");
const communityRouter = require("./routes/community");
const memberRouter = require("./routes/member");
const roleRouter = require("./routes/role");
const createError = require("http-errors");
require("dotenv").config();

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use("/v1/auth", authRouter);
app.use("/v1/community", communityRouter);
app.use("/v1/member", memberRouter);
app.use("/v1/role", roleRouter);

app.get("/", async (req, res) => {
  res.send("Hello Welcome to home page");
});

app.use(async (req, res, next) => {
  next(createError.NotFound("This route does not exist"));
});

app.use((err, req, res, next) => {
  res.status(err.status || 500);
  res.send({
    error: {
      status: err.status || 500,
      message: err.message,
    },
  });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("Serving your app");
});

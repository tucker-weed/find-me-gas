import createError from "http-errors";
import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import logger from "morgan";

import indexRouter from "./routes/index.js";
import spotifyRouter from "./routes/spotify-api.js";
import cors from "cors";

const app = express();
const SPOTIFY_BASE_URL = "/spotify";
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());

app.use(cors());
app.use(logger("dev"));
app.use(
  express.json({
    type: ["application/json", "text/plain"],
  })
);
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(path.resolve(path.dirname("")), "public")));

// custom routes
app.use(indexRouter);
app.use(SPOTIFY_BASE_URL, spotifyRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // send error status update to client
  res.status(err.status || 500);
});

export default app;

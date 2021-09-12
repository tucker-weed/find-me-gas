import express from "express";
const router = express.Router();

/* GET operational status of server */
router.get("/", function (req, res, next) {
  res.send("pong");
});

export default router;

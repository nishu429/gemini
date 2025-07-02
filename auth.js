let db = require("../models");
const jwt = require("jsonwebtoken");

module.exports = {
  authenticateJWT: async (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader) {
      const token = authHeader.split(" ")[1];

      jwt.verify(token, process.env.secret_key, async (err, user) => {
        if (err) {
          return res.status(403).json({
            success: false,
            status: 403,
            message: "Token Invalid",
          });
        }

        if (!user.login_time) {
          return res
            .status(400)
            .json({ msg: "Invalid token: login_time missing" });
        }

        try {
          const userInfo = await db.users.findOne({
            where: { id: user.id, login_time: user.login_time },
          });

          if (userInfo) {
            req.user = user;
            next();
          } else {
            return res.status(403).json({
              success: false,
              status: 403,
              message: "Token Invalid",
            });
          }
        } catch (dbError) {
          // Handle database errors
          return res
            .status(500)
            .json({ msg: "Database error", error: dbError.message });
        }
      });
    } else {
      res.sendStatus(401);
    }
  },
};

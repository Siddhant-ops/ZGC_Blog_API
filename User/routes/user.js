const router = require("express").Router();
// const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
// Getting Schema
const UserSchema = require("../schema/User");
const BlogSchema = require("../schema/Blog");
const CommentSchema = require("../schema/Comments");

// Getting Secret Key
const SECRET = process.env.SECRET;

const { body, check, validationResult } = require("express-validator");

function verifyToken(req, res, next) {
  console.log("verifyin");
  if (req.headers["authorization"]) {
    // Get auth header value
    const bearerHeader = req.headers["authorization"];

    // Check if auth header is undefined
    if (typeof bearerHeader !== undefined) {
      // split at the space
      const bearer = bearerHeader.split(" ");

      // Get token from array
      const bearerToken = bearer[1];

      // Set token onto the req
      req.token = bearerToken;

      // call next
      next();
    } else {
      return res.sendStatus(403);
    }
  } else {
    return res.json({
      message: "there is no jwt token in the header",
    });
  }
}

router.get("/:username", (req, res) => {
  try {
    UserSchema.findOne(
      {
        username: req.params.username,
      },
      {
        username: 1,
        email: 1,
        blogs: 1,
      },
      (err, doc) => {
        if (err) throw err;
        if (doc != undefined) {
          res.json(doc);
        }
        if (doc == null) {
          res.json({ message: "User Not Found" });
        }
      }
    );
  } catch (e) {
    console.error(e);
    res.sendStatus(500);
  }
});

router.patch(
  "/change-email",
  [
    verifyToken,
    check("new_email", "Invalid E-Mail Address").isString().isEmail(),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      }
      jwt.verify(req.token, SECRET, (err, auth_data) => {
        UserSchema.updateOne(
          { email: auth_data.email },
          { $set: { email: req.body.new_email } },
          (err, doc) => {
            console.log(doc);
            res.json(doc);
          }
        );
      });
    } catch (err) {
      console.error(err);
    }
  }
);

router.delete(
  "/:username/delete",
  [
    body("email", "Invalid Email").isEmail().normalizeEmail(),

    body("password")
      .isLength({
        min: 8,
      })
      .withMessage("Incorrect Password")
      .matches(/[a-zA-Z]/)
      .withMessage("Incorrect Password")
      .matches(/[A-Z]/)
      .withMessage("Incorrect Password")
      .matches(/\d/)
      .withMessage("Incorrect Password")
      .matches(/[!@#$%^&*()\\]/)
      .withMessage("Incorrect Password"),
  ],
  (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
      });
    } else {
      const email = req.body.email;
      UserSchema.findOne(
        {
          email: email,
        },
        (UserSchemaErr, UserDoc) => {
          const username = UserDoc.username;

          if (UserSchemaErr) throw UserSchemaErr;

          if (UserDoc === null)
            return res.json({
              message: "User Not Found",
            });
          bcrypt.compare(
            req.body.password,
            UserDoc.password,
            (bcryptErr, isMatch) => {
              if (bcryptErr) throw bcryptErr;

              if (isMatch === true) {
                let deletedItems = [];

                // Delete Blogs
                BlogSchema.deleteMany({ author: username }, (err, BlogDoc) => {
                  if (err) throw err;
                  deletedItems.push({ BlogDoc });

                  // Delete Comments
                  CommentSchema.deleteMany(
                    { username: username },
                    (err, CommentDoc) => {
                      if (err) throw err;
                      deletedItems.push({ CommentDoc });
                    }
                  );

                  // Delete Account
                  UserSchema.deleteOne({ email: email }, (err, UserDoc) => {
                    if (err) throw err;
                    deletedItems.push({ UserDoc });

                    res.json(deletedItems);
                  });
                });
              } else {
                res.json({
                  message: "Incorrect Credentials",
                });
              }
            }
          );
        }
      );
    }
  }
);

module.exports = router;

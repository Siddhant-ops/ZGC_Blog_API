const router = require("express").Router();
// const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const { body, check, validationResult } = require("express-validator");

// Getting Schema
const BlogSchema = require("../schema/Blog");
const UserSchema = require("../schema/User");

// Getting Secret Key
const SECRET = process.env.SECRET;

function verifyToken(req, res, next) {
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

router.get("/:page", (req, res) => {
  let perPage = 4;
  let page = req.params.page || 0;
  try {
    BlogSchema.find(
      {},
      null,
      { limit: perPage, skip: perPage * req.params.page },
      (err, doc) => {
        if (err) throw err;
        res.json(doc);
      }
    );

    // Blog With Comments
    // BlogSchema.aggregate([{
    //     $lookup: {
    //         from: "blogs",
    //         localField: "username",
    //         foreignField: "author",
    //         as: "sadness    "
    //     }
    // }], (err, doc) => {
    //     if (err) throw err;
    //     console.log(doc)
    // })
  } catch (err) {
    console.error(err);
  }
});

router.post(
  "/",
  [
    verifyToken,
    body("title")
      .notEmpty()
      .withMessage("Title is Empty")
      .isString()
      .withMessage("Not A String Value")
      .custom((value) => {
        return BlogSchema.findOne({
          title: value,
        }).then((blog) => {
          if (blog && blog.length != 1) {
            return Promise.reject("Blog With This Title Already Exists");
          } else {
            return Promise.resolve();
          }
        });
      }),

    body("content")
      .notEmpty()
      .withMessage("Title is Empty")
      .isString()
      .withMessage("Not A String Value"),

    body("author", "Invalid Author")
      .notEmpty()
      .custom((value) => {
        return UserSchema.find({
          username: value,
        }).then((user) => {
          if (user && user.length != 1) {
            return Promise.reject("Username already in use");
          } else {
            return Promise.resolve();
          }
        });
      }),
  ],
  (req, res) => {
    try {
      const errors = validationResult(req);
      jwt.verify(req.token, SECRET, (err, auth_data) => {
        if (auth_data.username == req.body.author) {
          if (!errors.isEmpty()) {
            return res.status(400).json({
              errors: errors.array(),
            });
          }

          const blogPost = new BlogSchema(req.body);
          blogPost.save((err, doc) => {
            if (err) throw err;
            UserSchema.updateOne(
              {
                username: req.body.author,
              },
              {
                $push: {
                  blogs: doc._id,
                },
              },
              (err, doc) => {
                if (err) throw err;
                console.log(doc);
              }
            );
            res.json(doc);
          });
        } else {
          res.json({
            errors: {
              message: "Author And JWT Token Doesn't Match",
            },
          });
        }
      });
    } catch (e) {
      console.error(e);
      res.sendStatus(500);
    }
  }
);

router.get("/:title", (req, res) => {
  try {
    BlogSchema.findOne(
      {
        title: req.params.title,
      },
      {
        _id: 0,
        updated_at: 0,
      },
      (err, doc) => {
        if (err) throw err;
        res.json(doc);
      }
    );
  } catch (e) {
    console.error(e);
  }
});

router.delete(
  "/delete",
  [
    verifyToken,
    body("blog_id")
      .notEmpty()
      .withMessage("Title Is Empty")
      .custom((value) => {
        return BlogSchema.findOne({
          _id: value,
        }).then((blog) => {
          if (blog && blog.length != 1) {
            return Promise.resolve();
          } else {
            return Promise.reject("Blog With This Id Does Not Exists");
          }
        });
      }),
  ],
  (req, res) => {
    const errors = validationResult(req);

    try {
      if (!errors.isEmpty()) {
        return res.status(400).json({
          errors: errors.array(),
        });
      } else {
        jwt.verify(req.token, SECRET, (err, auth_data) => {
          if (err) throw err;
          if (auth_data.username == req.body.author) {
            BlogSchema.deleteOne(
              {
                _id: req.body.blog_id,
                author: auth_data.username,
              },
              (err, doc) => {
                if (err) throw err;
                console.log(doc);
                if (doc.deletedCount === 0) {
                  res.json({
                    message: "Did Not Delete",
                    desc: "Author name and token username doesn't match",
                  });
                } else {
                  res.json({
                    message: "Deleted Succesfully",
                  });
                }
              }
            );
          } else {
            res.json({
              message: "Did Not Delete",
              desc: "Author name and token username doesn't match",
            });
          }
        });
      }
    } catch (e) {
      return console.error(e);
    }
  }
);

router.get("/user/:username", (req, res) => {
  try {
    BlogSchema.find({ author: req.params.username }, (err, doc) => {
      if (err) return err;
      if (doc.length > 0 && (doc !== undefined || doc !== null)) {
        res.json(doc);
      } else {
        if (doc.length === 0) {
          res.json({ message: `No Blogs By ${req.params.username}` });
        } else {
          res.sendStatus(500);
        }
      }
    });
  } catch (err) {
    console.error(err);
  }
});

module.exports = router;

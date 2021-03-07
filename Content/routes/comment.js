const router = require("express").Router();
// const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const {
    body,
    check,
    validationResult
} = require('express-validator');


// Getting Schema
const CommentSchema = require('../schema/Comments');
const UserSchema = require('../schema/User');
const BlogSchema = require('../schema/Blog');

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
            message: "there is no jwt token in the header"
        });
    }
}

router.post('/create', [verifyToken,
    body('content')
    .notEmpty().withMessage('Title is Empty')
    .isString().withMessage('Not A String Value'),

    body('blog_id')
    .notEmpty().withMessage('Title is Empty')
    .isString().withMessage('Not A String Value'),

    body('username', 'Invalid Author').notEmpty()
    .custom(value => {
        return UserSchema.find({
            "username": value
        }).then(user => {
            if (user && user.length != 1) {
                return Promise.reject("Username Does Not Exist");
            } else {
                return Promise.resolve();
            }
        });
    }),

], (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                errors: errors.array()
            });
        }
        jwt.verify(
            req.token,
            SECRET,
            (err, auth_data) => {
                if (err) throw err;
                const comment = new CommentSchema(req.body);

                comment.save((err, commentDoc) => {
                    if (err) throw err;
                    BlogSchema.updateOne({
                        _id: req.body.blog_id
                    }, {
                        $push: {
                            comments: commentDoc._id
                        }
                    }, (err, doc) => {
                        if (err) throw err;
                        res.json(commentDoc);
                    })

                })
            });
    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
})

router.delete('/remove', [verifyToken, body('comment_id', 'Invalid Value').notEmpty().isString(), body('blog_id', 'Invalid Value').notEmpty().isString()], (req, res) => {
    jwt.verify(
        req.token,
        SECRET,
        (err, auth_data) => {
            CommentSchema.findOneAndDelete({
                _id: req.body.comment_id,
                username: auth_data.username
            }, (err, commentDoc) => {
                if (err) throw err;
                BlogSchema.updateOne({
                    _id: req.body.blog_id
                }, {
                    $pull: {
                        comments: {
                            $in: [req.body.comment_id]
                        }
                    }
                }, {
                    multi: true
                }, (err, doc) => {
                    if (err) throw err;
                    res.json({
                        comment_collection: commentDoc,
                        blog_collection: doc
                    });
                })
            })


        })
})

router.get('/b/:blog_id',
    [
        check('blog_id', 'Invalid Blog Id')
        .notEmpty().isString()
        .custom((value, {
            req
        }) => {
            return BlogSchema.findOne({
                _id: req.params.blog_id
            }).then((doc) => {
                if (doc && doc !== undefined) {
                    return Promise.resolve();
                } else {
                    return Promise.reject("No Blog Found")
                }
            })

        })
        // .custom(value => {
        //     return BlogSchema.find({_id: value}).then((err, doc)=>{
        //         console.log(doc)
        //         if (err) throw err;
        //         if(doc) return Promise.resolve();
        //         else return Promise.reject("Coudn't Find Blog");
        //     })
        // })
    ], (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({
                    errors: errors.array()
                });
            } else {
                CommentSchema.find({
                    blog_id: req.params.blog_id
                }, (err, doc) => {
                    if (err) throw err;
                    // console.log(doc)
                    res.json(doc);
                })
            }

        } catch (err) {
            console.error(err)
        }

    })

module.exports = router;
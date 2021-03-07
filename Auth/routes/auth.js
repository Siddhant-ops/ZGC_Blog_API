const router = require("express").Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Getting Schema
const UserSchema = require('../schema/User');

// Getting Secret Key
const SECRET = process.env.SECRET;

const {
    body,
    check,
    validationResult
} = require('express-validator');

function verifyToken(req, res, next) {
    console.log("verifyin")
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

router.post('/register', [
    body("email", "Invalid Email")
    .isEmail()
    .normalizeEmail()
    .custom(value => {
        return UserSchema.find({
            "email": value
        }).then(user => {
            if (user && user.length == 1) {
                return Promise.reject('E-mail already in use');
            }
        });
    }),

    check('username').not().isEmpty().isString()
    .custom(value => {
        return UserSchema.find({
            "username": value
        }).then(user => {
            if (user && user.length == 1) {
                return Promise.reject('Username already in use');
            }
        });
    }),

    body("password")
    .isLength({
        min: 8
    }).withMessage('must be at least 8 chars long')
    .matches(/[a-zA-Z]/).withMessage('must contain alphabets')
    .matches(/[A-Z]/).withMessage('must contain one Uppercase Alphabets')
    .matches(/\d/).withMessage('must contain a number')
    .matches(/[!@#$%^&*()\\]/).withMessage('must contain a special character')

], (req, res) => {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    } else {
        let newUser = new UserSchema(req.body);

        bcrypt.genSalt(10, async (saltErr, salt) => {
            if (saltErr) throw saltErr;

            bcrypt.hash(newUser.password, salt, async (HashErr, hash) => {
                if (HashErr) throw HashErr;

                newUser.password = hash;

                newUser.save((docErr, doc) => {
                    if (docErr) throw docErr;

                    const PAYLOAD = {
                        email: newUser.email,
                        username: doc.username

                    };

                    jwt.sign(PAYLOAD, SECRET, {
                        expiresIn: "7 days"
                    }, (jwtErr, token) => {
                        if (jwtErr) throw jwtErr;
                        else res.json({
                            token
                        });
                    })

                })
            })
        })
    }
})

router.post('/login', [

    body("email", "Invalid Email")
    .isEmail()
    .normalizeEmail(),

    body("password")
    .isLength({
        min: 8
    }).withMessage('Incorrect Password')
    .matches(/[a-zA-Z]/).withMessage('Incorrect Password')
    .matches(/[A-Z]/).withMessage('Incorrect Password')
    .matches(/\d/).withMessage('Incorrect Password')
    .matches(/[!@#$%^&*()\\]/).withMessage('Incorrect Password')

], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    } else {
        const email = req.body.email;
        UserSchema.findOne({
            "email": email
        }, (UserSchemaErr, doc) => {
            if (UserSchemaErr) throw UserSchemaErr;

            if (doc === null) return res.json({
                message: "User Not Found"
            })
            bcrypt.compare(req.body.password, doc.password, (bcryptErr, isMatch) => {
                if (bcryptErr) throw bcryptErr;

                if (isMatch === true) {
                    const PAYLOAD = {
                        email: doc.email,
                        username: doc.username

                    };
                    jwt.sign(
                        PAYLOAD,
                        SECRET, {
                            expiresIn: "7 days"
                        },
                        (err, token) => {
                            if (err) throw err;
                            else return res.json({
                                token
                            });
                        }
                    );
                } else {
                    res.json({
                        message: "Incorrect Credentials"
                    });
                }
            })

        })
    }

})

// router.use('/reset-password', verifyToken);

router.post('/reset-password', [

    body("email", "Invalid Email")
    .isEmail()
    .normalizeEmail(),

    body("old_password", "Incorrect Password")
    .isLength({
        min: 8
    }).withMessage('Incorrect Password')
    .matches(/[a-zA-Z]/)
    .matches(/[A-Z]/)
    .matches(/\d/)
    .matches(/[!@#$%^&*()\\]/),

    body("new_password", "Incorrect Password")
    .isLength({
        min: 8
    }).withMessage('Incorrect Password')
    .matches(/[a-zA-Z]/)
    .matches(/[A-Z]/)
    .matches(/\d/)
    .matches(/[!@#$%^&*()\\]/)

], (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            errors: errors.array()
        });
    } else {

        jwt.verify(
            req.token,
            SECRET,
            (JWTErr, auth_data) => {
                if (JWTErr) {
                    res.status(403).json(JWTErr)
                } else {

                    const email = auth_data.email;
                    const NEW_PASSWORD = req.body.new_password;

                    UserSchema.findOne({
                        "email": email
                    }, (UserSchemaErr, doc) => {
                        if (UserSchemaErr) throw UserSchemaErr;

                        if (doc === null) return res.json({
                            message: "User Not Found"
                        })
                        bcrypt.compare(req.body.old_password, doc.password, (bcryptErr, isMatch) => {
                            if (bcryptErr) throw bcryptErr;

                            if (isMatch === true) {

                                bcrypt.genSalt(10, async (saltErr, salt) => {
                                    if (saltErr) throw saltErr;

                                    bcrypt.hash(NEW_PASSWORD, salt, async (HashErr, hash) => {
                                        if (HashErr) throw HashErr;

                                        doc.password = hash;

                                        doc.save((docErr, doc) => {
                                            if (docErr) throw docErr;

                                            const PAYLOAD = {
                                                email: doc.email,
                                                username: doc.username
                                            };

                                            jwt.sign(PAYLOAD, SECRET, {
                                                expiresIn: "7 days"
                                            }, (jwtErr, token) => {
                                                if (jwtErr) throw jwtErr;
                                                else res.json({
                                                    token
                                                });
                                            })

                                        })
                                    })
                                })
                            } else {
                                res.json({
                                    message: "Incorrect Credentials"
                                });
                            }
                        })
                    })
                }
            })


    }

})

module.exports = router;
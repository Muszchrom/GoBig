import express, { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import { serverErrorHandler } from './commonResponse';

import { usersTable } from './db';

const router = express.Router();

/* -------------------------------------------------------
####################### Middleware #######################
------------------------------------------------------- */

const validationChain = [
    body('username')
      .exists().withMessage('Username was not found')
      .isLength({min: 4, max: 12}).withMessage('Username length should be in range (4, 12)'),
    body('password')
      .exists().withMessage('Password was not found')
      .isLength({min: 8, max: 72}).withMessage('Password length should be in range (8, 72)')
      .custom((value) => {
            const blobSize = Buffer.byteLength(value, "utf-8");
            return blobSize >= 8 && blobSize <= 72;
      }).withMessage('Password length should be in byte range (8, 72)')
      .custom((value, {req}) => {
        return /[a-z]/.test(value) && /[A-Z]/.test(value);
      }).withMessage('Password should contain small and capital letters')
  ]

const validationChainConfirmPassword = [
    body('confirmPassword')
      .exists().withMessage('Confirmed password was not found')
      .custom((value, {req}) => {
        return req.body.password === value;
      }).withMessage('Password and confirm password doesnt match')
] 

// call next if validation succeeds else 401 or 400
const validateCredentials = (responseType: "sign_in" | "sign_up") => {
    return (req: Request, res: Response, next: NextFunction) => {
        const errors = validationResult(req);
        if (errors.isEmpty()) return next();
    
        if (responseType === "sign_in") {
            return res.status(401).json({message: "Validation error occured, check errors for more info", errors: ["Invalid username and/or password"]});
        } else if (responseType === "sign_up") {
            const errorMessages = errors.array().map(error => error.msg);
            return res.status(400).json({message: "Validation error occured, check errors for more info", errors: errorMessages});
        }
    }
}

// call next() if user doesnt exist, else 403
const userExists = (req: Request, res: Response, next: NextFunction) => {
    usersTable.getUserByUsername(req.body.username)
        .then((row) => {
            if (row) return res.status(403).json({message: "Validation error occured, check errors for more info", errors: ["User already exists"]});;
            return next();
        })
        .catch((err) => {
            serverErrorHandler(err, res, "middleware userExists(...), usersTable.getUserByUsername(...), catch block")
        });
}

// call next() if valid token, else 401 invalida token or no token
const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    // const token = req.headers['authorization']?.split(' ')[1] || req.cookies.token;
    const token: string = req.signedCookies.token;
    if (token) {
        jwt.verify(token, process.env.JWT_KEY!, (err, data) => {
            if (err || !data || typeof data !== 'object') {
                return res.status(401).json({message: "Access token is invalid", errors: ["Access token is invalid"]});
            } else {
                res.locals.userId = data.userId;
                return next();
            }
        })
    } else {
        return res.status(401).json({message: "Access token was not found", errors: ["Access token was not found, sign in"]});
    }
}

/* -------------------------------------------------------
######################### Routes #########################
------------------------------------------------------- */

router.get('/protected', verifyToken, (req: Request, res: Response) => {
    res.status(200).json({message: "You're logged in"})
})

// sign up
router.post('/signup', validationChain, validationChainConfirmPassword, validateCredentials("sign_up"), userExists, (req: Request, res: Response) => {
    const password: string = req.body.password;
    const username: string = req.body.username;
    const saltRounds: number = 10;

    bcrypt
        .hash(password, saltRounds)
        .then((hash) => {
            return usersTable.createUser(username, hash);
        })
        .then(() => {
            res.status(201).json({message: "User successfully created"});
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.post('/', ... ), bcrypt, catch block")
        })
});

// sign in
router.post('/signin', validationChain, validateCredentials("sign_in"), (req: Request, res: Response) => {
    const password: string = req.body.password;
    const username: string = req.body.username;

    // check if user exists
    usersTable.getUserByUsername(username)
        // compare provided password with password in db
        .then((u) => {
            if (!u) return false;
            res.locals.userId = u.id;
            return bcrypt.compare(password, u.password);
        })
        // create token with userId and cookie for storage
        // or send a message correlated to invalid credentials
        .then((result) => {
            if (result && res.locals.userId) {
                const token = jwt.sign({userId: res.locals.userId}, 
                                        process.env.JWT_KEY!, 
                                        {expiresIn: process.env.JWT_EXPIRES_IN});
                res.cookie('token', token, {
                    httpOnly: true,
                    maxAge: parseInt(process.env.COOKIE_MAX_AGE!),
                    secure: true,
                    signed: true,
                    sameSite: true
                })
                res.status(201).json({message: "Singed in successfully"});
            } else {
                res.status(401).json({message: "Invalid username and/or password"});
            }
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.post('/signin', ... ), usersTable.getUserByUsername(...), catch block")
        });

})

router.get('/signout', (req: Request, res: Response) => {
    res.clearCookie('token');
    res.status(200).json({message: "Signed out successfully"});
})

// delete user
router.delete('/temp', verifyToken, validationChain, validateCredentials("sign_in"), (req: Request, res: Response) => {
    usersTable.getUserByUsername(req.body.username)
        .then((u) => {
            if (!u) throw new Error("User_not_found")
            else res.locals.user = u;

            if (res.locals.userId === u.id && req.body.username === u.username) {
                return bcrypt.compare(req.body.password, u.password); 
            } else {
                throw new Error("Credentials_dont_match");
            }
        })
        .then((result) => {
            if (result) {
                return usersTable.deleteUser(res.locals.userId.toString(), req.body.username, res.locals.user.password);
            } else {
                throw new Error("Credentials_dont_match");
            }
        })
        .then(() => {
            res.status(200).json({message: "User successfully deleted"});
        })
        .catch((err) => {
            if (err.message === "User_not_found" || err.message === "Credentials_dont_match") {
                console.log("Suspicious behavior at delete auth route")
                res.status(400).json({message: "Invalid credentials", errors: ["Invalid credentials"]})
            } else {
                serverErrorHandler(err, res, "router.delete('/', ... ), usersTable.getUserByUsername(...), catch block")
            }
        })
})

export {router as authRouter, verifyToken}
const express = require('express');
const multer = require('multer');
const {verifyToken} = require('./auth');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs')

// setup sqlite
const db = new sqlite3.Database('./database/files.db', sqlite3.OPEN_READWRITE, (err, result) => {
    if (err) {
        console.warn(err);
        return;
    }
});

const tableName = 'files'
db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`, (err, table) => {
    if (err) {
        console.warn(err);
        return;
    }
    if (!table) {
        db.run(`CREATE TABLE ${tableName}(id INTEGER PRIMARY KEY, userId, filename)`);
    }
});


// setup multer storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'files/user_files/')
    },
    filename: function (req, file, cb) {
        // const extension = file.mimetype.split("/")[]
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 500000
    },
    fileFilter: function (req, file, cb) {
        const ext = path.extname(file.originalname)
        const mtype = file.mimetype.split('/')[0]
        if (mtype !== "image" || ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
            return cb(new Error('Please provide png/jpg/jpeg file'))
        }
        cb(null, true)
    }
}).single('image') // 'image' is field name 

const router = express.Router();

/* -------------------------------------------------------
########################## SQL ###########################
------------------------------------------------------- */

const insertIntoFiles = ({userId, filename}) => {
    const sql = "INSERT INTO files(userId, filename) VALUES (?, ?)";
    return new Promise((resolve, reject) => {
        db.run(sql, [userId, filename], (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}

const getFileName = (userId) => {
    const sql = "SELECT filename FROM files WHERE userId=?";
    return new Promise((resolve, reject) => {
        db.get(sql, userId, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

const deleteFromFiles = (userId) => {
    const sql = "DELETE FROM files WHERE userId=?";
    return new Promise((resolve, reject) => {
        db.run(sql, userId, (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}

/* -------------------------------------------------------
####################### Middleware #######################
------------------------------------------------------- */

const serverErrorHandler = (err, res) => {
    console.warn(err);
    return res.status(500).json({message: "An internal server error occured", errors: ["An internal server error occured"]})
}

const handleImageRePosting = (req, res, next) => {
    getFileName(res.locals.userId)
        .then((row) => {
            if (row) {
                const file = `${__dirname}/files/user_files/${row.filename}`
                return fs.unlink(file, (err) => {
                    if (err) throw err
                })
            } else {
                next()
            }
        })
        .then(() => {
            return deleteFromFiles(res.locals.userId)
        })
        .then((result) => {
            if (result) {
                next()
            } else {
                return serverErrorHandler(err, res)
            }
        })
        .catch((err) => {
            return serverErrorHandler(err, res)
        })
}

const saveFileOnDisk = (req, res, next) => {
    upload(req, res, (err) => {
        if (err && err.message === 'Please provide png/jpg/jpeg file') {
            return res.status(404).json({errors: [err.message]})
        } else if (err) {
            return res.status(500).json({errors: ["An internal server error occured"]})
        } else {
            next()
        }
    })
}

const saveFileInDb = (req, res, next) => {
    const file = req.file.filename
    const userId = res.locals.userId
    insertIntoFiles({userId: userId, filename: file})
        .then((result) => {
            if (result) {
                return next()
            } else {
                return serverErrorHandler(err, res)
            }
        })
        .catch((err) => {
            return serverErrorHandler(err, res)
        })
}

/* -------------------------------------------------------
######################### Routes #########################
------------------------------------------------------- */

router.get('/', verifyToken, (req, res) => {
    getFileName(res.locals.userId)
        .then((row) => {
            if (row) {
                return res.sendFile(row.filename, {root: `${__dirname}/files/user_files`, dotfiles: "allow"})
            }
            else {
                return res.status(404).json({message: "Could not find the file"})
            }
        })
        .catch((err) => {
            return serverErrorHandler(err, res)
        })
})

router.post('/', verifyToken, handleImageRePosting, saveFileOnDisk, saveFileInDb, (req, res) => {
    res.status(201).json({message: "Image uploaded successfully"})
})


module.exports = {more: router};
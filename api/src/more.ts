import express, { Request, Response } from 'express';
import multer from 'multer'
import { verifyToken } from './auth';
import path from 'path'
import sqlite from 'sqlite3';
import * as fs from 'node:fs/promises'
import { getRandomValues } from 'node:crypto';

const sqlite3 = sqlite.verbose()

const filesDest = `${__dirname}/../files/user_files`

// setup sqlite
const db = new sqlite3.Database('./database/files.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.warn(err);
        return;
    }
});

interface FilesTable {
    id: number,
    userId: number,
    filename: string
}

const tableName = 'files'
db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`, (err, table) => {
    if (err) {
        console.warn(err);
        return;
    }
    if (!table) {
        db.run(`CREATE TABLE ${tableName}(
            id INTEGER PRIMARY KEY, 
            userId INTEGER NOT NULL, 
            filename TEXT NOT NULL
        )`);
    }
});


// setup multer storage
const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'files/user_files/')
    },
    filename: function (req, file, cb) {
        // this might cause an error
        cb(null, Date.now() + "-" + getRandomValues(new Uint16Array(1))[0] + path.extname(file.originalname))
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

interface InsertIntoFiles {
    ({userId, filename}: {userId: FilesTable["userId"], filename: FilesTable["filename"]}): Promise<true>
}
const insertIntoFiles: InsertIntoFiles = ({userId, filename}) => {
    const sql = "INSERT INTO files(userId, filename) VALUES (?, ?)";
    return new Promise((resolve, reject) => {
        db.run(sql, [userId, filename], (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}

interface GetFileName {
    (userId: FilesTable["userId"]): Promise<{filename: FilesTable["filename"]} | undefined>
}
const getFileName: GetFileName = (userId) => {
    const sql = "SELECT filename FROM files WHERE userId=?";
    return new Promise((resolve, reject) => {
        db.get(sql, userId, (err, row: {filename: FilesTable["filename"]} | undefined) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}
interface DeleteFromFiles {
    (userId: number): Promise<true>
}
const deleteFromFiles: DeleteFromFiles = (userId) => {
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

const serverErrorHandler = (err: Error, res: Response) => {
    console.warn(err);
    return res.status(500).json({message: "An internal server error occured", errors: ["An internal server error occured"]})
}

/* -------------------------------------------------------
######################### Routes #########################
------------------------------------------------------- */

router.get('/', verifyToken, (req, res) => {
    getFileName(res.locals.userId)
        .then((row) => {
            if (row) {
                return res.sendFile(row.filename, {root: filesDest, dotfiles: "allow"})
            }
            else {
                return res.status(404).json({message: "Could not find the file", errors: ["Could not find the file"]})
            }
        })
        .catch((err) => {
            return serverErrorHandler(err, res)
        })
})

router.post('/', verifyToken, (req: Request, res: Response) => {
    upload(req, res, (err) => {
        if (err && err.message === 'Please provide png/jpg/jpeg file') {
            return res.status(404).json({errors: [err.message]})
        }
        else if (err) {
            console.warn(err)
            return res.status(500).json({errors: ["An internal server error occured (multer)"]})
        } else {
            getFileName(res.locals.userId)
                .then((row) => {
                    if (row) {
                        const file = `${filesDest}/${row.filename}`
                        return fs.unlink(file)
                    } else {
                        return undefined
                    }
                })
                .then(() => {
                    return deleteFromFiles(res.locals.userId)
                })
                .then(() => {
                    const file: string | undefined = req.file?.filename
                    if (!file) throw new Error("Filename not found")
                    const userId: number = parseInt(res.locals.userId)
                    return insertIntoFiles({userId: userId, filename: file})
                })
                .then(() => {
                    res.status(201).json({message: "Image uploaded successfully"})
                })
                .catch((err) => {
                    if (err.message === "Filename not found") return res.status(400).json({message: "Filename not found", errors: ["Filename not found"]})
                    serverErrorHandler(err, res)
                })
        }
    })
})

export {router as more};
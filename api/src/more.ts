import express, { Request, Response } from 'express';
import multer from 'multer'
import { verifyToken } from './auth';
import path from 'path'
import * as fs from 'node:fs/promises'
import { getRandomValues } from 'node:crypto';
import { serverErrorHandler } from './commonResponse';
import { filesTable } from './db';

const filesDest = `${__dirname}/../files/user_files`

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
######################### Routes #########################
------------------------------------------------------- */

router.get('/', verifyToken, (req, res) => {
    filesTable.getFileName(res.locals.userId)
        .then((row) => {
            if (row) {
                res.sendFile(row.filename, {root: filesDest, dotfiles: "allow"})
            }
            else {
                res.status(404).json({message: "Could not find the file", errors: ["Could not find the file"]})
            }
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.get('/', ... ), filesTable.getFileName(...),  catch block")
        })
})

router.post('/', verifyToken, (req: Request, res: Response) => {
    upload(req, res, (err) => {
        if (err && err.message === 'Please provide png/jpg/jpeg file') {
            return res.status(404).json({errors: [err.message]})
        }
        else if (err) {
            serverErrorHandler(err, res, "router.post('/', ... ), upload(), cb, else if (err)", ["An internal server error occured (multer)"])
        } else {
            filesTable.getFileName(res.locals.userId)
                .then((row) => {
                    if (row) {
                        const file = `${filesDest}/${row.filename}`
                        return fs.unlink(file)
                    } else {
                        return undefined
                    }
                })
                .then(() => {
                    return filesTable.deleteFromFiles(res.locals.userId)
                })
                .then(() => {
                    const file: string | undefined = req.file?.filename
                    if (!file) throw new Error("Filename not found")
                    const userId: number = parseInt(res.locals.userId)
                    return filesTable.insertIntoFiles({userId: userId, filename: file})
                })
                .then(() => {
                    res.status(201).json({message: "Image uploaded successfully"})
                })
                .catch((err) => {
                    if (err.message === "Filename not found") return res.status(400).json({message: "Filename not found", errors: ["Filename not found"]})
                    serverErrorHandler(err, res, "router.post('/', ... ), upload, cb, filesTable.getFileName(), catch block")
                })
        }
    })
})

export {router as more};
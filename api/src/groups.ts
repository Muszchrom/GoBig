import express, { Request, Response, NextFunction } from "express"
import { groupsTable } from "./db"
import { serverErrorHandler } from "./commonResponse"

const router = express.Router()

export const getGroup = (req: Request, res: Response, next: NextFunction) => {
    groupsTable.getMainGroupId(res.locals.userId)
        .then((result) => {
            if (!result) return res.status(404).json({message: "Cant find group", errors: ["Cant find group"]})
            res.locals.groupId = result.groupId
            next()
        })
        .catch((err) => {
            serverErrorHandler(err, res, "getGroup middleware")
        })
}

export const validateWritePermissions = (req: Request, res: Response, next: NextFunction) => {
    groupsTable.getPrivileges(res.locals.groupId, res.locals.userId)
        .then((result) => {
            if (result === undefined) throw new Error("result_undefined")
            else if (result.userPrivileges > 1) res.status(403).json({message: "You dont have permission for this action"})
            else next()
        })
        .catch((err) => {
            if (err.message === "result_undefined") serverErrorHandler(err, res, "validateWritePermissions middleware (result undefined)")
            serverErrorHandler(err, res, "validateWritePermissions middleware")
        })
}

/* -------------------------------------------------------
######################### Routes #########################
------------------------------------------------------- */

router.get('/', getGroup, (req, res) => {
    groupsTable.getGroups(res.locals.userId)
        .then((rows) => {
            res.status(200).json({groups: rows})
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.get('/', ...) groupsTable.getGroups() catch block")
        })
})

router.post('/initGroup', (req, res) => {
    groupsTable.initGroup(res.locals.userId, req.body.groupName)
        .then(() => {
            res.status(201).json({message: "Group created"})
        })
        .catch((err) => {
            if (err.message === "group_exists") return res.status(401).json({message: "Group already exists", errors: ["Group already exists"]})
            else serverErrorHandler(err, res, "router.post('/initGroup') initGroup() catch block")
        })
})


export { router as groupsRouter }
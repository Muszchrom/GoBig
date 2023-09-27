import express, { Request, Response, NextFunction } from "express"
import { groupsTable, usersTable, invitesTable } from "./db"
import { serverErrorHandler } from "./commonResponse"
import { group } from "console"

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

// returns groups which user belongs to
router.get('/', (req, res) => {
    groupsTable.getGroups(res.locals.userId)
        .then((rows) => {
            res.status(200).json({groups: rows})
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.get('/', ...) groupsTable.getGroups() catch block")
        })
})

// initializes group for user (only one)
router.post('/initGroup', (req, res) => {
    if (req.body.groupName.length > 20 || req.body.groupName.length < 2) return res.status(400).json({message: "invlaid gorup name", errors: ["invalid group namame"]})
    groupsTable.initGroup(res.locals.userId, req.body.groupName)
        .then(() => {
            res.status(201).json({message: "Group created"})
        })
        .catch((err) => {
            if (err.message === "group_exists") return res.status(401).json({message: "Group already exists", errors: ["Group already exists"]})
            else serverErrorHandler(err, res, "router.post('/initGroup') initGroup() catch block")
        })
})

// returns array of up to 5 usernames
router.get('/usernames/:username', (req: Request, res: Response) => {
    const username = req.params.username
    if (username.length < 3) return res.status(400).json({message: "Provide at least 3 chars", erros: ["Please provide 3 or more characters"]})

    usersTable.getFiveUsernames(username)
        .then((rows) => {
            res.status(200).json({message: "Rows selected successfully!", usernames: rows});
        })
        .catch((err) => {
            serverErrorHandler(err, res, "groups.ts router.get('/usernames/:username', ... ), usersTable.getFiveUsernames(...), catch block")
        })
})

// requested by owner, removes users from his group

// requested by group member, removes himself from other users group

// marks group as the main one

// gets inites to someone's group
router.get('/invites', (req, res) => {
    invitesTable.getInvites(res.locals.userId)
        .then((rows) => res.status(200).json({invites: rows}))
        .catch((err) => serverErrorHandler(err, res, "router.get('/invites') catch block"))
})

// sends invite to group
router.post('/invites', (req, res) => {
    if (typeof req.body.receiver !== "string") return res.status(400).json({
        message: "Receiver's name should be a string", 
        erros: ["Receiver's name should be a string"]
    })
    if (req.body.receiver.length < 4 || req.body.receiver.length > 12) return res.status(400).json({
        message: "Receiver's name should be min 4 and max 12 characters long", 
        erros: ["Receiver's name should be min 4 and max 12 characters long"]
    })


    const uniqueCheck = (senderId: number, receiverId: number): Promise<{unique: boolean, receiver: number}> => {
        return new Promise((resolve, reject) => {
            invitesTable.checkIfSenderReceiverUnique(senderId, receiverId)
                .then((unique) => resolve({unique: unique, receiver: receiverId}))
                .catch((err) => reject(err))
        })
    }

    usersTable.getUserByUsername(req.body.receiver)
        .then((user) => {
            if (!user) throw new Error("user_doesnt_exist")
            return uniqueCheck(res.locals.userId, user.id)
        })
        .then((uniquenessCheck) => {
            if (!uniquenessCheck.unique) throw new Error("invitation_exists")
            return invitesTable.insertInvite(res.locals.userId, uniquenessCheck.receiver)
        })
        .then(() => res.status(201).json({message: "Invite sent successfully"}))
        .catch((err) => {
            if (err.message === "user_doesnt_exist") res.status(400).json({message: "User with this username doesn't exist", errors: ["User with this username doesn't exist"]})
            else if (err.message === "invitation_exists") res.status(400).json({message: "User has been already invited", errors: ["User has been already invited"]})
            else serverErrorHandler(err, res, "router.post('/invites') usersTable.getUserByUsername() catch block")
        })
})

// rejects or accepts invite to group body: {accept: boolean, sender: string, groupName: string}
router.delete('/invites', (req, res) => {
    if (typeof req.body.accept !== "boolean") return res.status(400).json({message: "'accept' should be a boolean", errors: ["'accept' should be a boolean"]})
    if (typeof req.body.sender !== "string") return res.status(400).json({
        message: "Sender's name should be a string", 
        erros: ["Sender's name should be a string"]
    })
    if (req.body.sender.length < 4 || req.body.sender.length > 12) return res.status(400).json({
        message: "Sender's name should be min 4 and max 12 characters long", 
        erros: ["Sender's name should be min 4 and max 12 characters long"]
    })
    if (typeof req.body.groupName !== "string") return res.status(400).json({
        message: "GroupName name should be a string", 
        erros: ["GroupName name should be a string"]
    })
    if (req.body.groupName.length < 4 || req.body.groupName.length > 12) return res.status(400).json({
        message: "groupName should be min 2 and max 20 characters long", 
        erros: ["groupName should be min 2 and max 20 characters long"]
    })

    const handleInviteReject = (senderId: number) => {
        invitesTable.deleteInvite(res.locals.userId, senderId)
            .then(() => {
                res.status(200).json({message: "Invite accepted"})
            })
            .catch((err) => {
                serverErrorHandler(err, res, "handleInviteReject()")
            })
    }

    const handleInviteAccept = (senderId: number) => {
        groupsTable.getId(senderId, req.body.groupName)
            .then((row) => {
                if (!row) throw new Error("Coulndt find id")
                return groupsTable.insertUser(row.id, res.locals.userId)
            })
            .then(() => {
                return invitesTable.deleteInvite(res.locals.userId, senderId)
            })
            .then(() => {
                res.status(200).json({message: "Invite accepted"})
            })
            .catch((err) => {
                serverErrorHandler(err, res, "handleInviteAccept()")
            })
    }

    usersTable.getUserByUsername(req.body.sender)
        .then((user) => {
            if (!user) throw new Error("user_doesnt_exist")
            if (!req.body.accept) handleInviteReject(user.id) 
            else handleInviteAccept(user.id)
        })
        .catch((err) => {
            serverErrorHandler(err, res, "usersTable.getUserByUsername()")
        })
})


export { router as groupsRouter }
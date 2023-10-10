import express, { Request, Response, NextFunction } from "express"
import { groupsTable, usersTable, invitesTable } from "./db"
import { serverErrorHandler } from "./commonResponse"

const router = express.Router()

export const getGroup = (req: Request, res: Response, next: NextFunction) => {
    if (req.query.gid && typeof req.query.gid === "string") {
        const parsedQS = parseInt(req.query.gid)
        if (isNaN(parsedQS)) return res.status(400).json({errors: ["Invalid query param: gid"]})
        else {
            groupsTable.userBelongsToGroup(res.locals.userId, parsedQS)
                .then((result) => {
                    if (result) {
                        res.locals.groupId = parsedQS
                        next()
                        throw new Error("all fine")
                    } else {
                        return groupsTable.getMainGroupId(res.locals.userId)
                    }
                })
                .then((result) => {
                    if (result?.groupId) {
                        res.locals.groupId = result.groupId
                        next()
                    } else {
                        res.status(401).json({errors: ["You do not belong to any group"]})
                    }
                })
                .catch((err) => {
                    if (err.message === "all fine") return
                    serverErrorHandler(err, res, "getGroup groupsTable.userBelongsToGroup catch block")
                })
        }
    } else {
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
            else serverErrorHandler(err, res, "validateWritePermissions middleware")
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
    if (username.length < 3) return res.status(400).json({message: "Provide at least 3 chars", errors: ["Please provide 3 or more characters"]})

    usersTable.getFiveUsernames(username, res.locals.userId)
        .then((rows) => {
            res.status(200).json({message: "Rows selected successfully!", usernames: rows});
        })
        .catch((err) => {
            serverErrorHandler(err, res, "groups.ts router.get('/usernames/:username', ... ), usersTable.getFiveUsernames(...), catch block")
        })
})

// requested by group member, removes himself from other users group
router.delete('/groups', (req, res) => {
    if (typeof req.body.groupName !== "string") return res.status(400).json({message: "Invalid groupName", errors: ["Invalid groupName"]})
    groupsTable.leaveGroup(res.locals.userId, req.body.groupName)
        .then((changes) => {
            if (!changes) res.status(400).json({errors: ["Invalid group name"]})
            else {
                console.log(changes)
                res.status(200).json({message: `You successfully left the group`})
            }
        })
        .catch((err) => serverErrorHandler(err, res, "router.delete(/users) groupsTable.leaveGroup catch"))
})

// returns users of your group
router.get('/users', (req, res) => {
    groupsTable.getUsers(res.locals.userId)
        .then((rows) => {
            res.status(200).json({users: rows})
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.delete('/users')")
        })
})

// requested by owner, removes users from his group
router.delete('/users', (req, res) => {
    if (typeof req.body.username !== "string") return res.status(400).json({message: "Invalid username", errors: ["Invalid username"]})
    groupsTable.deleteUser(req.body.username, res.locals.userId)
        .then(() => {
            res.status(200).json({message: "User deleted successfully"})
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.delete('/users') groupsTable.deleteUser catch block")
        })
})

// marks group as the main one

// gets invites to someone's group
router.get('/invites', (req, res) => {
    invitesTable.getInvites(res.locals.userId)
        .then((rows) => res.status(200).json({invites: rows}))
        .catch((err) => serverErrorHandler(err, res, "router.get('/invites') catch block"))
})

// sends invite to group body.receiver: string
router.post('/invites', (req, res) => {
    if (typeof req.body.receiver !== "string") return res.status(400).json({
        message: "Receiver's name should be a string", 
        errors: ["Receiver's name should be a string"]
    })
    if (req.body.receiver.length < 4 || req.body.receiver.length > 12) return res.status(400).json({
        message: "Receiver's name should be min 4 and max 12 characters long", 
        errors: ["Receiver's name should be min 4 and max 12 characters long"]
    })

    // check if user belongs to group
    const uniqueCheck = (senderId: number, receiverId: number): Promise<{unique: boolean, receiver: number}> => {
        return new Promise((resolve, reject) => {
            groupsTable.isUserInGroup(receiverId, senderId)
                .then((userInGroup) => {
                    if (userInGroup) throw new Error("user_in_group")
                    else return invitesTable.checkIfSenderReceiverUnique(senderId, receiverId)
                })
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
            else if (err.message === "user_in_group") res.status(400).json({message: "User is already in your group", errors: ["User is already in your group"]})
            else serverErrorHandler(err, res, "router.post('/invites') usersTable.getUserByUsername() catch block")
        })
})

// rejects or accepts invite to group body: {accept: boolean, sender: string, groupName: string}
router.delete('/invites', (req, res) => {
    if (typeof req.body.accept !== "boolean") return res.status(400).json({message: "'accept' should be a boolean", errors: ["'accept' should be a boolean"]})
    if (typeof req.body.sender !== "string") return res.status(400).json({
        message: "Sender's name should be a string", 
        errors: ["Sender's name should be a string"]
    })
    if (req.body.sender.length < 4 || req.body.sender.length > 12) return res.status(400).json({
        message: "Sender's name should be min 4 and max 12 characters long", 
        errors: ["Sender's name should be min 4 and max 12 characters long"]
    })
    if (typeof req.body.groupName !== "string") return res.status(400).json({
        message: "GroupName name should be a string", 
        errors: ["GroupName name should be a string"]
    })
    if (req.body.groupName.length < 4 || req.body.groupName.length > 20) return res.status(400).json({
        message: "groupName should be min 2 and max 20 characters long", 
        errors: ["groupName should be min 2 and max 20 characters long"]
    })

    const handleInviteReject = (senderId: number) => {
        invitesTable.deleteInvite(senderId, res.locals.userId)
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
                return invitesTable.deleteInvite(senderId, res.locals.userId)
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
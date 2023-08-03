const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const {verifyToken} = require('./auth');

const router = express.Router();
// q = d

const db = new sqlite3.Database('./database/calendar.db', sqlite3.OPEN_READWRITE, (err, result) => {
    if (err) {
        console.warn(err);
        return;
    }
});
db.run(`PRAGMA foreign_keys = ON`)

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='constructor'`, (err, table) => {
    if (err) {
        console.warn(err);
        return;
    }
    if (!table) {
        console.log('Creating Table constructor for calendar')
        db.run(`CREATE TABLE constructor(
            id INTEGER,
            userId INTEGER NOT NULL,
            monthId INTEGER NOT NULL,
            weekId  INTEGER NOT NULL,
            weekType INTEGER NOT NULL,
            PRIMARY KEY(id),
            UNIQUE (userId, weekId)
        )`);
    }
});

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='details'`, (err, table) => {
    if (err) {
        console.warn(err);
        return;
    }
    if (!table) {
        console.log('Creating Table details for calendar')
        db.run(`CREATE TABLE details(
            id INTEGER NOT NULL,
            userId INTEGER NOT NULL,
            day INTEGER NOT NULL,
            dayType TEXT,
            message TEXT,
            emoji TEXT,
            UNIQUE(id, day),
            FOREIGN KEY(id) REFERENCES constructor(id) ON DELETE CASCADE
        )`);
    }
});
/* -------------------------------------------------------
########################## SQL ###########################
------------------------------------------------------- */

// constructor table
const createConstructorRow = (valuesArray) => {
    const sql = `INSERT INTO constructor(userId, monthId, weekId, weekType) VALUES (?, ?, ?, ?)`;
    
    return new Promise((resolve, reject) => {
        db.run(sql, valuesArray, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(true);
        })
    });
}
// constructor table
const getConstructorRowsForUserId = (userId) => {
    const sql = `SELECT * FROM constructor WHERE userId=? ORDER BY weekId`;

    return new Promise((resolve, reject) => {
        db.all(sql, userId, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        })
    })
}
// constructor table
const deleteAllConstructorRecordsForUserId = (userId) => {
    const sql = `DELETE FROM constructor WHERE userId=?`

    return new Promise((resolve, reject) => {
        db.run(sql, userId, (err) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(true);
        })
    });
}
// constructor table
const updateConstructorWeekType = (weekType, userId, weekId) => {
    const sql = `UPDATE constructor SET weekType=? WHERE userId=? AND weekId=?`;

    return new Promise((resolve, reject) => {
        db.run(sql, [weekType, userId, weekId], function(err, row) {
            if (err) {
                reject(err);
                return;
            }
            resolve(Boolean(this.changes));
        })
    });
}
// details table
const createDetailsRow = (valuesObject) => {
    const valuesArray = [
        valuesObject.weekId,
        valuesObject.userId,
        valuesObject.userId,
        valuesObject.day,
        valuesObject.dayType,
        valuesObject.message,
        valuesObject.emoji
    ]
    const sql = `INSERT INTO details(id, userId, day, dayType, message, emoji) 
                VALUES ((SELECT id FROM constructor WHERE weekId=? AND userId=?), ?, ?, ?, ?, ?)`;
    
    return new Promise((resolve, reject) => {
        db.run(sql, valuesArray, (err) => {
            if (err) {
                console.log("an error ocured here")
                reject(err);
                return;
            }
            resolve(true);
        })
    });
}
// details table - get number of rows for provided userId and weekId
const getNumOfDetailsRows = (valuesObject) => {
    const sql = `SELECT Count(*) FROM details WHERE id=(SELECT id FROM constructor WHERE weekId=? AND userId=?)`;
    
    return new Promise((resolve, reject) => {
        db.all(sql, [valuesObject.weekId, valuesObject.userId], (err, rows) => {
            if (err) {
                console.log("an error ocured here")
                reject(err);
                return;
            }
            resolve(rows);
        })
    });
}
// details table
const getDetailsRowsForUserId = (userId) => {
    const sql = `SELECT monthId, weekId, weekType, day, dayType, message, emoji 
                FROM (SELECT * FROM constructor WHERE userId=?) AS C 
                INNER JOIN details ON C.id = details.id`;

    return new Promise((resolve, reject) => {
        db.all(sql, userId, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        })
    })
}
// details table
const deleteDetailsRow = (valuesObject) => {
    const sql = `DELETE FROM details 
                 WHERE id=(SELECT id FROM constructor WHERE userId=? AND weekId=?) AND day=?`

    const valuesArray = [valuesObject.userId, valuesObject.weekId, valuesObject.day]
    return new Promise((resolve, reject) => {
        db.run(sql, valuesArray, function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        })
    });
}
const updateDetailsRow = (valuesObject) => {
    const sql = `UPDATE details
                 SET dayType=?, message=?, emoji=? 
                 WHERE id=(SELECT id FROM constructor WHERE userId=? AND weekId=?) AND day=?`

    const valuesArray = [valuesObject.dayType, valuesObject.message, valuesObject.emoji, valuesObject.userId, valuesObject.weekId, valuesObject.day]
    return new Promise((resolve, reject) => {
        db.run(sql, valuesArray, function(err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        })
    });
}
/* -------------------------------------------------------
####################### Middleware #######################
------------------------------------------------------- */

// default handler for unhandled errors
const serverErrorHandler = (err, res) => {
    console.warn(err);
    return res.status(500).json({message: "An internal server error occured", errors: ["An internal server error occured"]})
}

// name is self explanatory
const createConstructorForUser = (req, res, next) => {
    let dateStart = req.body.dateStart
    let dateEnd = req.body.dateEnd

    // check if date is valid
    if (isNaN(Date.parse(dateStart))) return res.status(400).json({message: "Invalid dateStart", errors: ["Invalid dateStart"]});
    if (isNaN(Date.parse(dateEnd))) return res.status(400).json({message: "Invalid dateEnd", errors: ["Invalid dateEnd"]});

    dateStart = new Date(dateStart)
    dateEnd = new Date(dateEnd)

    if (dateStart - dateEnd > 0) return res.status(400).json({message: "dateStart dateEnd mismatch", errors: ["dateStart dateEnd mismatch"]})
    if ((dateEnd - dateStart)/(1000*60*60*24) > 300) return res.status(400).json({message: "Difference between dates must not exceed 300 days", errors: ["Difference between dates must not exceed 300 days"]}) 
    
    const userId = res.locals.userId
    console.log(userId)

    // create first weeks object
    let weekId = 1
    const dates = [{
        userId: userId,
        monthId: dateStart.getMonth(),
        weekId: weekId,
        weekType: 1
    }]

    // shift date to monday
    if (dateStart.getDay() !== 1) {
        if (dateStart.getDay() === 0) dateStart.setDate(dateStart.getDate() - 6)
        else dateStart.setDate(dateStart.getDate() - dateStart.getDay() +  1)
    }

    // create weeks till end date
    while (new Date(new Date(dateStart).setDate(dateStart.getDate() + 7)) <= dateEnd) {
        weekId += 1;
        const d = new Date(dateStart.setDate(dateStart.getDate() + 7))
        dates.push({
            userId: userId,
            monthId: d.getMonth(),
            weekId: weekId,
            weekType: 1,
        })
    }
    // fill in the last month
    while (new Date(new Date(dateStart).setDate(dateStart.getDate() + 7)).getMonth() === dateEnd.getMonth()) {
        weekId += 1;
        const d = new Date(dateStart.setDate(dateStart.getDate() + 7))
        dates.push({
            userId: userId,
            monthId: d.getMonth(),
            weekId: weekId,
            weekType: 1,
        })
    }
    
    const promises = [];
    dates.forEach((item) => {
        promises.push(createConstructorRow([item.userId, item.monthId, item.weekId, item.weekType]));
    })
    Promise.all(promises)
        .then((val) => {
            return next();
        })
        .catch((err) => {
            return serverErrorHandler(err, res);
        });
}

// table::constructor - call next if rows === undefined for userId
const constructorForUserNotPresent = (req, res, next) => {
    getConstructorRowsForUserId(res.locals.userId)
        .then((rows) => {
            if (rows === undefined) next();
            else return res.status(400).json({message: "Constructor was already created", errors: ["Constructor was already created"]});
        })
        .catch((err) => {
            return serverErrorHandler(err, res);
        })
}
/* -------------------------------------------------------
######################### Routes #########################
------------------------------------------------------- */

// body {dateStart: "month day year", dateEnd: "month day year"}
router.post('/constructor', verifyToken, constructorForUserNotPresent, createConstructorForUser, (req, res) => {
    getConstructorRowsForUserId(res.locals.userId)
        .then((rows) => {
            if (rows) return res.status(200).json({message: "Rows were created successfully", rows: rows})
            return res.status(500).json({message: "Rows were not found after creation (its most likely server error)", errors: ["Rows were not found after creation (its most likely server error)"]})
        })
        .catch((err) => {
            return serverErrorHandler(err, res)
        })
})
router.get('/constructor', verifyToken, (req, res) => {
    getConstructorRowsForUserId(res.locals.userId)
        .then((rows) => {
            if (rows) return res.status(200).json({message: "Rows selected successfully", rows: rows})
            return res.status(404).json({message: "Rows were not found", errors: ["Rows were not found"]})
        })
        .catch((err) => {
            return serverErrorHandler(err, res)
        })
})
router.delete('/constructor', verifyToken, (req, res) => {
    deleteAllConstructorRecordsForUserId(res.locals.userId)
        .then((result) => {
            if (result) return res.status(200).json({message: "Rows deleted successfully"});
            serverErrorHandler("Result is false at router.delete('/constructor')");
        })
        .catch((err) => {
            serverErrorHandler(err, res);
        });
})
// body {weekId: int, weekType: int}
router.patch('/constructor', verifyToken, (req, res) => {
    if (!Number.isInteger(req.body.weekId)) return res.status(400).json({message: "weekId must be an integer", errors: ["weekId must be an integer"]});
    if (!Number.isInteger(req.body.weekType)) return res.status(400).json({message: "weekType must be an integer", errors: ["weekType must be an integer"]});
    
    updateConstructorWeekType(req.body.weekType, res.locals.userId, req.body.weekId)
        .then((result) => {
            if (result) return res.status(200).json({message: "Rows updated successfully"});
            else return res.status(400).json({message: "Unable to change rows, weekId is most likely invalid", errors: ["Unable to change rows, weekId is most likely invalid"]})
        })
        .catch((err) => {
            serverErrorHandler(err, res);
        });
})

// body {weekId: int, day: int, dayType: string, message: string, emoji: string}
router.post('/details', verifyToken, (req, res) => {
    const valuesObject = {
        weekId: req.body.weekId,
        userId: res.locals.userId,
        day: req.body.day,
        dayType: req.body.dayType,
        message: req.body.message,
        emoji: req.body.emoji
    }
    getNumOfDetailsRows({weekId: req.body.weekId, userId: res.locals.userId})
        .then((rows) => {
            if (rows[0]["Count(*)"] >=7) throw new Error("max_exceded")
            return createDetailsRow(valuesObject);
        })
        .then((result) => {
            if (result) return res.status(200).json({message: "Rows inserted successfully"})
            return serverErrorHandler("Result is false at router.post('/details')");
        })
        .catch((err) => {
            console.log(err)
            if (err.message === "max_exceded") return res.status(400).json({message: "Number of days exceeds maximum for weekId", errors: ["Number of days exceeds maximum for weekId"]})
            if (err.errno === 19) return res.status(400).json({message: "One or more errors occured, check errors array for clues", errors: ["weekId is not correct", "weekId and day already exist when this combination must be uniqe"]});
            return serverErrorHandler(err, res);
        })
});
router.get('/details', verifyToken, (req, res) => {
    getDetailsRowsForUserId(res.locals.userId)
        .then((rows) => {
            return res.status(200).json({message: "Rows selected successfully", rows: rows});
        })
        .catch((err) => {
            serverErrorHandler(err);
        });
        
});
// body {weekId: int, day: int}
router.delete('/details', verifyToken, (req, res) => {
    deleteDetailsRow({userId: res.locals.userId, weekId: req.body.weekId, day: req.body.day})
        .then((result) => {
            if (result === 0) return res.status(400).json({message: "No row has been deleted", errors: ["No row has been deleted"]});
            if (result === 1) return res.status(200).json({message: "Row deleted successfully"});
            if (result !== 1) {
                console.warn("Deleted too much rows at delete/details");
                return res.status(500).json({message: "Deleted too much rows, this is most likely server error", errors: ["Deleted too much rows, this is most likely server error"]});
            }
            throw new Error("Result is not defined");
        })
        .catch((err) => {
            serverErrorHandler(err, res);
        })
});
// body {weekId: int, day: int, dayType: string, message: string, emoji: string}
router.patch('/details', verifyToken, (req, res) => {
    const valuesObject = {
        userId: res.locals.userId, 
        weekId: req.body.weekId, 
        day: req.body.day,
        dayType: req.body.dayType, 
        message: req.body.message, 
        emoji: req.body.emoji
    }

    updateDetailsRow(valuesObject)
        .then((result) => {
            if (result === 0) return res.status(400).json({message: "No row has been updated", errors: ["No row has been updated"]});
            if (result === 1) return res.status(200).json({message: "Row updated successfully"});
            if (result !== 1) {
                console.warn("Updated too much rows at patch/details");
                return res.status(500).json({message: "Updated too much rows, this is most likely server error", errors: ["Updated too much rows, this is most likely server error"]});
            }
            throw new Error("Result is not defined");
        })
        .catch((err) => {
            serverErrorHandler(err, res);
        })
});
module.exports = {calendarRouter: router};
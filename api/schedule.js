const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const {verifyToken} = require('./auth');

const router = express.Router();

const db = new sqlite3.Database('./database/schedule.db', sqlite3.OPEN_READWRITE, (err, result) => {
    if (err) {
        console.warn(err);
        return;
    }
});

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='schedule'`, (err, table) => {
    if (err) {
        console.warn(err);
        return;
    }
    if (!table) {
        console.log('Creating Table')
        db.run(`CREATE TABLE schedule(
            id INTEGER PRIMARY KEY, 
            day INTEGER NOT NULL, 
            start TEXT NOT NULL, 
            end TEXT NOT NULL, 
            subjectName TEXT NOT NULL, 
            subjectType TEXT NOT NULL, 
            hall TEXT NOT NULL, 
            teacher TEXT NOT NULL, 
            icon TEXT NOT NULL, 
            additionalInfo TEXT, 
            weekStart INTEGER NOT NULL, 
            weekEnd INTEGER NOT NULL, 
            weekType INTEGER NOT NULL
            userId INTEGER NOT NULL)`);
    }
});

/* -------------------------------------------------------
########################## SQL ###########################
------------------------------------------------------- */

const createSubject = (valuesArray) => {
    const sql = `INSERT INTO schedule(day, start, end, subjectName, subjectType, hall, teacher, icon, additionalInfo, weekStart, weekEnd, weekType, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

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

const getSubjectsByData = (valuesArray) => {
    const sql = `SELECT * FROM schedule WHERE day=? AND start=? AND end=? AND subjectName=? AND subjectType=? AND hall=? AND teacher=? AND icon=? AND additionalInfo=? AND weekStart=? AND weekEnd=? AND weekType=? AND userId=?`

    return new Promise((resolve, reject) => {
        db.all(sql, valuesArray, (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        })
    });
}

const getSubjectsByDay = (day, userId) => {
    const sql = `SELECT * FROM schedule WHERE day=? AND userId=? ORDER BY start`

    return new Promise((resolve, reject) => {
        db.all(sql, [day, userId], (err, rows) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(rows);
        })
    });
}

const getSchedule = (userId) => {
    const sql = `SELECT * FROM schedule WHERE userId=? ORDER BY day, start`

    return new Promise((resolve, reject) => {
        db.all(sql, userId, (err, rows) => {
            if (err) {
                reject(err)
                return
            }
            resolve(rows);
        })
    })
}

const updateSubject = (id, queryFields, values) => {
    const sql = `UPDATE schedule SET ${queryFields} WHERE id=?`
    values.push(id);

    return new Promise((resolve, reject) => {
        db.run(sql, values, function (err, rows) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        });
    });
}

const deleteSubject = (id, userId) => {
    const sql = `DELETE FROM schedule WHERE id=? AND userId=?`

    return new Promise((resolve, reject) => {
        db.run(sql, [id, userId], function (err, rows) {
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

const validationChain = [
    body('day')
        .isInt({min: 0, max: 6})
        .withMessage('Subject day should be an integer greater or equal than 0 and less or equal than 6'),
    body('start')
        .matches(/^[0-9][0-9]:[0-9][0-9]$/)
        .withMessage('Subject start should match ^[0-9][0-9]:[0-9][0-9]$ format'),
    body('end')
        .matches(/^[0-9][0-9]:[0-9][0-9]$/)
        .withMessage('Subject end should match ^[0-9][0-9]:[0-9][0-9]$ format'),
    body('subjectName')
        .matches(/^[a-zA-ZżźćńółęąśŻŹĆĄŚĘŁÓŃ \.\,\-\_]+$/)
        .withMessage('Subject name should match ^[a-zA-ZżźćńółęąśŻŹĆĄŚĘŁÓŃ \.\,\-\_]+$ format'),
    body('subjectType')
        .isIn(['Laboratory', 'Lecture', 'Classes', 'Project', 'Foreign language course'])
        .withMessage('Subject type must be contained in [\'Laboratory\', \'Lecture\', \'Classes\', \'Project\', \'Foreign language course\']'), 
    body('hall')
        .matches(/^[a-zA-Z0-9\- ]+$/)
        .withMessage('Subject hall should match ^[a-zA-Z0-9\- ]+$ format'),
    body('teacher')
        .matches(/^[a-zA-ZżźćńółęąśŻŹĆĄŚĘŁÓŃ \.\,]+$/)
        .withMessage('Subject\'s teacher should match ^[a-zA-ZżźćńółęąśŻŹĆĄŚĘŁÓŃ \.\,]+$ format'),
    body('icon')
        .matches(/^[a-zA-Z\-\_0-9]+\.svg$/)
        .withMessage('Subject\'s icon name should match ^[a-zA-Z\-\_0-9]+\.svg$ format'),
    body('additionalInfo')
        .matches(/^[a-zA-ZżźćńółęąśŻŹĆĄŚĘŁÓŃ \.\,\-\_\n]*$/)
        .withMessage('Subject\'s additional information should match ^[a-zA-ZżźćńółęąśŻŹĆĄŚĘŁÓŃ \.\,\-\_\n]*$ format'),
    body('weekStart')
        .isInt({min: -1, max: 20})
        .withMessage('Subject week start should be an integer greater or equal than -1 and less or equal than 20'),
    body('weekEnd')
        .isInt({min: -1, max: 20})
        .withMessage('Subject week end should be an integer greater or equal than -1 and less or equal than 20'),
    body('weekType')
        .isInt({min: 0, max: 2})
        .withMessage('Subject week type should be an integer greater or equal than 0 and less or equal than 2'),
]

// Call next() if validation errors array is empty
const validateSubject = (req, res, next) => {
    const errors = validationResult(req);
    if (errors.isEmpty()) {
        return next();
    }
    const errorMessages = errors.array().map(error => error.msg);
    return res.status(400).json({
        message: "Validation error(s) occured, check errors for more info", 
        errors: errorMessages
    });
}

// Call next() if updateArray fits all conditions
const validateUpdateArray = (req, res, next) => {
    if (!(Array.isArray(req.body.updateArray))) {
        return res.status(400).json({
            message: "Update array is not an array", 
            errors: ["Update array is not an array"]});
    }

    if (req.body.updateArray.length < 1) {
        return res.status(400).json({
            message: "Update array length should be equal or greater than 0", 
            errors: ["Update array length should be equal or greater than 0"]}); 
    }

    if (new Set(req.body.updateArray).size !== req.body.updateArray.length) {
        return res.status(400).json({
            message: "Update array contains duplicates", 
            errors: ["Update array contains duplicates"]});
    }

    const colReference = ['day', 'start', 'end', 'subjectName', 'subjectType', 'hall', 'teacher', 'icon', 'additionalInfo', 'weekStart', 'weekEnd', 'weekType'];
    for (let i=0; i<req.body.updateArray.length; i++) {
        if (colReference.indexOf(req.body.updateArray[i]) === -1) {
            return res.status(400).json({
                message: "Update array contains unexpected fields", 
                errors: ["Update array contains unexpected fields"]});
        }
    }
    next();
}

// Call next() if id is a number
const validateId = (req, res, next) => {
    if (isNaN(parseInt(req.body.id)) || req.body.id != parseInt(req.body.id)) {
        return res.status(400).json({
            message: "Inavild id", 
            errors: ["Inavild id"]})
    }
    return next();
}

// Call next() if validation turns out successfull, Use after validateUpdateArray()!
const validateUpdate = async (req, res, next) => {
    const columnsReference = ['day', 'start', 'end', 'subjectName', 'subjectType', 'hall', 'teacher', 'icon', 'additionalInfo', 'weekStart', 'weekEnd', 'weekType'];

    for (let i=0; i<req.body.updateArray.length; i++) {
        const index = columnsReference.indexOf(req.body.updateArray[i]);
        await validationChain[index].run(req);
    }
    
    validateSubject(req, res, next);
}

/* -------------------------------------------------------
######################### Routes #########################
------------------------------------------------------- */

router.get('/', verifyToken, (req, res) => {
    getSchedule(res.locals.userId)
        .then((rows) => {
            res.status(200).json({message: "Rows selected successfully!", rows: rows})
        })
        .catch((err) => {
            console.warn(err)
            return res.status(500).json({message: "An internal server error occured", errors: ["An internal server error occured"]})
        })
})

// Get schedule for given day
router.get('/:day', verifyToken, (req, res) => {
    const day = parseInt(req.params.day);
    if (isNaN(day)) return res.status(400).json({message: "Day is not a valid number or was not provided", erros: ["Day is not a valid number or was not provided"]})
    
    if (day < 0 || day > 6) {
        return res.status(400).json({
            message: "Day should be an integer greater or equal than 0 and less or equal than 6", 
            errors: ["Day should be an integer greater or equal than 0 and less or equal than 6"]
        });
    }
    getSubjectsByDay(day, res.locals.userId)
        .then((rows) => {
            res.status(200).json({message: "Rows selected successfully!", rows: rows});
        })
        .catch((err) => {
            console.warn(err);
            return res.status(500).json({message: "An internal server error occured", errors: ["An internal server error occured"]});
        })
})

// Create new schedule row
router.post('/', verifyToken, validationChain, validateSubject, (req, res) => {
    valuesArray = [
        req.body.day, 
        req.body.start, 
        req.body.end, 
        req.body.subjectName, 
        req.body.subjectType, 
        req.body.hall, 
        req.body.teacher, 
        req.body.icon, 
        req.body.additionalInfo, 
        req.body.weekStart, 
        req.body.weekEnd, 
        req.body.weekType,
        res.locals.userId
    ]

    // check if subject exists (need that to retrieve id later on)
    getSubjectsByData(valuesArray)
        .then((rows) => {
            if (rows.length) {
                throw new Error("subject_exists")
            } else {
                return createSubject(valuesArray)
            }
        })
        .then((result) => {
            if (result) {
                return getSubjectsByData(valuesArray)
            } else {
                throw new Error("Unable to save user in database")
            }
        })
        .then((rows) => {
            if (rows.length) {
                return res.status(201).json({message: "Subject successfully created", row: rows})
            } else {
                throw new Error("Unable to find just created subject in the database")
            }
        })
        .catch((err) => {
            if (err.message === "subject_exists") {
                return res.status(400).json({message: "This subject already exists", errors: ["This subject already exists"]})
            } else {
                console.warn(err);
                return res.status(500).json({message: "An internal server error occured", errors: ["An internal server error occured"]})
            }
        })
});

// Update schedule row
router.patch('/', verifyToken, validateId, validateUpdateArray, validateUpdate, (req, res) => {
    let queryFields = '';
    let values = [];

    // hope i sanitized this array enough
    for (let i=0; i<req.body.updateArray.length; i++) {
        queryFields += `${req.body.updateArray[i]}=?, `;
        values.push(req.body[req.body.updateArray[i]]);
    }
    
    // add userId
    queryFields += `userId=?, `;
    values.push(res.locals.userId);

    queryFields = queryFields.slice(0, -2);

    updateSubject(req.body.id, queryFields, values)
        .then((result) => {
            if (result) {
                return res.status(200).json({message: "Subject updated successfully"});
            } else {
                return res.status(400).json({message: "Unable to update subject", errors: ["id provided didnt match any records"]});
            }
        })
        .catch((err) => {
            console.warn(err);
            return res.status(500).json({message: "An internal server error occured", errors: ["An internal server error occured"]});
        })
})

// Delete schedule row
router.delete('/', verifyToken, validateId, (req, res) => {
    deleteSubject(req.body.id, res.locals.userId)
        .then((result) => {
            if (result) {
                return res.status(200).json({message: "Subject deleted successfully"});
            } else {
                return res.status(400).json({message: "Unable to update subject", errors: ["id provided didnt match any records"]});
            }
        })
        .catch((err) => {
            console.warn(err);
            return res.status(500).json({message: "An internal server error occured", errors: ["An internal server error occured"]});
        });
});

module.exports = {scheduleRouter: router};
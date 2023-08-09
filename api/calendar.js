const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { body, validationResult } = require('express-validator');

const {verifyToken} = require('./auth');

const router = express.Router();

const db = new sqlite3.Database('./database/calendar.db', sqlite3.OPEN_READWRITE, (err, result) => {
    if (err) {
        console.warn(err);
        return;
    }
});
db.run(`PRAGMA foreign_keys = ON`)

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='months'`, (err, table) => {
    if (err) {
        console.warn(err);
        return;
    }
    if (!table) {
        console.log('Creating Table months for calendar')
        db.run(`CREATE TABLE months(
            id INTEGER,
            userId INTEGER NOT NULL,
            month INTEGER NOT NULL,
            PRIMARY KEY(id),
            UNIQUE(userId, month)
        )`);
    }
});

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='weeks'`, (err, table) => {
    if (err) {
        console.warn(err);
        return;
    }
    if (!table) {
        console.log('Creating Table weeks for calendar')
        db.run(`CREATE TABLE weeks(
            monthId INTEGER NOT NULL,
            id INTEGER,
            week INTEGER NOT NULL,
            type INTEGER NOT NULL,
            PRIMARY KEY(id),
            UNIQUE(monthId, week),
            FOREIGN KEY(monthId) REFERENCES months(id) ON DELETE CASCADE
        )`);
    }
});

db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name='days'`, (err, table) => {
    if (err) {
        console.warn(err);
        return;
    }
    if (!table) {
        console.log('Creating Table days for calendar')
        db.run(`CREATE TABLE days(
            weekId INTEGER NOT NULL,
            id INTEGER,
            day INTEGER NOT NULL,
            type INTEGER NOT NULL,
            message TEXT,
            PRIMARY KEY(id),
            UNIQUE(id, day),
            FOREIGN KEY(weekId) REFERENCES weeks(id) ON DELETE CASCADE
        )`);
    }
});

/* -------------------------------------------------------
########################## SQL ###########################
------------------------------------------------------- */

// needed for creation
const insertIntoMonths = ({userId, month}) => {
    const sql = "INSERT INTO months(userId, month) VALUES (?, ?)";
    return new Promise((resolve, reject) => {
        db.run(sql, [userId, month], (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}
// needed for creation
const insertIntoWeeks = ({monthId, week, type}) => {
    const sql = "INSERT INTO weeks(monthId, week, type) VALUES (?, ?, ?)";
    return new Promise((resolve, reject) => {
        db.run(sql, [monthId, week, type], (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}
// needed for creation
const insertIntoDays = ({weekId, day, type, message}) => {
    const sql = "INSERT INTO days(weekId, day, type, message) VALUES (?, ?, ?, ?)";
    return new Promise((resolve, reject) => {
        db.run(sql, [weekId, day, type, message], (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}
// needed for creation
const selectIdFromMonths = ({userId, month}) => {
    const sql = `SELECT id FROM months WHERE userId=? AND month=?`;
    return new Promise((resolve, reject) => {
        db.get(sql, [userId, month], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}
// needed for creation
const selectIdFromWeeks = ({monthId, week}) => {
    const sql = `SELECT id FROM weeks WHERE monthId=? AND week=?`;
    return new Promise((resolve, reject) => {
        db.get(sql, [monthId, week], (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}
// get all rows from all tables where userId is matching
const selectRowsWhereUserId = ({userId}) => {
    const sql = `SELECT months.month, weeks.week, weeks.type as wtype, days.day, days.type as dtype, days.message 
                 FROM months INNER JOIN weeks ON months.id = weeks.monthId INNER JOIN days ON days.weekId = weeks.id 
                 WHERE userId=? 
                 ORDER BY months.month, weeks.week, days.day`;

    return new Promise((resolve, reject) => {
        db.all(sql, [userId], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}
// self explanatory
const updateDay = ({userId, month, day, type, message}) => {
    const sql = `UPDATE days 
                 SET type=?, message=? 
                 WHERE id=(SELECT days.id FROM days INNER JOIN weeks ON days.weekId = weeks.id INNER JOIN months ON months.id = weeks.monthId WHERE userId=? AND months.month=? AND days.day=?)`

    return new Promise((resolve, reject) => {
        db.run(sql, [type, message, userId, month, day], function(err) {
            if (err) reject(err)
            else resolve(this.changes)
        })
    })
}
const updateWeekType = ({userId, week, type}) => {
    const sql = `UPDATE weeks 
                 SET type=? 
                 WHERE week=(SELECT weeks.week FROM weeks INNER JOIN months ON months.id = weeks.monthId WHERE userId=? AND week=?)`

    return new Promise((resolve, reject) => {
        db.run(sql, [type, userId, week], function(err) {
            if (err) reject(err)
            else resolve(this.changes)
        })
    })
}
// needed for creating new months linked to userId's
const selectFromMonthWhereUserId = ({userId}) => {
    const sql = `SELECT * FROM months WHERE userId=? LIMIT 1`;

    return new Promise((resolve, reject) => {
        db.get(sql, [userId], function(err, row) {
            if (err) reject(err)
            else resolve(row)
        })
    })
}
// delete everything related to userId
const deleteFromMonthsWhereUserId = ({userId}) => {
    const sql = `DELETE FROM months WHERE userId=?`

    return new Promise((resolve, reject) => {
        db.run(sql, [userId], function(err) {
            if (err) reject(err)
            else resolve(this.changes)
        })
    })
}

const selectWeeksAndWeekTypesForUserId = ({userId}) => {
    const sql = "SELECT DISTINCT weeks.week, weeks.type FROM weeks INNER JOIN months ON weeks.monthId = months.id WHERE userId=?"

    return new Promise((resolve, reject) => {
        db.get(sql, [userId], function(err, row) {
            if (err) reject(err)
            else resolve(row)
        })
    })
}

/* -------------------------------------------------------
####################### Middleware #######################
------------------------------------------------------- */
// hella slow holy fuck i've actually never experienced something like that before
const createDatesObject = (dateStart, dateEnd) => {
    const createMonthObject = (date, widx) => {
        const workingMonth = new Date(date).getMonth();
        // shitft date to monday of first day of the month
        date = new Date(date.setDate(date.getDate() - date.getDate() + 1));
        if (date.getDay() === 0) date.setDate(date.getDate() - 6);
        else date.setDate(date.getDate() - date.getDay() +  1);

        let weeks = [],
            days = [],
            weeksIndex = widx;

        while (!(workingMonth !== date.getMonth() && date.getDay() === 1 && weeks.length > 0)) {
            days.push({
                day: new Date(`${date.getMonth() + 1} ${date.getDate()} ${date.getFullYear()}`).getTime(),
                type: workingMonth === date.getMonth() ? 1 : 0,
                message: ""
            });
            if (days.length === 7) {
                if (weeks.length === 0 && days[0].type === 1) weeksIndex += 1;
                weeks.push({
                    week: weeksIndex,
                    type: 1,
                    days: days
                });
                weeksIndex += 1;
                days = [];
            }
            date.setDate(date.getDate() + 1);
        }

        return [weeks, weeksIndex];
    }

    let weeksIndex = 2;
    const data = [];

    while (!(dateStart.getFullYear() > dateEnd.getFullYear() || 
          (dateStart.getFullYear() === dateEnd.getFullYear() && dateStart.getMonth() > dateEnd.getMonth()))) {
        const retVal = createMonthObject(dateStart, weeksIndex - 1);
        weeksIndex = retVal[1];
        data.push({
            month: new Date(`${dateStart.getMonth() + 1} 1 ${dateStart.getFullYear()}`).getTime(),
            weeks: retVal[0]
        });
        dateStart.setMonth(dateStart.getMonth() + 1);
    }

    return data;
}
// hella slow holy fuck i've actually never experienced something like that before
const saveDatesObject = (req, res, next) => {
    let dateStart = req.body.dateStart;
    let dateEnd = req.body.dateEnd;

    // check if date is valid
    if (isNaN(Date.parse(dateStart))) return res.status(400).json({message: "Invalid dateStart", errors: ["Invalid dateStart"]});
    if (isNaN(Date.parse(dateEnd))) return res.status(400).json({message: "Invalid dateEnd", errors: ["Invalid dateEnd"]});

    dateStart = new Date(dateStart);
    dateEnd = new Date(dateEnd);

    if (dateStart - dateEnd > 0) return res.status(400).json({message: "dateStart dateEnd mismatch", errors: ["dateStart dateEnd mismatch"]});
    if ((dateEnd - dateStart)/(1000*60*60*24) > 300) return res.status(400).json({message: "Difference between dates must not exceed 300 days", errors: ["Difference between dates must not exceed 300 days"]});
    
    const userId = res.locals.userId;
    const data = createDatesObject(dateStart, dateEnd);

    const promises = []

    const saveDays = (weekId, days) => {
        return new Promise((resolve, reject) => {
            const promises = []
            days.forEach((day) => {
                promises.push(insertIntoDays({weekId: weekId, day: day.day, type: day.type, message: day.message}))
            })
            Promise.all(promises).then(() => resolve(true)).catch((err) => reject(err))
        })
    }

    const saveWeeks = (monthId, weeks) => {
        return new Promise((resolve, reject) => {
            const promises = []
            weeks.forEach((week) => {
                promises.push(
                    insertIntoWeeks({monthId: monthId, week: week.week, type: week.type})
                        .then(() => selectIdFromWeeks({monthId: monthId, week: week.week}))
                        .then((weekId) => saveDays(weekId.id, week.days)))
            })
            Promise.all(promises).then(() => resolve(true)).catch((err) => reject(err))
        })
    }

    data.forEach((month) => {
        promises.push(
            insertIntoMonths({userId: userId, month: month.month})
                .then(() => selectIdFromMonths({userId: userId, month: month.month}))
                .then(({id}) => {
                    const monthId = id
                    return saveWeeks(monthId, month.weeks)
                })
        )
    })
    Promise.all(promises)
        .then((val) => {
            console.log(val)
            return next();
        })
        .catch((err) => {
            return serverErrorHandler(err, res);
        });
}
// default handler for unhandled server errors
const serverErrorHandler = (err, res) => {
    console.warn(err);
    return res.status(500).json({message: "An internal server error occured", errors: ["An internal server error occured"]})
}
// call next if rows === undefined for userId
const constructorForUserNotPresent = (req, res, next) => {
    console.log(res.locals.userId)
    selectFromMonthWhereUserId({userId: res.locals.userId})
        .then((row) => {
            console.log(row)
            if (row === undefined) next()
            else return res.status(400).json({message: "Constructor is already created", errors: ["Constructor is already created"]});
        })
        .catch((err) => {
            return serverErrorHandler(err, res);
        })
}
// dateStart dateEnd validation is in saveDatesObject()
const validationChain = [
    body('month')
        .isInt({min: 0, max: 9999999999999})
        .withMessage('month should be an integer and its value in range 0 to 9999999999999 inclusive'),
    body('day')
        .isInt({min: 0, max: 9999999999999})
        .withMessage('day should be an integer and its value in range 0 to 9999999999999 inclusive'),
    body('type')
        .isInt({min: 0, max: 99})
        .withMessage('type should be an integer and its value in range from 0 to 99 inclusive'),
    body('message')
        .matches(/^[a-zA-Z0-9żźćńółęąśŻŹĆĄŚĘŁÓŃ? \.\,\-\_]*$/)
        .withMessage('message should match ^[a-zA-ZżźćńółęąśŻŹĆĄŚĘŁÓŃ \.\,\-\_]+$ format')
        .isByteLength({min: 0, max: 250})
        .withMessage('message should be up to 250 bytes long')
]
const validationChain2 = [
    body('week')
        .isInt({min: 0, max: 50})
        .withMessage('week should be an integer and its value in range 0 to 50 inclusive'),
    body('type')
        .isInt({min: 0, max: 99})
        .withMessage('type should be an integer and its value in range from 0 to 99 inclusive'),
]
// check if validationChain error messages were created
const responseToValidation = (req, res, next) => {
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

/* -------------------------------------------------------
######################### Routes #########################
------------------------------------------------------- */

// hella slow holy fuck i've actually never experienced something like that before
router.post('/', verifyToken, constructorForUserNotPresent, saveDatesObject, (req, res) => {
    res.status(200).json({
        message: "hello"
    })
})

router.get('/', verifyToken, (req, res) => {
    selectRowsWhereUserId({userId: res.locals.userId})
        .then((rows) => {
            if (rows.length === 0 || rows === undefined) return res.status(400).json({message: "You need to post date start and date end first", errors: ["You need to post date start and date end first"]})
            const data = {
                translations: {
                    weekType: ["unset","odd","even"],
                    dayType: ["inactive", "unset","message","dayoff","test","exam"]
                }, dates: []
            }
                
            let currentMonthIdx = 0,
                curretnWeekIdx = 0,
                weeks = [],
                days = [];
            
            for (let i=0; i<rows.length; i++) {
                if (rows[currentMonthIdx].month !== rows[i].month) {
                    weeks.push({
                        type: rows[curretnWeekIdx].wtype,
                        week: rows[curretnWeekIdx].week,
                        days: days
                    });
                    curretnWeekIdx = i;
                    days = [];

                    data.dates.push({
                        month: rows[currentMonthIdx].month, 
                        weeks: weeks
                    });
                    currentMonthIdx = i;
                    weeks = [];
                }
                if (rows[curretnWeekIdx].week !== rows[i].week) {
                    weeks.push({
                        type: rows[curretnWeekIdx].wtype,
                        week: rows[curretnWeekIdx].week,
                        days: days
                    });
                    curretnWeekIdx = i;
                    days = [];
                }
                days.push({
                    day: rows[i].day,
                    type: rows[i].dtype,
                    message: rows[i].message,
                });
            }
            // add last row
            weeks.push({
                type: rows[curretnWeekIdx].wtype,
                week: rows[curretnWeekIdx].week,
                days: days
            });
            data.dates.push({
                month: rows[currentMonthIdx].month,
                weeks: weeks
            });

            return res.status(200).json({message: "Successfully selected n of rows", data: data});
    })
    .catch((err) => {
        return serverErrorHandler(err, res);
    })
})

router.get('/weeks', verifyToken, (req, res) => {
    selectWeeksAndWeekTypesForUserId(res.locals.userId)
        .then((rows) => {
            return res.status(200).json({message: "Selected rows successfully", data: rows})
        })
        .catch((err) => {
            return serverErrorHandler(err, res);
        });
})

router.patch('/day', verifyToken, validationChain, responseToValidation, (req, res) => {
    updateDay({userId: res.locals.userId, month: req.body.month, day: req.body.day, type: req.body.type, message: req.body.message})
        .then((changes) => {
            if (changes === 0) return res.status(404).json({message: "Did not found any rows related to values provided, nothing was edited"});
            else return res.status(200).json({message: "Edited all rows related to values provided"});
        })
        .catch((err) => {
            return serverErrorHandler(err, res);
        });
})

router.patch('/week', verifyToken, validationChain2, responseToValidation, (req, res) => {
    updateWeekType({userId: res.locals.userId, week: req.body.week, type: req.body.type})
        .then((changes) => {
            if (changes === 0) return res.status(404).json({message: "Did not found any rows related to values provided, nothing was edited"});
            else return res.status(200).json({message: "Edited all rows related to values provided"});
        })
        .catch((err) => {
            return serverErrorHandler(err, res);
        });
})

router.delete('/', verifyToken, (req, res) => {
    deleteFromMonthsWhereUserId({userId: res.locals.userId})
        .then((changes) => {
            if (changes === 0) return res.status(200).json({message: "Did not found any rows related to your user id, nothing was deleted"});
            else return res.status(200).json({message: "Removed all rows related to your user id"});
        })
        .catch((err) => {
            return serverErrorHandler(err, res);
        });
})

module.exports = {calendarRouter: router};
import express, { Request, Response, NextFunction } from "express";
import sqlite from 'sqlite3';
const sqlite3 = sqlite.verbose()

import { body, validationResult } from 'express-validator';
import { verifyToken } from "./auth";

const router = express.Router();

const db = new sqlite3.Database('./database/calendar.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.warn(err);
        return;
    }
});
db.run(`PRAGMA foreign_keys = ON`)

interface MonthsTable {
    id: number,
    userId: number,
    month: number,
}

interface WeeksTable {
    monthId: number,
    id: number,
    week: number,
    type: number
}

interface DaysTable {
    weekId: number,
    id: number,
    day: number,
    type: number,
    message: string | undefined
}

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

interface BulkInsertMonths {
    (vals: [MonthsTable["userId"], MonthsTable["month"]][]): Promise<true> 
}
const bulkInsertMonths: BulkInsertMonths = (vals) => {
    return new Promise((resolve, reject) => {
        if (vals[0].length !== 2) reject("Type error, vals array should be full of tuples of length 2") 
        if (vals.length === 0) reject("Values array is empty")

        const qPart: string[] = []
        for (let i=0; i<vals.length; i++) qPart.push("(?, ?)")
        const sql = `INSERT INTO months(userId, month) VALUES ${qPart.join(", ")}`;

        const arr: (MonthsTable["userId"] | MonthsTable["month"])[] = []

        db.run(sql, arr.concat(...vals), (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}

type BulkInsertWeeksVals = [
    WeeksTable["monthId"], 
    WeeksTable["week"], 
    WeeksTable["type"]
][]
interface BulkInsertWeeks {
    (vals: BulkInsertWeeksVals, monthIds: {id: MonthsTable["userId"]}[]): Promise<{id: MonthsTable["userId"]}[]> 
}
const bulkInsertWeeks: BulkInsertWeeks = (vals, monthIds) => {
    return new Promise((resolve, reject) => {
        if (vals[0].length !== 3) reject("Type error, vals array should be full of tuples of length 3") 
        if (vals.length === 0) reject("Values array is empty")

        const qPart: string[] = []
        for (let i=0; i<vals.length; i++) qPart.push("(?, ?, ?)")
        const sql = `INSERT INTO weeks(monthId, week, type) VALUES ${qPart.join(", ")}`;

        const arr: (WeeksTable["monthId"] | WeeksTable["week"] | WeeksTable["type"])[] = []

        db.run(sql, arr.concat(...vals), (err) => {
            if (err) reject(err);
            else resolve(monthIds);
        });
    });
}

type BulkInsertDaysVals = [
    DaysTable["weekId"],
    DaysTable["day"],
    DaysTable["type"],
    DaysTable["message"]
][]
interface BulkInsertDays {
    (vals: BulkInsertDaysVals): Promise<true>
} 
const bulkInsertDays: BulkInsertDays = (vals) => {
    return new Promise((resolve, reject) => {
        if (vals[0].length !== 4) reject("Type error, vals array should be full of tuples of length 4") 
        if (vals.length === 0) reject("Values array is empty")

        const qPart: string[] = []
        for (let i=0; i<vals.length; i++) qPart.push("(?, ?, ?, ?)")
        const sql = `INSERT INTO days(weekId, day, type, message) VALUES ${qPart.join(", ")}`;

        const arr: (DaysTable["weekId"] | DaysTable["day"] | DaysTable["type"] | DaysTable["message"])[] = []

        db.run(sql, arr.concat(...vals), (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}
// needed for creation
interface SelectIdsFromMonths {
    (userId: MonthsTable["userId"]): Promise<{id: MonthsTable["userId"]}[]>
}
const selectIdsFromMonths: SelectIdsFromMonths = (userId: MonthsTable["userId"]) => {
    const sql = `SELECT id FROM months WHERE userId=? ORDER BY month`;
    return new Promise((resolve, reject) => {
        db.all(sql, [userId], (err, rows: {id: MonthsTable["userId"]}[]) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

// needed for creation
interface SelectIdsFromWeeks {
    (monthIdsArr: MonthsTable["id"][]): Promise<{id: WeeksTable["id"]}[]>
}
const selectIdsFromWeeks: SelectIdsFromWeeks = (monthIdsArr) => {
    return new Promise((resolve, reject) => {
        if (!monthIdsArr.every((el) => typeof el === "number")) reject("monthIdsArray must be full of numbers ONLY");
        const qPart = monthIdsArr.join(" OR monthId=");
        const sql = `SELECT id FROM weeks WHERE monthId=${qPart} ORDER BY week`;

        db.all(sql, [], (err, rows: {id: WeeksTable["id"]}[]) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

type SelectRowsWhereUserIdReturnType = {
    month: MonthsTable["month"],
    week: WeeksTable["week"],
    wtype: WeeksTable["type"],
    day: DaysTable["day"],
    dtype: DaysTable["type"],
    message: DaysTable["message"]
}[]

// get all rows from all tables where userId is matching
const selectRowsWhereUserId = (userId: MonthsTable["userId"]): Promise<SelectRowsWhereUserIdReturnType> => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT months.month, weeks.week, weeks.type as wtype, days.day, days.type as dtype, days.message 
        FROM months INNER JOIN weeks ON months.id = weeks.monthId INNER JOIN days ON days.weekId = weeks.id 
        WHERE userId=? 
        ORDER BY months.month, weeks.week, days.day`;
        
        db.all(sql, [userId], (err, rows: SelectRowsWhereUserIdReturnType) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}
// self explanatory
interface UpdateDayParams {
    userId: MonthsTable["userId"]
    month: MonthsTable["month"]
    day: DaysTable["day"]
    type: DaysTable["type"]
    message: DaysTable["message"]
}
const updateDay = ({userId, month, day, type, message}: UpdateDayParams): Promise<number> => {
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
interface UpdateWeekTypeParams {
    userId: MonthsTable["userId"]
    week: WeeksTable["week"]
    type: WeeksTable["type"]
} 
const updateWeekType = ({userId, week, type}: UpdateWeekTypeParams): Promise<number> => {
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
type SelectFromMonthWhereUserIdReturnType = {
    id: MonthsTable["id"]
    userId: MonthsTable["userId"]
    month: MonthsTable["month"]
} | undefined
const selectFromMonthWhereUserId = (userId: MonthsTable["userId"]): Promise<SelectFromMonthWhereUserIdReturnType> => {
    const sql = `SELECT * FROM months WHERE userId=? LIMIT 1`;

    return new Promise((resolve, reject) => {
        db.get(sql, [userId], function(err, row: SelectFromMonthWhereUserIdReturnType) {
            if (err) reject(err)
            else resolve(row)
        })
    })
}
// delete everything related to userId
const deleteFromMonthsWhereUserId = (userId: MonthsTable["userId"]): Promise<number> => {
    const sql = `DELETE FROM months WHERE userId=?`

    return new Promise((resolve, reject) => {
        db.run(sql, [userId], function(err) {
            if (err) reject(err)
            else resolve(this.changes)
        })
    })
}
type SelectWeeksAndWeekTypesForUserIdReturnType = {
    week: WeeksTable["week"],
    type: WeeksTable["type"]
}[]
const selectWeeksAndWeekTypesForUserId = (userId: MonthsTable["userId"]): Promise<SelectWeeksAndWeekTypesForUserIdReturnType> => {
    const sql = "SELECT DISTINCT weeks.week, weeks.type FROM weeks INNER JOIN months ON weeks.monthId = months.id WHERE userId=?"

    return new Promise((resolve, reject) => {
        db.all(sql, [userId], function(err, rows: SelectWeeksAndWeekTypesForUserIdReturnType) {
            if (err) reject(err)
            else resolve(rows)
        })
    })
}

const selectMonthForUserId = (userId: MonthsTable["userId"]): Promise<{month: MonthsTable["month"]} | undefined> => {
    const sql = `SELECT month FROM months WHERE userId=? ORDER BY month LIMIT 1`;
    return new Promise((resolve, reject) => {
        db.get(sql, [userId], (err, row: {month: MonthsTable["month"]} | undefined) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

/* -------------------------------------------------------
####################### Middleware #######################
------------------------------------------------------- */
type GeneratedData = {
    month: MonthsTable["month"],
    weeks: {
        week: WeeksTable["week"],
        type: WeeksTable["type"],
        days: {
            day: DaysTable["day"],
            type: DaysTable["type"],
            message: DaysTable["message"]
        }[]
    }[]
}[]


const createDatesObject = (dateStart: Date, dateEnd: Date): GeneratedData => {
    interface CreateMonthObject {
        (date: Date, widx: number): [GeneratedData[0]["weeks"], number]
    } 
    const createMonthObject: CreateMonthObject = (date, widx) => {
        const workingMonth = new Date(date).getMonth();
        // shitft date to monday of first day of the month
        date = new Date(date.setDate(date.getDate() - date.getDate() + 1));
        if (date.getDay() === 0) date.setDate(date.getDate() - 6);
        else date.setDate(date.getDate() - date.getDay() +  1);
        
        let weeks: GeneratedData[0]["weeks"] = [],
            days: GeneratedData[0]["weeks"][0]["days"] = [],
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
    const data: GeneratedData = [];

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

const saveDatesObject = (req: Request, res: Response, next: NextFunction) => {
    let dateStart = req.body.dateStart;
    let dateEnd = req.body.dateEnd;

    // check if date is valid
    if (isNaN(Date.parse(dateStart))) return res.status(400).json({message: "Invalid dateStart", errors: ["Invalid dateStart"]});
    if (isNaN(Date.parse(dateEnd))) return res.status(400).json({message: "Invalid dateEnd", errors: ["Invalid dateEnd"]});

    dateStart = new Date(dateStart);
    dateEnd = new Date(dateEnd);

    if (dateStart - dateEnd > 0) return res.status(400).json({message: "dateStart dateEnd mismatch", errors: ["dateStart dateEnd mismatch"]});
    if ((dateEnd - dateStart)/(1000*60*60*24) > 300) return res.status(400).json({message: "Difference between dates must not exceed 300 days", errors: ["Difference between dates must not exceed 300 days"]});
    
    const userId: number = res.locals.userId;
    
    const data: GeneratedData = createDatesObject(dateStart, dateEnd);

    const createMonths = () => {
        const monthValues: [MonthsTable["userId"], MonthsTable["month"]][] = data.map((month) => {
            return [userId, month.month]
        })

        return bulkInsertMonths(monthValues)
    }
    
    createMonths()
    .then(() => selectIdsFromMonths(userId))
    .then((monthIds) => { // create weeks
        if (!monthIds.length) throw new Error("There was a problem with selectIdsFromMonths()")
        let weekValues = data.map((month, idx) => {
            const weeks: BulkInsertWeeksVals = month.weeks.map((week) => {
                return [monthIds[idx].id, week.week, week.type]
            })
            return weeks
        })
        const vals = ([] as BulkInsertWeeksVals).concat(...weekValues)

        return bulkInsertWeeks(vals, monthIds)
    }).then((monthIds) => { // get week ids
        const arrayOfMonthIds = monthIds.map((monthIdObject) => monthIdObject.id)

        return selectIdsFromWeeks(arrayOfMonthIds)
    }).then((weekIds) => {
        let idxCounter = 0
        const daysValues: BulkInsertDaysVals[] = data.map((month) => {
            const weeks: BulkInsertDaysVals[] = month.weeks.map((week) => {
                const days: BulkInsertDaysVals = week.days.map((day) => {
                    return [weekIds[idxCounter].id, day.day, day.type, day.message]
                })
                idxCounter += 1
                return days
            })
            return ([] as BulkInsertDaysVals).concat(...weeks)
        })
        const vals = ([] as BulkInsertDaysVals).concat(...daysValues)
        return bulkInsertDays(vals)
    }).then(() => {
        return next();
    })
    .catch((err) => {
        return serverErrorHandler(err, res);
    })
}

// default handler for unhandled server errors
const serverErrorHandler = (err: Error, res: Response) => {
    console.warn(err);
    return res.status(500).json({message: "An internal server error occured", errors: ["An internal server error occured"]})
}
// call next if rows === undefined for userId
const constructorForUserNotPresent = (req: Request, res: Response, next: NextFunction) => {
    console.log(res.locals.userId)
    selectFromMonthWhereUserId(res.locals.userId)
        .then((row) => {
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
const responseToValidation = (req: Request, res: Response, next: NextFunction) => {
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

router.post('/', verifyToken, constructorForUserNotPresent, saveDatesObject, (req: Request, res: Response) => {
    res.status(201).json({
        message: "Your schedule has been successuflly created"
    })
})

router.get('/', verifyToken, (req: Request, res: Response) => {
    selectRowsWhereUserId(res.locals.userId)
        .then((rows) => {
            if (rows.length === 0 || rows === undefined) return res.status(400).json({message: "You need to post date start and date end first", errors: ["You need to post date start and date end first"]})
            
            interface Data {
                translations: any, // hard coded anyways and unknown type doesnt fit
                dates: GeneratedData
            }

            const data: Data = {
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
    Promise.all([
        selectWeeksAndWeekTypesForUserId(res.locals.userId), 
        selectMonthForUserId(res.locals.userId)
    ])
    .then((result) => {
        return res.status(200).json({message: "Selected rows successfully", firstMonth: result[1], data: result[0]})
    })
    .catch((err) => {
        return serverErrorHandler(err, res)
    })
})

router.patch('/day', verifyToken, validationChain, responseToValidation, (req: Request, res: Response) => {
    updateDay({userId: res.locals.userId, month: req.body.month, day: req.body.day, type: req.body.type, message: req.body.message})
        .then((changes) => {
            if (changes === 0) return res.status(404).json({message: "Did not found any rows related to values provided, nothing was edited"});
            else return res.status(200).json({message: "Edited all rows related to values provided"});
        })
        .catch((err) => {
            return serverErrorHandler(err, res);
        });
})

router.patch('/week', verifyToken, validationChain2, responseToValidation, (req: Request, res: Response) => {
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
    deleteFromMonthsWhereUserId(res.locals.userId)
        .then((changes) => {
            if (changes === 0) return res.status(200).json({message: "Did not found any rows related to your user id, nothing was deleted"});
            else return res.status(200).json({message: "Removed all rows related to your user id"});
        })
        .catch((err) => {
            return serverErrorHandler(err, res);
        });
})

export {router as calendarRouter}
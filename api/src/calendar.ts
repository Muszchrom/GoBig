import express, { Request, Response, NextFunction } from "express";
import { body, validationResult } from 'express-validator';
import { verifyToken } from "./auth";
import { 
    calendarTable, 
    MonthsTable, 
    WeeksTable, 
    DaysTable, 
    calendarDb_BulkInsertWeeksVals, 
    calendarDb_BulkInsertDaysVals
} from "./db";
import { serverErrorHandler } from './commonResponse';

const router = express.Router();

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

        return calendarTable.bulkInsertMonths(monthValues)
    }
    
    createMonths()
    .then(() => calendarTable.selectIdsFromMonths(userId))
    .then((monthIds) => { // create weeks
        if (!monthIds.length) throw new Error("There was a problem with selectIdsFromMonths()")
        let weekValues = data.map((month, idx) => {
            const weeks: calendarDb_BulkInsertWeeksVals = month.weeks.map((week) => {
                return [monthIds[idx].id, week.week, week.type]
            })
            return weeks
        })
        const vals = ([] as calendarDb_BulkInsertWeeksVals).concat(...weekValues)

        return calendarTable.bulkInsertWeeks(vals, monthIds)
    }).then((monthIds) => { // get week ids
        const arrayOfMonthIds = monthIds.map((monthIdObject) => monthIdObject.id)

        return calendarTable.selectIdsFromWeeks(arrayOfMonthIds)
    }).then((weekIds) => {
        let idxCounter = 0
        const daysValues: calendarDb_BulkInsertDaysVals[] = data.map((month) => {
            const weeks: calendarDb_BulkInsertDaysVals[] = month.weeks.map((week) => {
                const days: calendarDb_BulkInsertDaysVals = week.days.map((day) => {
                    return [weekIds[idxCounter].id, day.day, day.type, day.message]
                })
                idxCounter += 1
                return days
            })
            return ([] as calendarDb_BulkInsertDaysVals).concat(...weeks)
        })
        const vals = ([] as calendarDb_BulkInsertDaysVals).concat(...daysValues)
        return calendarTable.bulkInsertDays(vals)
    }).then(() => {
        return next();
    })
    .catch((err) => {
        serverErrorHandler(err, res, "middleware saveDatesObject(), createMonths(), catch block");
    })
}

// call next if rows === undefined for userId
const constructorForUserNotPresent = (req: Request, res: Response, next: NextFunction) => {
    console.log(res.locals.userId)
    calendarTable.selectFromMonthWhereUserId(res.locals.userId)
        .then((row) => {
            if (row === undefined) next()
            else return res.status(400).json({message: "Constructor is already created", errors: ["Constructor is already created"]});
        })
        .catch((err) => {
            serverErrorHandler(err, res, "middleware constructorForUserNotPresent(), calendarTable.selectFromMonthWhereUserId(), catch block");
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
    calendarTable.selectRowsWhereUserId(res.locals.userId)
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
        serverErrorHandler(err, res, "router.get('/', ... ), calendarTable.selectRowsWhereUserId(), catch block");
    })
})

router.get('/weeks', verifyToken, (req, res) => {
    Promise.all([
        calendarTable.selectWeeksAndWeekTypesForUserId(res.locals.userId), 
        calendarTable.selectMonthForUserId(res.locals.userId)
    ])
    .then((result) => {
        res.status(200).json({message: "Selected rows successfully", firstMonth: result[1], data: result[0]})
    })
    .catch((err) => {
        serverErrorHandler(err, res, "router.get('/weeks', ... ), Promise.all(), catch block")
    })
})

router.patch('/day', verifyToken, validationChain, responseToValidation, (req: Request, res: Response) => {
    calendarTable.updateDay({userId: res.locals.userId, month: req.body.month, day: req.body.day, type: req.body.type, message: req.body.message})
        .then((changes) => {
            if (changes === 0) res.status(404).json({message: "Did not found any rows related to values provided, nothing was edited"});
            else res.status(200).json({message: "Edited all rows related to values provided"});
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.patch('/day', ... ), calendarTable.updateDay(), catch block")
        });
})

router.patch('/week', verifyToken, validationChain2, responseToValidation, (req: Request, res: Response) => {
    calendarTable.updateWeekType({userId: res.locals.userId, week: req.body.week, type: req.body.type})
        .then((changes) => {
            if (changes === 0) res.status(404).json({message: "Did not found any rows related to values provided, nothing was edited"});
            else res.status(200).json({message: "Edited all rows related to values provided"});
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.patch('/week', ... ), calendarTable.updateWeekType(), catch block")
        });
})

router.delete('/', verifyToken, (req, res) => {
    calendarTable.deleteFromMonthsWhereUserId(res.locals.userId)
        .then((changes) => {
            if (changes === 0) res.status(200).json({message: "Did not found any rows related to your user id, nothing was deleted"});
            else res.status(200).json({message: "Removed all rows related to your user id"});
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.delete('/week', ... ), calendarTable.deleteFromMonthsWhereUserId(), catch block")
        });
})

export {router as calendarRouter}
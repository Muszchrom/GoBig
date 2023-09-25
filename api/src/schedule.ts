import express, { NextFunction, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { scheduleTable, ScheduleTable } from './db';
import { serverErrorHandler } from './commonResponse';
import { validateWritePermissions } from './groups';
const router = express.Router();

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
const validateSubject = (req: Request, res: Response, next: NextFunction) => {
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
const validateUpdateArray = (req: Request, res: Response, next: NextFunction) => {
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
const validateId = (req: Request, res: Response, next: NextFunction) => {
    if (isNaN(parseInt(req.body.id)) || req.body.id != parseInt(req.body.id)) {
        return res.status(400).json({
            message: "Inavild id", 
            errors: ["Inavild id"]})
    }
    return next();
}

// Call next() if validation turns out successfull, Use after validateUpdateArray()!
const validateUpdate = async (req: Request, res: Response, next: NextFunction) => {
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

router.get('/', (req: Request, res: Response) => {
    scheduleTable.getSchedule(res.locals.groupId)
        .then((rows) => {
            res.status(200).json({message: "Rows selected successfully!", rows: rows})
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.get('/', ... ) catch block")
        })
})

// Get schedule for given day
router.get('/:day', (req: Request, res: Response) => {
    const day = parseInt(req.params.day);
    if (isNaN(day)) return res.status(400).json({message: "Day is not a valid number or was not provided", erros: ["Day is not a valid number or was not provided"]})
    
    if (day < 0 || day > 6) {
        return res.status(400).json({
            message: "Day should be an integer greater or equal than 0 and less or equal than 6", 
            errors: ["Day should be an integer greater or equal than 0 and less or equal than 6"]
        });
    }
    scheduleTable.getSubjectsByDay(day, res.locals.groupId)
        .then((rows) => {
            res.status(200).json({message: "Rows selected successfully!", rows: rows});
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.get('/:day', ... ), scheduleTable.getSubjectsByDay(...), catch block")
        })
})

// Create new schedule row
router.post('/', validateWritePermissions, validationChain, validateSubject, (req: Request, res: Response) => {
    const vals: Omit<ScheduleTable, "id"> = {
        day: req.body.day, 
        start: req.body.start, 
        end: req.body.end, 
        subjectName: req.body.subjectName, 
        subjectType: req.body.subjectType, 
        hall: req.body.hall, 
        teacher: req.body.teacher, 
        icon: req.body.icon, 
        additionalInfo: req.body.additionalInfo, 
        weekStart: req.body.weekStart, 
        weekEnd: req.body.weekEnd, 
        weekType: req.body.weekType,
        userId: res.locals.groupId
    }

    // check if subject exists (need that to retrieve id later on)
    scheduleTable.getSubjectsByData(vals)
        .then((rows) => {
            if (rows.length) {
                throw new Error("subject_exists")
            } else {
                return scheduleTable.createSubject(vals)
            }
        })
        .then((result) => {
            if (result) {
                return scheduleTable.getSubjectsByData(vals)
            } else {
                throw new Error("Unable to save user in database")
            }
        })
        .then((rows) => {
            if (rows.length) {
                res.status(201).json({message: "Subject successfully created", row: rows})
            } else {
                throw new Error("Unable to find just created subject in the database")
            }
        })
        .catch((err) => {
            if (err.message === "subject_exists") {
                res.status(400).json({message: "This subject already exists", errors: ["This subject already exists"]})
            } else {
                serverErrorHandler(err, res, "router.post('/', ... ), scheduleTable.getSubjectsByData(...), catch block")
            }
        })
});

// Update schedule row
router.patch('/', validateWritePermissions, validateId, validateUpdateArray, validateUpdate, (req, res) => {
    let queryFields = '';
    let values = [];

    // hope i sanitized this array enough
    for (let i=0; i<req.body.updateArray.length; i++) {
        queryFields += `${req.body.updateArray[i]}=?, `;
        values.push(req.body[req.body.updateArray[i]]);
    }
    
    // add userId => should use groupId from now
    queryFields += `userId=?, `;
    values.push(res.locals.groupId);

    queryFields = queryFields.slice(0, -2);

    scheduleTable.updateSubject(req.body.id, queryFields, values)
        .then((result) => {
            if (result) {
                res.status(200).json({message: "Subject updated successfully"});
            } else {
                res.status(400).json({message: "Unable to update subject", errors: ["id provided didnt match any records"]});
            }
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.patch('/', ... ), scheduleTable.updateSubject(...), catch block")
        })
})

// Delete schedule row
router.delete('/', validateWritePermissions, validateId, (req, res) => {
    scheduleTable.deleteSubject(req.body.id, res.locals.groupId)
        .then((result) => {
            if (result) {
                res.status(200).json({message: "Subject deleted successfully"});
            } else {
                res.status(400).json({message: "Unable to update subject", errors: ["id provided didnt match any records"]});
            }
        })
        .catch((err) => {
            serverErrorHandler(err, res, "router.delete('/', ... ), scheduleTable.deleteSubject(...), catch block")
        });
});

export {router as scheduleRouter}
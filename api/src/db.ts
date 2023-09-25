import sqlite from 'sqlite3';
const sqlite3 = sqlite.verbose()

/* -------------------------------------------------------
####################### Database initialization ##########
------------------------------------------------------- */

const db = new sqlite3.Database('./database/database.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.warn(err)
        throw new Error("An error occured while opening database. const db = sqlite3.Database(...)")
    } else {
        dbPRAGMA()        
    }
});

const dbPRAGMA = (dbInstance: sqlite.Database=db) => {
    dbInstance.run(`PRAGMA foreign_keys = ON`, (err) => {
        if (err) {
            console.warn(err)
            throw new Error("An error occured while opening database. const db = sqlite3.Database(...)")
        } else {
            dbInitializer()
        }
    })
}

const dbInitializer = (dbInstance: sqlite.Database=db) => {
    const dbInitializerCb = (err: Error | null, place: string) => {
        if (err) {
            console.warn(err)
            throw new Error(`An error occured during ${place.toUpperCase()} table creation at dbInitializer()`)
            } else {
                console.log(`${place.toUpperCase()} table creation: OK`)
            }
    }
    dbInstance.run(`CREATE TABLE IF NOT EXISTS notes(
        id INTEGER PRIMARY KEY, 
        userId INTEGER NOT NULL, 
        note TEXT
    )`, (err) => dbInitializerCb(err, "notes"))

    dbInstance.run(`CREATE TABLE IF NOT EXISTS files(
        id INTEGER PRIMARY KEY, 
        userId INTEGER NOT NULL, 
        filename TEXT NOT NULL
    )`, (err) => dbInitializerCb(err, "files"))

    dbInstance.run(`CREATE TABLE IF NOT EXISTS users(
        id INTEGER PRIMARY KEY, 
        username TEXT NOT NULL, 
        password TEXT NOT NULL 
    )`, (err) => dbInitializerCb(err, "users"));

    dbInstance.run(`CREATE TABLE IF NOT EXISTS groups(
        id INTEGER PRIMARY KEY, 
        owner INTEGER NOT NULL, 
        name TEXT NOT NULL 
    )`, (err) => dbInitializerCb(err, "groups"));

    dbInstance.run(`CREATE TABLE IF NOT EXISTS groupUsers(
        groupId INTEGER NOT NULL, 
        userId INTEGER NOT NULL, 
        userPrivileges INTEGER NOT NULL,
        isMainGroup INTEGER NOT NULL,
        FOREIGN KEY(groupId) REFERENCES groups(id) ON DELETE CASCADE
    )`, (err) => dbInitializerCb(err, "groupUsers"));

    dbInstance.run(`CREATE TABLE IF NOT EXISTS schedule(
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
        weekType INTEGER NOT NULL,
        userId INTEGER NOT NULL
    )`, (err) => dbInitializerCb(err, "schedule"));

    dbInstance.run(`CREATE TABLE IF NOT EXISTS months(
        id INTEGER,
        userId INTEGER NOT NULL,
        month INTEGER NOT NULL,
        PRIMARY KEY(id),
        UNIQUE(userId, month)
    )`, (err) => dbInitializerCb(err, "months"));

    dbInstance.run(`CREATE TABLE IF NOT EXISTS weeks(
        monthId INTEGER NOT NULL,
        id INTEGER,
        week INTEGER NOT NULL,
        type INTEGER NOT NULL,
        PRIMARY KEY(id),
        UNIQUE(monthId, week),
        FOREIGN KEY(monthId) REFERENCES months(id) ON DELETE CASCADE
    )`, (err) => dbInitializerCb(err, "weeks"));

    dbInstance.run(`CREATE TABLE IF NOT EXISTS days(
        weekId INTEGER NOT NULL,
        id INTEGER,
        day INTEGER NOT NULL,
        type INTEGER NOT NULL,
        message TEXT,
        PRIMARY KEY(id),
        UNIQUE(id, day),
        FOREIGN KEY(weekId) REFERENCES weeks(id) ON DELETE CASCADE
    )`, (err) => dbInitializerCb(err, "days"));
}

/* -------------------------------------------------------
####################### Groups db queries ################
------------------------------------------------------- */
/**
 * If group exist then "group_exists" error is thrown
 */
// initial group createion, during signup process
const groupsDb_initializeGroup = (userId: GroupsTable["owner"], groupName: GroupsTable["name"]): Promise<true> => {    
    const createGroup = (userId: GroupsTable["owner"], groupName: GroupsTable["name"]): Promise<true> => {
        return new Promise((resolve, reject) => {
            const sql = `INSERT INTO groups(owner, name) VALUES (?, ?)`
            db.run(sql, [userId, groupName], (err) => {
                if (err) reject(err)
                else resolve(true)
            })
        })
    }

    const insertUserIntoGroup = (
            groupId: GroupUsersTable["groupId"], 
            userId: GroupUsersTable["userId"], 
            privileges: GroupUsersTable["userPrivileges"], 
            isMainGroup: GroupUsersTable["isMainGroup"]
        ): Promise<true> => {
            return new Promise((resolve, reject) => {
                const sql = `INSERT INTO groupUsers(groupId, userId, userPrivileges, isMainGroup) VALUES (?, ?, ?, ?)`
                db.run(sql, [groupId, userId, privileges, isMainGroup], (err) => {
                    if (err) reject(err)
                    else resolve(true)
                })
            })
    }

    return new Promise((resolve, reject) => {
        groupsDb_getId(userId, groupName)
            .then((row) => {
                if (row) throw new Error("group_exists")
                else return createGroup(userId, groupName)
            })
            .then(() => groupsDb_getId(userId, groupName))
            .then((idObject) => {
                if (!idObject) throw new Error("groupsDb_initializeGroup() in groupsDb_getId() then() chain: didnt get id from createGroup()")
                else return insertUserIntoGroup(idObject.id, userId, 0, 1)
            })
            .then(() => resolve(true))
            .catch((err) => reject(err))
    })
}
// get id based on your users id and groups name
const groupsDb_getId = (userId: GroupsTable["owner"], groupName: GroupsTable["name"]): Promise<{id: GroupsTable["id"]} | undefined> => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT id FROM groups WHERE owner=? AND name=?`
        db.get(sql, [userId, groupName], (err, row: {id: GroupsTable["id"]} | undefined) => {
            if (err) reject(err)
            else resolve(row)
        })
    })
}

const groupUsersDb_getPrivileges = (groupId: GroupUsersTable["groupId"], userId: GroupUsersTable["userId"]): Promise<{userPrivileges: GroupUsersTable["userPrivileges"]} | undefined> => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT userPrivileges FROM groupUsers WHERE groupId=? AND userId=?`
        db.get(sql, [groupId, userId], (err, row: {userPrivileges: GroupUsersTable["userPrivileges"]} | undefined) => {
            if (err) reject(err)
            else resolve(row)
        })
    })
}

const groupUsersDb_getMainGroupId = (userId: GroupUsersTable["userId"]): Promise<{groupId: GroupUsersTable["groupId"]} | undefined> => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT groupId FROM groupUsers WHERE userId=? AND isMainGroup=?`
        db.get(sql, [userId, 1], (err, row: {groupId: GroupUsersTable["groupId"]} | undefined) => {
            if (err) reject(err)
            else resolve(row)
        })
    })
}

const groupUsersDb_getGroups = (userId: GroupUsersTable["userId"]): Promise<{name: GroupsTable["name"], userPrivileges: GroupUsersTable["userPrivileges"], isMainGroup: GroupUsersTable["isMainGroup"]}[]> => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT groups.name, groupUsers.userPrivileges, groupUsers.isMainGroup 
                    FROM groups 
                    INNER JOIN groupUsers 
                    ON groups.id=groupUsers.groupId 
                    WHERE userId=?`
        
        db.all(sql, [userId], (err, rows: {name: GroupsTable["name"], userPrivileges: GroupUsersTable["userPrivileges"], isMainGroup: GroupUsersTable["isMainGroup"]}[]) => {
            if (err) reject(err)
            else resolve(rows)
        })
    })
}

export interface GroupsTable {
    id: number,
    owner: number,
    name: string
} 
/**
 * @field userPrivileges: 0 - Owner, 1 - Read/Write, 2 - Read
 * @field isMainGroup: 0 - false, 1 - true
 */
export interface GroupUsersTable {
    groupId: GroupsTable["id"],
    userId: GroupsTable["owner"],
    userPrivileges: 0 | 1 | 2,
    isMainGroup: 0 | 1
} 
export const groupsTable = {
    initGroup: groupsDb_initializeGroup,
    getPrivileges: groupUsersDb_getPrivileges,
    getMainGroupId: groupUsersDb_getMainGroupId,
    getGroups: groupUsersDb_getGroups
}
/* -------------------------------------------------------
####################### Auth db queries ##################
------------------------------------------------------- */

const authDb_createUser = (username: string, hash: string): Promise<true> => {
    const sql = `INSERT INTO users(username, password) VALUES (?, ?)`;

    return new Promise((resolve, reject) => {
        db.run(sql, [username, hash], (err) => {
            if (err) {
                reject(err);
                return;
            }   
            resolve(true);
        });
    });
}
const authDb_getUserByUsername = (username: string): Promise<UsersTable> => {
    const sql = `SELECT * FROM users WHERE username = ?`;

    return new Promise((resolve, reject) => {
        db.get(sql, username, (err, row: UsersTable) => {
            if (err) {
                reject(err);
                return;
            }
            resolve(row);
        })
    })
}
const authDb_deleteUser = (userId: string | number, username: string, hash: string): Promise<true> => {
    const sql = `DELETE FROM users WHERE id = ? AND username = ? AND password = ?`;

    return new Promise((resolve, reject) => {
        db.run(sql, [userId, username, hash], (err) => {
            if (err) {
                reject(err);
                return;
            }   
            resolve(true);
        });
    });
}
const authDb_getFiveUsernames = (username: string): Promise<{username: string}[]> => {
    const sql = `SELECT username FROM users WHERE username LIKE ? LIMIT 5`
    return new Promise((resolve, reject) => {
        db.all(sql, [`%${username}%`], (err, rows: {username: string}[]) => {
            if (err) reject(err)
            resolve(rows)
        })
    })
}

export interface UsersTable {
    id: number,
    username: string,
    password: string
}

export const usersTable = {
    createUser: authDb_createUser,
    getUserByUsername: authDb_getUserByUsername,
    deleteUser: authDb_deleteUser,
    getFiveUsernames: authDb_getFiveUsernames
}

/* -------------------------------------------------------
####################### Schedule db queries ##############
------------------------------------------------------- */

const scheduleDb_createSubject = (vals: Omit<ScheduleTable, "id">): Promise<true> => {
    const valuesArray = Object.keys(vals).map((k) => vals[k as keyof Omit<ScheduleTable, "id">])
    const sql = `INSERT INTO schedule(day, start, end, subjectName, subjectType, hall, teacher, icon, additionalInfo, weekStart, weekEnd, weekType, userId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    return new Promise((resolve, reject) => {
        db.run(sql, valuesArray, (err) => {
            if (err) reject(err);
            resolve(true);
        })
    });
}

const scheduleDb_getSubjectsByData = (vals: Omit<ScheduleTable, "id">): Promise<ScheduleTable[]> => {
    const valuesArray = Object.keys(vals).map((k) => vals[k as keyof Omit<ScheduleTable, "id">])
    const sql = `SELECT * FROM schedule WHERE day=? AND start=? AND end=? AND subjectName=? AND subjectType=? AND hall=? AND teacher=? AND icon=? AND additionalInfo=? AND weekStart=? AND weekEnd=? AND weekType=? AND userId=?`

    return new Promise((resolve, reject) => {
        db.all(sql, valuesArray, (err, rows: ScheduleTable[]) => {
            if (err) reject(err);
            resolve(rows);
        })
    });
}

const scheduleDb_getSubjectsByDay = (day: ScheduleTable["day"], userId: ScheduleTable["userId"]): Promise<ScheduleTable[]> => {
    const sql = `SELECT * FROM schedule WHERE day=? AND userId=? ORDER BY start`

    return new Promise((resolve, reject) => {
        db.all(sql, [day, userId], (err, rows: ScheduleTable[]) => {
            if (err) reject(err);
            resolve(rows);
        })
    });
}

const scheduleDb_getSchedule = (userId: ScheduleTable["userId"]): Promise<ScheduleTable[]> => {
    const sql = `SELECT * FROM schedule WHERE userId=? ORDER BY day, start`

    return new Promise((resolve, reject) => {
        db.all(sql, userId, (err, rows: ScheduleTable[]) => {
            if (err) reject(err)
            resolve(rows);
        })
    })
}

const scheduleDb_updateSubject = (id: ScheduleTable["id"], queryFields: string, values: (number | string | undefined)[]): Promise<number> => {
    const sql = `UPDATE schedule SET ${queryFields} WHERE id=?`
    values.push(id);

    return new Promise((resolve, reject) => {
        db.run(sql, values, function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        });
    });
}

const scheduleDb_deleteSubject = (id: ScheduleTable["id"], userId: ScheduleTable["userId"]): Promise<number> => {
    const sql = `DELETE FROM schedule WHERE id=? AND userId=?`

    return new Promise((resolve, reject) => {
        db.run(sql, [id, userId], function (err) {
            if (err) {
                reject(err);
                return;
            }
            resolve(this.changes);
        })
    });
}

export interface ScheduleTable {
    id: number,
    day: number,
    start: string,
    end: string,
    subjectName: string,
    subjectType: string,
    hall: string,
    teacher: string,
    icon: string,
    additionalInfo: string | undefined,
    weekStart: number,
    weekEnd: number,
    weekType: number,
    userId: number
}

export const scheduleTable = {
    createSubject: scheduleDb_createSubject,
    getSubjectsByData: scheduleDb_getSubjectsByData,
    getSubjectsByDay: scheduleDb_getSubjectsByDay,
    getSchedule: scheduleDb_getSchedule,
    updateSubject: scheduleDb_updateSubject,
    deleteSubject: scheduleDb_deleteSubject
}

/* -------------------------------------------------------
####################### Calendar db queries ##############
------------------------------------------------------- */

const calendarDb_bulkInsertMonths = (vals: [MonthsTable["userId"], MonthsTable["month"]][]): Promise<true>  => {
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

export type calendarDb_BulkInsertWeeksVals = [
    WeeksTable["monthId"], 
    WeeksTable["week"], 
    WeeksTable["type"]
][]
interface calendarDb_BulkInsertWeeks {
    (vals: calendarDb_BulkInsertWeeksVals, monthIds: {id: MonthsTable["userId"]}[]): Promise<{id: MonthsTable["userId"]}[]> 
}
const calendarDb_bulkInsertWeeks: calendarDb_BulkInsertWeeks = (vals, monthIds) => {
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

export type calendarDb_BulkInsertDaysVals = [
    DaysTable["weekId"],
    DaysTable["day"],
    DaysTable["type"],
    DaysTable["message"]
][]
interface calendarDb_BulkInsertDays {
    (vals: calendarDb_BulkInsertDaysVals): Promise<true>
} 
const calendarDb_bulkInsertDays: calendarDb_BulkInsertDays = (vals) => {
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

interface calendarDb_SelectIdsFromMonths {
    (userId: MonthsTable["userId"]): Promise<{id: MonthsTable["userId"]}[]>
}
const calendarDb_selectIdsFromMonths: calendarDb_SelectIdsFromMonths = (userId: MonthsTable["userId"]) => {
    const sql = `SELECT id FROM months WHERE userId=? ORDER BY month`;
    return new Promise((resolve, reject) => {
        db.all(sql, [userId], (err, rows: {id: MonthsTable["userId"]}[]) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

interface calendarDb_SelectIdsFromWeeks {
    (monthIdsArr: MonthsTable["id"][]): Promise<{id: WeeksTable["id"]}[]>
}
const calendarDb_selectIdsFromWeeks: calendarDb_SelectIdsFromWeeks = (monthIdsArr) => {
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

type calendarDb_SelectRowsWhereUserIdReturnType = {
    month: MonthsTable["month"],
    week: WeeksTable["week"],
    wtype: WeeksTable["type"],
    day: DaysTable["day"],
    dtype: DaysTable["type"],
    message: DaysTable["message"]
}[]
const calendarDb_selectRowsWhereUserId = (userId: MonthsTable["userId"]): Promise<calendarDb_SelectRowsWhereUserIdReturnType> => {
    return new Promise((resolve, reject) => {
        const sql = `SELECT months.month, weeks.week, weeks.type as wtype, days.day, days.type as dtype, days.message 
        FROM months INNER JOIN weeks ON months.id = weeks.monthId INNER JOIN days ON days.weekId = weeks.id 
        WHERE userId=? 
        ORDER BY months.month, weeks.week, days.day`;
        
        db.all(sql, [userId], (err, rows: calendarDb_SelectRowsWhereUserIdReturnType) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

interface calendarDb_UpdateDayParams {
    userId: MonthsTable["userId"]
    month: MonthsTable["month"]
    day: DaysTable["day"]
    type: DaysTable["type"]
    message: DaysTable["message"]
}
const calendarDb_updateDay = ({userId, month, day, type, message}: calendarDb_UpdateDayParams): Promise<number> => {
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

interface calendarDb_UpdateWeekTypeParams {
    userId: MonthsTable["userId"]
    week: WeeksTable["week"]
    type: WeeksTable["type"]
} 
const calendarDb_updateWeekType = ({userId, week, type}: calendarDb_UpdateWeekTypeParams): Promise<number> => {
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

type calendarDb_SelectFromMonthWhereUserIdReturnType = {
    id: MonthsTable["id"]
    userId: MonthsTable["userId"]
    month: MonthsTable["month"]
} | undefined
const calendarDb_selectFromMonthWhereUserId = (userId: MonthsTable["userId"]): Promise<calendarDb_SelectFromMonthWhereUserIdReturnType> => {
    const sql = `SELECT * FROM months WHERE userId=? LIMIT 1`;

    return new Promise((resolve, reject) => {
        db.get(sql, [userId], function(err, row: calendarDb_SelectFromMonthWhereUserIdReturnType) {
            if (err) reject(err)
            else resolve(row)
        })
    })
}

const calendarDb_deleteFromMonthsWhereUserId = (userId: MonthsTable["userId"]): Promise<number> => {
    const sql = `DELETE FROM months WHERE userId=?`

    return new Promise((resolve, reject) => {
        db.run(sql, [userId], function(err) {
            if (err) reject(err)
            else resolve(this.changes)
        })
    })
}

type calendarDb_SelectWeeksAndWeekTypesForUserIdReturnType = {
    week: WeeksTable["week"],
    type: WeeksTable["type"]
}[]
const calendarDb_selectWeeksAndWeekTypesForUserId = (userId: MonthsTable["userId"]): Promise<calendarDb_SelectWeeksAndWeekTypesForUserIdReturnType> => {
    const sql = "SELECT DISTINCT weeks.week, weeks.type FROM weeks INNER JOIN months ON weeks.monthId = months.id WHERE userId=?"

    return new Promise((resolve, reject) => {
        db.all(sql, [userId], function(err, rows: calendarDb_SelectWeeksAndWeekTypesForUserIdReturnType) {
            if (err) reject(err)
            else resolve(rows)
        })
    })
}

const calendarDb_selectMonthForUserId = (userId: MonthsTable["userId"]): Promise<{month: MonthsTable["month"]} | undefined> => {
    const sql = `SELECT month FROM months WHERE userId=? ORDER BY month LIMIT 1`;
    return new Promise((resolve, reject) => {
        db.get(sql, [userId], (err, row: {month: MonthsTable["month"]} | undefined) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

export interface MonthsTable {
    id: number,
    userId: number,
    month: number,
}

export interface WeeksTable {
    monthId: number,
    id: number,
    week: number,
    type: number
}

export interface DaysTable {
    weekId: number,
    id: number,
    day: number,
    type: number,
    message: string | undefined
}

export const calendarTable = {
    bulkInsertMonths: calendarDb_bulkInsertMonths,
    bulkInsertWeeks: calendarDb_bulkInsertWeeks,
    bulkInsertDays: calendarDb_bulkInsertDays,
    selectIdsFromMonths: calendarDb_selectIdsFromMonths,
    selectIdsFromWeeks: calendarDb_selectIdsFromWeeks,
    selectRowsWhereUserId: calendarDb_selectRowsWhereUserId,
    updateDay: calendarDb_updateDay,
    updateWeekType: calendarDb_updateWeekType,
    selectFromMonthWhereUserId: calendarDb_selectFromMonthWhereUserId,
    deleteFromMonthsWhereUserId: calendarDb_deleteFromMonthsWhereUserId,
    selectWeeksAndWeekTypesForUserId: calendarDb_selectWeeksAndWeekTypesForUserId,
    selectMonthForUserId: calendarDb_selectMonthForUserId
}

/* -------------------------------------------------------
####################### Files db queries #################
------------------------------------------------------- */

interface filesDb_InsertIntoFiles {
    ({userId, filename}: {userId: FilesTable["userId"], filename: FilesTable["filename"]}): Promise<true>
}
const filesDb_insertIntoFiles: filesDb_InsertIntoFiles = ({userId, filename}) => {
    const sql = "INSERT INTO files(userId, filename) VALUES (?, ?)";
    return new Promise((resolve, reject) => {
        db.run(sql, [userId, filename], (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}

interface filesDb_GetFileName {
    (userId: FilesTable["userId"]): Promise<{filename: FilesTable["filename"]} | undefined>
}
const filesDb_getFileName: filesDb_GetFileName = (userId) => {
    const sql = "SELECT filename FROM files WHERE userId=?";
    return new Promise((resolve, reject) => {
        db.get(sql, userId, (err, row: {filename: FilesTable["filename"]} | undefined) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

interface filesDb_DeleteFromFiles {
    (userId: number): Promise<true>
}
const filesDb_deleteFromFiles: filesDb_DeleteFromFiles = (userId) => {
    const sql = "DELETE FROM files WHERE userId=?";
    return new Promise((resolve, reject) => {
        db.run(sql, userId, (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}

export interface FilesTable {
    id: number,
    userId: number,
    filename: string
}

export const filesTable = {
    insertIntoFiles: filesDb_insertIntoFiles,
    getFileName: filesDb_getFileName,
    deleteFromFiles: filesDb_deleteFromFiles
}

/* -------------------------------------------------------
####################### Notes db queries #################
------------------------------------------------------- */

interface notesDb_InsertIntoNotes {
    ({userId, note}: {userId: NotesTable["userId"], note: NotesTable["note"]}): Promise<true>
}
const notesDb_insertIntoNotes: notesDb_InsertIntoNotes = ({userId, note}) => {
    const sql = "INSERT INTO notes(userId, note) VALUES (?, ?)";
    return new Promise((resolve, reject) => {
        db.run(sql, [userId, note], (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}

interface notesDb_GetNote {
    (userId: NotesTable["userId"]): Promise<{id: NotesTable["id"], note: NotesTable["note"]} | undefined>
}
const notesDb_getNote: notesDb_GetNote = (userId) => {
    const sql = "SELECT id, note FROM notes WHERE userId=?";
    return new Promise((resolve, reject) => {
        db.get(sql, userId, (err, row: {id: NotesTable["id"], note: NotesTable["note"]} | undefined) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

interface notesDb_DeleteFromNotes {
    (userId: NotesTable["userId"]): Promise<true>
}
const notesDb_deleteFromNotes: notesDb_DeleteFromNotes = (userId) => {
    const sql = "DELETE FROM notes WHERE userId=?";
    return new Promise((resolve, reject) => {
        db.run(sql, userId, (err) => {
            if (err) reject(err);
            else resolve(true);
        });
    });
}

export interface NotesTable {
    id: number,
    userId: number,
    note: string
}

export const notesTable = {
    insertIntoNotes: notesDb_insertIntoNotes,
    getNote: notesDb_getNote,
    deleteFromNotes: notesDb_deleteFromNotes
}
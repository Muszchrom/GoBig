import {source} from "../source"

const validateUsername = (username: string): boolean => {
    if (username.length < 4 || username.length > 12) return false
    return true
}

const validatePassword = (password: string): boolean => {
    const psswdByteLength = new Blob([password]).size
    if (psswdByteLength < 8 || psswdByteLength > 72) return false
    return (/[a-z]/.test(password) && /[A-Z]/.test(password))
}

// 
const unexpectedAppOrServerError = (status: number): string[] => { 
    return [`An unexpected error occured. Status code: ${status}`]
}

export interface Schedule {
    rows: {
        id: number,
        day: number,
        start: string,
        end: string,
        subjectName: string,
        subjectType: string,
        hall: string,
        teacher: string,
        icon: string,
        additionalInfo: string,
        weekStart: number,
        weekEnd: number,
        weekType: number,
        userId: number
    }[]
}

export interface Weeks {
    firstMonth: {
        month: number
    }, 
    data: {
        week: number, 
        type: number
    }[]
}

interface Options {
    endpoint: string, 
    method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE", 
    headers?: {[key: string]: string} | undefined, 
    credentials?: RequestCredentials | undefined,
    data?: any
}

const callApi = async ({
    endpoint, 
    method="GET", 
    headers={"Content-Type": "application/json"}, 
    credentials="include", 
    data}: Options): Promise<{status: number, data: any, errors: string[]}> => {

        const fetchedData = await fetch(`${source}${endpoint}`, {
            method: method,
            headers: headers,
            credentials: credentials,
            body: JSON.stringify(data)
        })
        
        const dataJson = await fetchedData.json()

        return {
            status: fetchedData.status,
            data: dataJson,
            errors: dataJson.errors
        }
}

export const uploadImage = async (formData: FormData) => {
    const fetchedData = await fetch(`${source}/files`, {
        method: "POST",
        credentials: "include",
        body: formData
    })
    return fetchedData
}

export const getImage = async () => {
    const fetchedData = await fetch(`${source}/files`, {
        method: "GET",
        credentials: "include",
    })
    return fetchedData
}

export const isTokenValid = async (): Promise<boolean> => {
    const data = await callApi({endpoint: "/auth/protected", headers: undefined})
    return data.status === 200
}

export const signIn = async (username: string, password: string): Promise<string[]> => {
    const errors = []
    if (!validateUsername(username)) errors.push("Invalid username")
    if (!validatePassword(password)) errors.push("Invalid password")

    if (errors.length) return errors

    const data = await callApi({
        endpoint: "/auth/signin",
        method: "POST",
        data: {username, password}
    })

    if (data.status === 201) return []
    if (data.status === 401) return ["Invalid username and/or password"]
    return unexpectedAppOrServerError(data.status)
}

export const signOut = async (): Promise<string[]> => {
    const data = await callApi({endpoint: "/auth/signout", headers: undefined})
    return data.status === 200 ? [] : unexpectedAppOrServerError(data.status)
}

export const signUp = async (username: string, password: string, confirmPassword: string): Promise<string[]> => {
    const errors = []
    if (!validateUsername(username)) errors.push("Username should be 4 to 12 characters long")
    if (!validatePassword(password)) errors.push("Password should be 8 to 72 bytes long and contain lower and uppercase letters")
    if (password !== confirmPassword) errors.push("Passwords dont match")

    if (errors.length) return errors

    const data = await callApi({endpoint: "/auth/signup", method: "POST", data: {username, password, confirmPassword}})
    
    if (data.status === 201) return []
    if (data.errors.length) return data.errors
    return unexpectedAppOrServerError(data.status)
}

export const getSchedule = async (): Promise<Schedule>=> {
    const data = await callApi({endpoint: "/schedule/", headers: undefined})
    return data.data.rows
}

export const getWeeks = async () => {
    const data = await callApi({endpoint: "/calendar/weeks", headers: undefined})
    if (data.status === 200 && !data.data.data.length) return {notFound: true}
    if (data.status === 200 && data.data.data.length) return {firstMonth: data.data.firstMonth.month, weeks: data.data.data}
    return undefined
}

export const createSchedule = async ({dateStart, dateEnd}: {dateStart: number, dateEnd: number}) => {
    const data = await callApi({endpoint: "/calendar", method: "POST", data: {dateStart: dateStart, dateEnd: dateEnd}})
    
    if (data.status === 201) return []
    if (data.errors.length) return data.errors
    return unexpectedAppOrServerError(data.status)
}

export const updateSubject = async (requestBody: {[key: string]: any}) => {
    const data = await callApi({endpoint: "/schedule", method: "PATCH", data: requestBody})
    if (data.status === 200) return []
    if (data.errors.length) return data.errors
    return unexpectedAppOrServerError(data.status)
}

export const createSubject = async (requestBody: {[key: string]: any}) => {
    const data = await callApi({endpoint: "/schedule", method: "POST", data: requestBody})
    if (data.status === 201) return data.data.row[0]
    if (data.errors.length) return data.errors
    return unexpectedAppOrServerError(data.status)
}

export const deleteSubject = async (requestBody: {[key: string]: any}) => {
    const data = await callApi({endpoint: "/schedule", method: "DELETE", data: requestBody})
    if (data.status === 200) return []
    if (data.errors.length) return data.errors
    return unexpectedAppOrServerError(data.status)
}

export const validateTile = {
    validateDay: (day: any) => {
        day = parseInt(day)
        if (!Number.isInteger(day)) return "Value for day is not an integer"
        if (0 <= day && day <=6) return ""
        return "Value for day should be >= 0 and <=6"
    },
    validateStartEnd: (startEnd: string) => {
        if (!startEnd.match(/^[0-2][0-9]:[0-6][0-9] - [0-2][0-9]:[0-6][0-9]$/)) return "Time is invalid"

        const [start, end] = startEnd.split(' - ')
        let [hourS, minuteS]: any = start.split(':')
        let [hourE, minuteE]: any = end.split(':')
        hourS = parseInt(hourS)
        minuteS = parseInt(minuteS)
        hourE = parseInt(hourE)
        minuteE = parseInt(minuteE)

        // this should never happend btw
        if (!Number.isInteger(hourS) ||
            !Number.isInteger(minuteS) ||
            !Number.isInteger(hourE) ||
            !Number.isInteger(minuteE)) return "Values must be integers"

        if (0 <= hourS && hourS <= 24 &&
            0 <= hourE && hourE <= 24 &&
            0 <= minuteS && minuteS <= 60 &&
            0 <= minuteE && minuteE <= 60) return ""

        return "Eneterd time doesn't exist"
    },
    validateSubjectName: (subjectName: string) => {
        if (!subjectName.match(/^[a-zA-ZżźćńółęąśŻŹĆĄŚĘŁÓŃ \.\,\-\_]+$/)) return "Subject name contains forbidden characters" // eslint-disable-line
        if (2 > subjectName.length) return "Subject name is too short"
        if (subjectName.length > 100) return "Subject name is too long"
        return ""
    },
    validateSubjectType: (subjectType: string) => {
        const options = ['Laboratory', 'Lecture', 'Classes', 'Project', 'Foreign language course']
        if (options.includes(subjectType)) return ""
        return "Provided subject type didn't match any options"
    },
    validateHall: (hall: string) => {
        if (!hall.match(/^[a-zA-Z0-9\- ]+$/)) return "Hall contains forbidden characters"
        if (2 > hall.length) return "Hall name is too short"
        if (hall.length > 100) return "Hall name is too long"
        return ""
    },
    validateTeacher: (teacher: string) => {
        if (!teacher.match(/^[a-zA-ZżźćńółęąśŻŹĆĄŚĘŁÓŃ \.\,]+$/)) return "Teacher's name contains forbidden characters" // eslint-disable-line
        if (2 > teacher.length) return "Teacher's name is too short"
        if (teacher.length > 100) return "Teacher's name is too long"
        return ""
    },
    validateAdditionalInfo: (info: string) => {
        if (!info.match(/^[a-zA-ZżźćńółęąśŻŹĆĄŚĘŁÓŃ \.\,\-\_\n]*$/)) return "The text contains forbidden characters" // eslint-disable-line
        if (info.length > 250) return "The text is too long"
        return ""
    },
    validateWeekStartEnd: (weekNumber: any) => {
        weekNumber = parseInt(weekNumber)
        if (!Number.isInteger(weekNumber)) return "Week must be integer"
        if (-1 > weekNumber) return "Week should be greater than that"
        if (20 < weekNumber) return "Week should be smaller than that"
        return ""
    },
    validateWeekType: (weekType: string) => {
        const options = ["Every week", "Odd weeks", "Even weeks"]
        if (!options.includes(weekType)) return "Week type didn't match any options"
        return ""
    }
}
export interface SemesterScheduleInterface {
    dates: {
        month: number
        weeks: {
            days: {
                day: number
                type: number
                message: string
            }[]
            type: number
            week: number
        }[]
    }[]
    status: number
}
export const semesterSchedule = async (): Promise<SemesterScheduleInterface> => {
    const data = await callApi({endpoint: "/calendar", headers: undefined})
    return {dates: data.data.data.dates, status: data.status}
}

export const patchSemesterScheduleDay = async (requestBody: {[key: string]: any}) => {
    const data = await callApi({endpoint: "/calendar/day", method: "PATCH", data: requestBody})
    if (data.status === 200) return []
    if (data.status === 404) return [data.data.message]
    if (data.errors.length) return data.errors
    return unexpectedAppOrServerError(data.status)
}

export const patchSemesterScheduleWeek = async (requestBody: {[key: string]: any}) => {
    const data = await callApi({endpoint: "/calendar/week", method: "PATCH", data: requestBody})
    if (data.status === 200) return []
    if (data.status === 404) return [data.data.message]
    if (data.errors.length) return data.errors
    return unexpectedAppOrServerError(data.status)
}
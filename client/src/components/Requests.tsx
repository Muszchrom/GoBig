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

export const isTokenValid = async (): Promise<boolean> => {
    let data = await fetch(`${source}/auth/protected`, {
        method: "GET",
        credentials: "include"
    })
    if (data.status === 200) return true
    return false
}

export const signIn = async (username: string, password: string): Promise<[] | string[]> => {
    let errors = []
    if (!validateUsername(username)) errors.push("Invalid username")
    if (!validatePassword(password)) errors.push("Invalid password")

    if (errors.length) return errors

    let data = await fetch(`${source}/auth/signin`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({
                username,
                password
            })
    })

    const status = data.status

    if (status === 201) return []
    else if (status === 401) return ["Invalid username and/or password"]
    else return ["An internal server error occured"]
}

export const signOut = async (): Promise<[] | string[]> => {
    let data = await fetch(`${source}/auth/signout`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
    })
    if (data.status === 200) return []
    return ["An error occured"]
}

export const signUp = async (username: string, password: string, confirmPassword: string): Promise<[] | string[]> => {
    let errors = []
    if (!validateUsername(username)) errors.push("Username should be 4 to 12 characters long")
    if (!validatePassword(password)) errors.push("Password should be 8 to 72 bytes long and contain lower and uppercase letters")
    if (password !== confirmPassword) errors.push("Passwords dont match")

    if (errors.length) return errors

    let data = await fetch(`${source}/auth/signup`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        body: JSON.stringify({
                username,
                password,
                confirmPassword
            })
    })
    
    const status = data.status
    if (status === 201) return []
    const dataJson: {errors?: string[]} = await data.json()
    if (dataJson.errors?.length) return dataJson.errors
    else return [`Status code: ${status}`]
}

export const getSchedule = async (): Promise<{[key: string]: any}[] | []>=> {
    let data = await fetch(`${source}/schedule/`, {
        method: "GET",
        headers: {"Content-Type": "application/json"}
    })
    const status = data.status

    type Schedule = {
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
        }[] | []
    }
    const dataJson: Schedule = await data.json()
    return dataJson.rows
}

export const getWeeks = async () => {
    let data = await fetch(`${source}/calendar/weeks`, {
        method: "GET",
        headers: {"Content-Type": "application/json"},
        credentials: "include"
    })
    const status = data.status
    type Weeks = {
        firstMonth: {
            month: number
        }, 
        data: {
            week: number, 
            type: number
        }[]
    }
    const dataJson: Weeks = await data.json()
    if (status === 200 && !dataJson.data.length) return {notFound: true}
    if (status === 200 && dataJson.data.length) return {firstMonth: dataJson.firstMonth.month, weeks: dataJson.data}
    return undefined
}

export const createSchedule = async ({dateStart, dateEnd}: {dateStart: number, dateEnd: number}) => {
    const data = await fetch(`${source}/calendar`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify({dateStart: dateStart, dateEnd: dateEnd})
    })
    
    const dataJson = await data.json()
    if (data.status === 201) return []
    if (dataJson.errors?.length) return dataJson.errors
    return [`Status code: ${data.status}`]
}

export const updateSubject = async (requestBody: {[key: string]: any}) => {
    const data = await fetch(`${source}/schedule`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(requestBody)
    })
    
    const dataJson = await data.json()
    if (data.status === 200) return []
    if (dataJson.errors?.length) return dataJson.errors
    return [`Status code: ${data.status}`]
}

export const createSubject = async (requestBody: {[key: string]: any}) => {
    let data = await fetch(`${source}/schedule`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(requestBody)
    })
    
    const dataJson = await data.json()
    if (data.status === 201) return dataJson.row[0]
    if (dataJson.errors?.length) return dataJson.errors
    return [`Status code: ${data.status}`]
}

export const deleteSubject = async (requestBody: {[key: string]: any}) => {
    const data = await fetch(`${source}/schedule`, {
        method: "DELETE",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(requestBody)
    })

    const dataJson = await data.json()
    if (data.status === 200) return []
    if (dataJson.errors?.length) return dataJson.errors
    return [`Status code: ${data.status}`]
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

export const semesterSchedule = async () => {
    const data = await fetch(`${source}/calendar/`, {
                method: "GET",
                credentials: "include"
            })
    const dataJson = await data.json()
    return {dates: dataJson?.data?.dates, status: data.status}
}

export const patchSemesterScheduleDay = async (requestBody: {[key: string]: any}) => {
    const data = await fetch(`${source}/calendar/day`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(requestBody)
    })
    
    if (data.status === 200) return []

    const dataJson = await data.json()
    if (data.status === 404) return [dataJson.message]
    if (dataJson.errors?.length) return dataJson.errors
    return [`Status code: ${data.status}`]
}

export const patchSemesterScheduleWeek = async (requestBody: {[key: string]: any}) => {
    const data = await fetch(`${source}/calendar/week`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(requestBody)
    })
    
    if (data.status === 200) return []

    const dataJson = await data.json()
    if (data.status === 404) return [dataJson.message]
    if (dataJson.errors?.length) return dataJson.errors
    return [`Status code: ${data.status}`]
}
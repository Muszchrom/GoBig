import {source} from "../source"
// export const source = "http://192.168.100.3:5000"

const validateUsername = (username) => {
    if (username.length < 4 || username.length > 12) return false
    return true
}

const validatePassword = (password) => {
    const psswdByteLength = new Blob([password]).size
    if (psswdByteLength < 8 || psswdByteLength > 72) return false
    return (/[a-z]/.test(password) && /[A-Z]/.test(password))
}

export const isTokenValid = async () => {
    let data = await fetch(`${source}/auth/protected`, {
        method: "GET",
        credentials: "include"
    })
    if (data.status === 200) {
        return true
    } else {
        return false
    }
}

export const getSchedule = async () => {
    let data = await fetch(`${source}/schedule/`, {
        method: "GET",
        headers: {"Content-Type": "application/json"}
    })
    const status = data.status
    data = await data.json()
    if (status === 200) return data.rows
    else return undefined
}

export const getScheduleForDay = async (day) => {
    if (day < 0 || day > 6) return
    let data = await fetch(`${source}/schedule/${day}`, {
        method: "GET",
        headers: {"Content-Type": "application/json"}
    })
    const status = data.status
    data = await data.json()
    if (status === 200) return data
    
}

export const updateSubject = async (requestBody) => {
    // validate shit here inshallah
    let errors = []

    let data = await fetch(`${source}/schedule`, {
        method: "PATCH",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(requestBody)
    })
    
    const status = data.status
    data = await data.json()
    if (status === 200) return []
    if (data.errors?.length) return data.errors
    else return errors.push(`Status code: ${status}`)
}

export const createSubject = async (requestBody) => {
    // validate shit here inshallah
    let errors = []

    let data = await fetch(`${source}/schedule`, {
        method: "POST",
        headers: {"Content-Type": "application/json"},
        credentials: "include",
        body: JSON.stringify(requestBody)
    })
    
    const status = data.status
    data = await data.json()
    if (status === 200) return []
    if (data.errors?.length) return data.errors
    else return errors.push(`Status code: ${status}`)
}

export const deleteSubject = async (requestBody) => {
    // validate shit here inshallah
    let errors = []
    try {
        let data = await fetch(`${source}/schedule`, {
            method: "DELETE",
            headers: {"Content-Type": "application/json"},
            credentials: "include",
            body: JSON.stringify(requestBody)
        })

        const status = data.status
        data = await data.json()
        if (status === 200) return []
        if (data.errors?.length) return data.errors
        else return errors.push(`Status code: ${status}`)
    } catch (err) {
        console.log(err)
    }
}

export const signIn = async (username, password) => {
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

export const signUp = async (username, password, confirmPassword) => {
    let errors = []
    // Validation on users
    if (!validateUsername(username)) errors.push("Username should be 4 to 12 characters long")
    if (!validatePassword(password)) errors.push("Password should be 8 to 72 bytes long and contain lower and uppercase letters")
    if (password !== confirmPassword) errors.push("Passwords dont match")

    if (errors.length) return errors

    // fetch if no errors
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
    data = await data.json()
    if (status === 201) return []
    if (data.errors?.length) return data.errors
    else return errors.push(`Status code: ${status}`)
}

export const fetchProtected = async () => {
    let data = await fetch(`${source}/auth/protected`, {
        credentials: "include",
        method: "GET",
    })
    data = await data.json()
    return data.message
}
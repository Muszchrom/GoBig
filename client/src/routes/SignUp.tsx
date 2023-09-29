import { useState } from "react"
import { NavLink, Navigate, useNavigate } from 'react-router-dom'

import {signUp} from '../components/Requests'
import { SubmitButton } from "../components/forms/Buttons"
import { ErrorList } from "../components/forms/Common"
import TextInput from "../components/forms/TextInput"

export default function SignUp({signedIn}: {signedIn: boolean}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [waitingForServer, setWaitingForServer] = useState(false)
    
    const navigate = useNavigate()

    const formSubmition = async (e: React.FormEvent) => {
        e.preventDefault()
        setWaitingForServer(true)

        const errors = await signUp(username, password, confirmPassword) 

        if (!errors.length) return navigate("/signin", {replace: true})
        setValidationErrors(errors)
        setWaitingForServer(false)
        setUsername("")
        setPassword("")
        setConfirmPassword("")
    }

    return(!signedIn ? (
        <div className="signInWrapper">
            <h1>Sign Up</h1>
            <form onSubmit={formSubmition} className="signInForm">
                <TextInput 
                    state={{field: "", fun: (a, username) => setUsername(username), initVal: ""}}
                    type="text"
                    autoComplete="username">Username</TextInput>
                <TextInput 
                    state={{field: "", fun: (a, password) => setPassword(password), initVal: ""}}
                    type="password"
                    autoComplete="new-password">Password</TextInput>
                <TextInput 
                    state={{field: "", fun: (a, confirmPassword) => setConfirmPassword(confirmPassword), initVal: ""}}
                    type="password"
                    autoComplete="new-password">Confirm password</TextInput>

                <SubmitButton waitingFor={waitingForServer}>
                    Confirm
                </SubmitButton>
            </form>
            <ErrorList errors={validationErrors}/>
            <div className="spanWrapper">
                <span>Have an account?</span>
                <NavLink to={"/signin"} className="nav-link">
                    Sign in
                </NavLink>
            </div>
    </div>
    ) : (
        <Navigate to="/" replace={true}></Navigate>
    ))
}


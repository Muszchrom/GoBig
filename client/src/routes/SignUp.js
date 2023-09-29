import { useState } from "react"
import { NavLink, Navigate, useNavigate } from 'react-router-dom'

import {signUp} from '../components/Requests'
import { SubmitButton } from "../components/forms/Buttons"
import { ErrorList } from "../components/forms/Common"

export default function SignUp({signedIn}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")

    const [validationErrors, setValidationErrors] = useState([])
    const [waitingForServer, setWaitingForServer] = useState(false)
    
    const navigate = useNavigate()

    const formSubmition = async (e) => {
        e.preventDefault()
        setWaitingForServer(true)

        const errors = await signUp(username, password, confirmPassword) 

        if (!(errors.length)) {
            navigate("/signin", {replace: true})
            return
        }
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
                <UsernameInput inputValue={username} handleChange={setUsername} />
                <PasswordInput inputValue={password} handleChange={setPassword} isNewPassword={true} />
                <ConfirmPasswordInput inputValue={confirmPassword} handleChange={setConfirmPassword} />
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

//delte below
function UsernameInput({inputValue, handleChange}) {
    return (
        <input 
            className="signInInput" 
            title="Provide an username" 
            type="text" 
            placeholder="Username" 
            autoComplete="username"
            onChange={e => handleChange(e.target.value)}
            value={inputValue}>
        </input>
    )
}
function PasswordInput({inputValue, handleChange, isNewPassword}) {
    return (
        <input 
            className="signInInput" 
            title="Provide a password" 
            type="password" 
            placeholder="Password" 
            autoComplete={isNewPassword ? "new-password" : "password"}
            onChange={e => handleChange(e.target.value)}
            value={inputValue}>
        </input>
    )
}
function ConfirmPasswordInput({inputValue, handleChange}) {
    return (
        <input 
            className="signInInput" 
            title="Confirm a password" 
            type="password" 
            placeholder="Confirm password" 
            autoComplete="new-password"
            onChange={e => handleChange(e.target.value)}
            value={inputValue}>
        </input>
    )
}
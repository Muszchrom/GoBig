import { useState } from "react"
import { NavLink, Navigate, useNavigate } from 'react-router-dom'

import {signUp} from '../components/Requests'
import { UsernameInput, PasswordInput, ConfirmPasswordInput, ErrorList, SubmitButton } from '../components/Common'

export default function SignUp({signedIn, setSignedIn}) {
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
            <button onClick={() => {navigate("/", {replace: true})}} className="absolute-button">{"<-"}</button>
    </div>
    ) : (
        <Navigate to="/" replace={true}></Navigate>
    ))
}

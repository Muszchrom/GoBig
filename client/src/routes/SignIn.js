import { useState } from "react"
import { NavLink, Navigate, useNavigate } from 'react-router-dom'

import { signIn } from '../components/Requests'
import { UsernameInput, PasswordInput, ErrorList, SubmitButton, NavigateBackTo } from '../components/Common'

export default function SignIn({signedIn, setSignedIn}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const [validationErrors, setValidationErrors] = useState([])
    const [waitingForServer, setWaitingForServer] = useState(false)
    
    const navigate = useNavigate()

    const formSubmition = async (e) => {
        e.preventDefault()
        setWaitingForServer(true)

        const errors = await signIn(username, password)

        if (!(errors.length)) {
            navigate("/", {replace: true})
            setSignedIn(true)
            return
        }
        setValidationErrors(errors)
        setWaitingForServer(false)
        setUsername("")
        setPassword("")
    }

    return(!signedIn ? (
        <div className="signInWrapper" style={{position: "relative"}}>
            <h1>Sign In</h1>
            <form onSubmit={formSubmition} className="signInForm">
                <UsernameInput inputValue={username} handleChange={setUsername}/>
                <PasswordInput inputValue={password} handleChange={setPassword} isNewPassword={false}/>
                <SubmitButton waitingFor={waitingForServer}>
                    Confirm
                </SubmitButton>
            </form>
            <ErrorList errors={validationErrors}/>
            <div className="spanWrapper">
                <span>No account?</span>
                <NavLink to={"/signup"} className="nav-link">
                    Sign up
                </NavLink>
            </div>
            <div style={{display: "flex", width: "100%", padding: "0 1em", height: "0"}}>
                <NavigateBackTo path="/"/>
            </div>
        </div>
    ) : (
        <Navigate to="/" replace={true}></Navigate>
    ))
}

import { useState } from "react"
import { NavLink, Navigate, useNavigate } from 'react-router-dom'

import { signIn } from '../components/Requests'
import { UsernameInput, PasswordInput, ErrorList, SubmitButton } from '../components/Common'

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
        <div className="signInWrapper">
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
            <button onClick={() => {navigate("/", {replace: true})}} className="absolute-button">{"<-"}</button>
        </div>
    ) : (
        <Navigate to="/" replace={true}></Navigate>
    ))
}

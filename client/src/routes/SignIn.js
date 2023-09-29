import { useState } from "react"
import { NavLink, Navigate, useNavigate } from 'react-router-dom'
import { signIn } from '../components/Requests'
import { ErrorList } from "../components/forms/Common"
import { SubmitButton } from "../components/forms/Buttons"

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
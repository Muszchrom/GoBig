import { useState } from "react"
import { NavLink, Navigate, useNavigate } from 'react-router-dom'
import { signIn } from '../components/Requests'
import { ErrorList } from "../components/forms/Common"
import { SubmitButton } from "../components/forms/Buttons"
import TextInput from "../components/forms/TextInput"

export default function SignIn({signedIn, setSignedIn}: {signedIn: boolean, setSignedIn: (val: boolean) => void}) {
    const [username, setUsername] = useState("")
    const [password, setPassword] = useState("")

    const [validationErrors, setValidationErrors] = useState<string[]>([])
    const [waitingForServer, setWaitingForServer] = useState(false)
    
    const navigate = useNavigate()

    const formSubmition = async (e: React.FormEvent) => {
        e.preventDefault()
        setWaitingForServer(true)

        const errors = await signIn(username, password)

        if (!errors.length) {
            navigate("/", {replace: true})
            setSignedIn(true)
            return
        }
        setValidationErrors(errors)
        setWaitingForServer(false)
    }

    return(!signedIn ? (
        <div className="signInWrapper" style={{position: "relative"}}>
            <h1>Sign In</h1>
            <form onSubmit={formSubmition} className="signInForm">
                <TextInput 
                    state={{field: "", fun: (a, username) => setUsername(username), initVal: ""}}
                    type="text"
                    autoComplete="username">Username</TextInput>
                <TextInput 
                    state={{field: "", fun: (a, password) => setPassword(password), initVal: ""}}
                    type="password"
                    autoComplete="password">Password</TextInput>
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
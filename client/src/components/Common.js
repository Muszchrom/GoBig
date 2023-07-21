import { useNavigate } from "react-router-dom";
import { source } from "../source"

export function LoadingButtonAnimation() {
    return (
        <div className="loadingWrapper">
            <div className="loadingAnim"></div>
            <div className="loadingAnim"></div>
            <div className="loadingAnim"></div>
            <div className="loadingAnim"></div>
        </div>
    );
}

export function CloseButton({open, setOpen}) {
    return (
        <button className="absolute-button absolute-close-button" onClick={() => setOpen(!open)}></button>
    );
}

export function NavigateBackTo({path}) {
    const navigate = useNavigate()
    return (
        <button style={{background: "lightcoral", position: "sticky", }} aria-label="Additional info" className="absolute-button" onClick={() => navigate(path, {replace: true})}>
            {/* <div className="dots"></div> */}
            <img style={{scale: "1.2"}} src={`${source}/static/GoBack.svg`} alt="Arrow heading back"/>
        </button>
    )
}
  

export function SubmitButton({children, waitingFor, handleClick}) {
    return (
        handleClick ? (
            <button className="signInButton" type="button" onClick={handleClick}>
                {!waitingFor ? 
                    children : <LoadingButtonAnimation></LoadingButtonAnimation>}    
            </button>
        ) : (
            <button className="signInButton" type="submit">
                {!waitingFor ? 
                    children : <LoadingButtonAnimation></LoadingButtonAnimation>}    
            </button>

        )
    )
    
}

export function CancelButton({children, handleClick}) {
    return (
        <button className="cancelButton" type="button" onClick={handleClick}>
            {children}
        </button>
    )
}

export function ErrorList({errors}) {
    return (
        <>
            {!!errors.length && (
                <ul className="errorList">
                {errors.map((item, index) => {
                    return <li key={index} className="error">{item}</li>
                })}
            </ul>
            )}
        </>
    )
}

export function UsernameInput({inputValue, handleChange}) {
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
export function PasswordInput({inputValue, handleChange, isNewPassword}) {
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
export function ConfirmPasswordInput({inputValue, handleChange}) {
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
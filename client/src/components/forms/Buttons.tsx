import { useNavigate } from "react-router-dom";
import { source } from "../../source";
import { LoadingButtonAnimation } from "./Common";

export function CloseButton({open, setOpen}: {open: boolean, setOpen: (newState: boolean) => void}) {
    return (
        <button className="absolute-button absolute-close-button" onClick={() => setOpen(!open)}></button>
    );
}

export function NavigateBackTo({path}: {path: string}) {
    const navigate = useNavigate()
    return (
        <button style={{background: "lightcoral", position: "sticky", }} aria-label="Additional info" className="absolute-button" onClick={() => navigate(path, {replace: true})}>
            {/* <div className="dots"></div> */}
            <img style={{scale: "1.2"}} src={`${source}/static/GoBack.svg`} alt="Arrow heading back"/>
        </button>
    )
}
  
export function SubmitButton({children, waitingFor, handleClick}: {children: React.ReactNode, waitingFor: boolean, handleClick?: () => void}) {
    return (
        handleClick ? (
            <button className="signInButton" type="button" onClick={(e) => {e.stopPropagation(); handleClick()}}>
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

export function CancelButton({children, handleClick}: {children: React.ReactNode, handleClick: () => void}) {
    return (
        <button className="cancelButton" type="button" onClick={handleClick}>
            {children}
        </button>
    )
}
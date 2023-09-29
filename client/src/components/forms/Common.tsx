import { forwardRef } from "react"
import { source } from "../../source"

interface InputContainerProps {
    focused: boolean, 
    label: string, 
    children: React.ReactNode, 
    error: string, 
    handleClick: () => void
}
export const InputContainer = forwardRef(function ({focused, label, children, error, handleClick}: InputContainerProps, ref: React.Ref<HTMLDivElement>) {
    return (
        <div ref={ref} className={`ex-inputWrapper${focused ? " ex-activeWrapper" : ""}`} role="button" onClick={handleClick}>
            <label className={`ex-inputTitle${focused ? " ex-activeTitle" : ""}`}>{label}</label>
            <div className="ex-inputInnerWrapper">
                <div className="ex-textAreaWrapper">
                    {children}
                </div>
                <div className="ex-svgWrapper">
                    {error.length 
                    ? (<>
                            <img src={`${source}/static/Close - red.svg`} alt="Invalid value icon"/>
                            {focused && <ValidationErrorMessage>{error}</ValidationErrorMessage>} 
                        </>) 
                    : focused && <img src={`${source}/static/Confirm.svg`} alt="Valid value icon"/>}
                </div>
            </div>
        </div>
    )
})

export function InputLoading({rows, children}: {rows: number, children: React.ReactNode}) {
    return (
        <div className="ex-inputWrapper">
            <span className="ex-inputTitle">{children}</span>
            <div className="ex-inputInnerWrapper">
                <div className="ex-textAreaWrapper">
                    <textarea disabled inputMode="text" rows={rows} className="ex-textInput animated-background"></textarea>
                </div>
            </div>
        </div>
    )
}
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

export function ErrorList({errors}: {errors: string[]}) {
    return (<>{!!errors.length && (
        <ul className="errorList">
            {errors.map((item, index) => {
                return <li key={index} className="error">{item}</li>
            })}
        </ul>
    )}</>)
}

export function ValidationErrorMessage({children}: {children: string}) {
    return (
        <div className="ex-inputErrorMessage">
            {children}
        </div>
    )
}

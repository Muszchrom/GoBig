import { useState, useRef, useEffect, forwardRef } from 'react';
import { source } from '../source';

interface InputContainer {
    focused: boolean, 
    label: string, 
    children: React.ReactNode, 
    error: string, 
    handleClick: () => void
}
export const InputContainer = forwardRef(function ({focused, label, children, error, handleClick}: InputContainer, ref: React.Ref<HTMLDivElement>) {
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
                            {focused && (
                                <div className="ex-inputErrorMessage">
                                    {error}
                                </div>
                            )}
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

interface TextInputProps {
    children: string, 
    validatingFuntion: (val: string) => string
    state: {
        field: string,
        fun: (field: string, value: string) => void,
        initVal: string
    },
    multiline?: boolean,
    rows?: number,
    focusHandler?: () => void,
    blurHandler?: () => void
}
export function TextInput({children, validatingFuntion, state, focusHandler, blurHandler, multiline, rows}: TextInputProps) {
    const [validationError, setValidationError] = useState(validatingFuntion(state.initVal))
    const [focused, setFocused] = useState(false)
    const [inputValue, setInputValue] = useState(state.initVal)

    const wrapperRef = useRef<HTMLDivElement | null>(null)
    const inputRef = useRef<HTMLInputElement | null>(null)
    const textAreaRef = useRef<HTMLTextAreaElement | null>(null)

    // useImperativeHandle(ref, () => inputRef.current! || textAreaRef.current!)

    useEffect(() => {
        if (!multiline) return
        textAreaRef.current!.rows = 1
        textAreaRef.current!.rows = ((a=Math.floor(textAreaRef.current!.scrollHeight/19), b=rows || 1) => a < b ? b : a)()
    }, [multiline, rows])

    useEffect(() => {
        const handleOutFocus = () => {setFocused(false); blurHandler && blurHandler()}
        const mousedownListener = (e: MouseEvent) => !wrapperRef.current?.contains(e.target as Node) && handleOutFocus()
        const keydownListener = (e: KeyboardEvent) => e.key === "Tab" && handleOutFocus()
        if (focused) {
            document.addEventListener("mousedown", mousedownListener)
            document.addEventListener("keydown", keydownListener)
        }
        return () => {
            document.removeEventListener("mousedown", mousedownListener)
            document.removeEventListener("keydown", keydownListener)
        }
    }, [focused, inputValue])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (multiline) {
            textAreaRef.current!.rows = 1
            textAreaRef.current!.rows = ((a=Math.floor(textAreaRef.current!.scrollHeight/19), b=rows || 1) => a < b ? b : a)() 
        }
        setInputValue(e.target.value)
        state.fun(state.field, e.target.value)
        setValidationError(validatingFuntion(e.target.value))
    }
    const handleClick = () => (inputRef.current || textAreaRef.current)!.focus()
    const handleFocus = () => {setFocused(true); focusHandler && focusHandler()}

    return (
        <InputContainer ref={wrapperRef} focused={focused} label={children} error={validationError} handleClick={handleClick}>
            {multiline 
                ? <textarea ref={textAreaRef} rows={rows || 1} className={`ex-textInput${focused ? " ex-activeInput": ""}`} value={inputValue} onChange={handleChange} onFocus={handleFocus}></textarea>
                : <input type="text" ref={inputRef} className={`ex-textInput${focused ? " ex-activeInput" : ""}`} value={inputValue} onChange={handleChange} onFocus={handleFocus}></input>
            }
        </InputContainer>
    )
}

interface ImageContainer {
    imgSrc: string
    imgAlt: string
    showLoadingAnimation: boolean
    children: string
    labelFocused: boolean
    imageFocused: boolean
    labelClickHandler: () => void
    labelKeyDownHandler: (e?: React.KeyboardEvent) => void
    imageClickHandler: () => void
    imageKeyDownHandler: (e?: React.KeyboardEvent) => void
    labelFocusHandler: () => void
    imageFocusHandler: () => void
    labelBlurHandler: () => void
    imageBlurHandler: () => void
}
export function ImageContainer({
    imgSrc, 
        imgAlt, 
        showLoadingAnimation, 
        children, 
        labelFocused, 
        imageFocused, 
        labelClickHandler, 
        labelKeyDownHandler, 
        imageClickHandler, 
        imageKeyDownHandler,
        labelFocusHandler, 
        imageFocusHandler, 
        labelBlurHandler,
        imageBlurHandler
    }: ImageContainer) {
        return (
            <div className="ex-inputWrapper" style={{padding: 0, border: 0}}>
                {showLoadingAnimation
                ? (
                    <>
                        <div style={{padding: "12px"}}>
                            <span className={`ex-inputTitle`}>{children}</span>
                        </div>
                        <div className={`image-frame animated-background`} style={{borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px"}}></div>
                    </>
                ) : (
                    <>
                        <div style={{
                                transition: "all .2s ease-in-out",
                                borderRadius: "12px 12px 0 0", 
                                outline: "none",
                                padding: "12px", 
                                ...(labelFocused ? {border: "2px solid var(--Lightcoral)"} : {border: "2px solid var(--Background)"})}}
                             role="button" 
                             tabIndex={0}
                             onClick={labelClickHandler} 
                             onKeyDown={labelKeyDownHandler} 
                             onFocus={labelFocusHandler} 
                             onBlur={labelBlurHandler}>

                            <span className={`ex-inputTitle${labelFocused ? " ex-activeTitle" : ""}`}>{children}</span>
                        </div>
                        <div className={`image-frame`} 
                             style={{
                                transition: "all .2s ease-in-out",
                                outline: "none",
                                borderRadius: "0 0 12px 12px",
                                height: "unset", 
                                maxHeight: "600px",
                                ...(imageFocused ? {border: "2px solid var(--Lightcoral)"} : {border: "2px solid var(--Background)"})
                             }}
                             role="button" 
                             tabIndex={0}
                             onClick={imageClickHandler} 
                             onKeyDown={imageKeyDownHandler} 
                             onFocus={imageFocusHandler} 
                             onBlur={imageBlurHandler}>
                            {imgSrc ? (
                                <img src={imgSrc} 
                                     className="map-image" 
                                     style={{borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px", display: "block"}} 
                                     alt={imgAlt}></img>
                            ) : (
                                <div style={{width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                                    <span style={(imageFocused ? {color: "var(--Lightcoral)"} : {opacity: .5, color: "var(--Text)"})}>No image to preview</span>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        )
}


// function ValidationErrorMessage({errorMessage}: {errorMessage: string}) {
//     return (
//         <div className="ex-inputErrorMessage">
//             {errorMessage}
//         </div>
//     )
// }

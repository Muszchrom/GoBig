import { useRef, useState, useEffect } from "react"
import { InputContainer } from "./Common"

interface TextInputProps {
    children: string
    state: {
        field: string
        fun: (field: string, value: string) => void
        initVal: string
    }
    type?: "text" | "password"
    autoComplete?: "off" | "username" | "password" | "new-password"
    validatingFuntion?: (val: string) => string
    multiline?: boolean
    rows?: number
    disabled?: boolean
    focusHandler?: () => void
    blurHandler?: () => void
}
export default function TextInput({children, state, type, autoComplete, validatingFuntion, focusHandler, blurHandler, multiline, rows, disabled}: TextInputProps) {
    const [validationError, setValidationError] = useState(validatingFuntion && validatingFuntion(state.initVal) || "")
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
    }, [focused, inputValue, blurHandler])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        if (multiline) {
            textAreaRef.current!.rows = 1
            textAreaRef.current!.rows = ((a=Math.floor(textAreaRef.current!.scrollHeight/19), b=rows || 1) => a < b ? b : a)() 
        }
        setInputValue(e.target.value)
        state.fun(state.field, e.target.value)
        validatingFuntion && setValidationError(validatingFuntion(e.target.value))
    }
    const handleClick = () => (inputRef.current || textAreaRef.current)!.focus()
    const handleFocus = () => {setFocused(true); focusHandler && focusHandler()}

    return (
        <InputContainer ref={wrapperRef} focused={focused} label={children} error={validationError} handleClick={handleClick}>
            {multiline 
                ? <textarea disabled={disabled ? true : false} ref={textAreaRef} rows={rows || 1} className={`ex-textInput${focused ? " ex-activeInput": ""}`} value={inputValue} onChange={handleChange} onFocus={handleFocus}></textarea>
                : <input disabled={disabled ? true : false} type={type || "text"} autoComplete={autoComplete || "off"} ref={inputRef} className={`ex-textInput${focused ? " ex-activeInput" : ""}`} value={inputValue} onChange={handleChange} onFocus={handleFocus}></input>
            }
        </InputContainer>
    )
}
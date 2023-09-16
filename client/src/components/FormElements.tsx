import { useState, useRef, useImperativeHandle, forwardRef, useEffect } from 'react';
import { source } from '../source';
import UploadModal from './UploadModal';

function ValidationErrorMessage({errorMessage}: {errorMessage: string}) {
    return (
        <div className="ex-inputErrorMessage">
            {errorMessage}
        </div>
    )
}

interface MultilineInputInterface {
    children: React.ReactNode
    initVal: string
    validatingFuntion: (val: string) => string
    contentChangesSubmitted: (val: string) => Promise<string[]>
}

export const MultilineInput = forwardRef(function ({children, initVal, validatingFuntion, contentChangesSubmitted}: MultilineInputInterface, ref: React.Ref<HTMLTextAreaElement>) {
    const [validationError, setValidationError] = useState('')
    const [value, setValue] = useState(initVal)
    const [focused, setFocused] = useState(false)

    const wrapperRef = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLTextAreaElement>(null)
    const labelRef = useRef<HTMLLabelElement>(null)

    useImperativeHandle(ref, () => inputRef.current!)

    const handleClick = () => {
        inputRef.current?.focus()
    }

    const handleFocus = () => {
        if (wrapperRef.current === null || labelRef.current === null || inputRef.current === null) return
        wrapperRef.current.classList.add('ex-activeWrapper')
        labelRef.current.classList.add('ex-activeTitle')
        inputRef.current.classList.add('ex-activeInput')
        setFocused(true)
    }

    const handleOutFocus = () => {
        if (wrapperRef.current === null || labelRef.current === null || inputRef.current === null) return
        wrapperRef.current.classList.remove('ex-activeWrapper')
        labelRef.current.classList.remove('ex-activeTitle')
        inputRef.current.classList.remove('ex-activeInput')
        setFocused(false)
    }
    const calcRows = ({target}: {target: HTMLTextAreaElement}) => {
        setValidationError(validatingFuntion(target.value))
        inputRef.current!.rows = 1 // This height reset must be present here
        const calculatedRows = Math.floor(inputRef.current!.scrollHeight/19)
        inputRef.current!.rows = calculatedRows >= 4 ? calculatedRows : 4
        setValue(target.value)
    }

    useEffect(() => {
        calcRows({target: inputRef.current!})
    }, [focused])

    return (
        <div ref={wrapperRef} className="ex-inputWrapper" role="button" onClick={handleClick}>
            {(!focused && (initVal !== value)) && (
                <UploadModal 
                    color="var(--Color4)" 
                    handleClose={() => {setValue(initVal)}} 
                    handleSoftClose={() => {setValue(initVal)}} 
                    submitFunction={() => contentChangesSubmitted(value)}>
                        Upload changes?
                </UploadModal>
            )}
            <label ref={labelRef} className="ex-inputTitle">{children}</label>
            <div className="ex-inputInnerWrapper">
                <div className="ex-textAreaWrapper">
                    <textarea ref={inputRef} inputMode="text" rows={1} className="ex-textInput" value={value} onChange={calcRows} onFocus={handleFocus} onBlur={handleOutFocus}></textarea>
                </div>
                <div className="ex-svgWrapper">
                    {validationError.length
                    ? (
                        <>
                            <img src={`${source}/static/Close - red.svg`} alt="Invalid value icon"/>
                            {focused && <ValidationErrorMessage errorMessage={validationError}></ValidationErrorMessage>}
                        </>
                    )
                    : focused 
                    ? <img src={`${source}/static/Confirm.svg`} alt="Valid value icon"/>
                    : <></>}
                </div>
            </div>
        </div>
    )
})

export function MultilineInputLoading({children}: {children: React.ReactNode}) {
    return (
        <div className="ex-inputWrapper" role="button">
            <label className="ex-inputTitle">{children}</label>
            <div className="ex-inputInnerWrapper">
                <div className="ex-textAreaWrapper">
                    <textarea  inputMode="text" rows={4} className="ex-textInput animated-background"></textarea>
                </div>
                <div className="ex-svgWrapper">
                </div>
            </div>
        </div>
    )
}
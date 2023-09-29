import { useRef, useState } from "react";
import { Navigate } from 'react-router-dom'
import { source } from "../source";
import { NavigateBackTo, SubmitButton } from "../components/forms/Buttons";
import UploadModal from "../components/UploadModal";
import { createSchedule, createInitialGroup } from "../components/Requests";
import { TextInput } from "../components/schedule/tiles/TileInputs";

export default function CreateSchedule() {
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [exit, setExit] = useState(false)
    const dateStartInput = useRef(null)
    const dateEndInput = useRef(null)
    const scheduleNameInput = useRef(null)

    const validateInput = (val) => {
        const date = new Date(val)
        if (isNaN(date)) return "Date is invalid"
        if (date < new Date('2000-01-01')) return "Date should be greater than that"
        if (date > new Date("2050-01-01")) return "Date should be smaller than that"
        return ""
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        setShowUploadModal(true)
    }

    const handleClose = () => setExit(true)
    const handleSoftClose = () => setShowUploadModal(false)
    const submitFunction = async () => {
        const scheduleName = scheduleNameInput.current.value
        const start = new Date(dateStartInput.current.value)
        const end = new Date(dateEndInput.current.value)
        if (isNaN(start) || isNaN(end)) return ["Date is invalid"]
        if (start - end > 0) return ["Date start should be older than date end"]
        if ((end - start) / (1000*60*60*24) > 300) return ["Date difference should be smaller than or equal to 300 days"]
        if (scheduleName.length < 2) return ["Schedule name is too short"]
        if (scheduleName.length > 20) return ["Schedule name is too long"]
        const groupResult = await createInitialGroup(scheduleName)
        if (groupResult.length) return groupResult 
        const result = await createSchedule({dateStart: start, dateEnd: end})
        return result
    }
    return(
        <div className="signInWrapper">
            {exit && <Navigate to="/schedule/monday" replace="true"/>}
            {showUploadModal && <UploadModal color="var(--Background)" 
                                             handleClose={handleClose} 
                                             handleSoftClose={handleSoftClose} 
                                             submitFunction={submitFunction}>Upload Changes?</UploadModal>}
            <h1>Create schedule</h1>
            <form onSubmit={handleSubmit} className="tile-form" style={{width: "100%"}}>
                <TextInput inputRef={scheduleNameInput} initVal={""} validatingFuntion={() => ""}>Schedule's name</TextInput>
                <DateInput inputRef={dateStartInput} validatingFuntion={validateInput}>Start of the semester</DateInput>
                <DateInput inputRef={dateEndInput} validatingFuntion={validateInput}>End of the semester</DateInput>
                <SubmitButton>Confirm</SubmitButton>
            </form>
            <div style={{width: "100%", padding: "0 1em", marginTop: "auto", marginBottom: "2em"}}>
                <NavigateBackTo path="/"/>
            </div>
        </div>
    )
}

function DateInput({children, inputRef, initVal="", validatingFuntion}) {
    const [validationError, setValidationError] = useState('')
    const [value, setValue] = useState(initVal)
    const [focused, setFocused] = useState(false)
    
    const wrapperRef = useRef()
    const labelRef = useRef()

    const handleChange = (e) => {
        setValidationError(validatingFuntion(e.target.value))
        setValue(e.target.value)
    }
    const handleClick = () => inputRef.current.focus()
    const handleFocus = () => {
        wrapperRef.current.classList.add('ex-activeWrapper')
        labelRef.current.classList.add('ex-activeTitle')
        inputRef.current.classList.add('ex-activeInput')
        setFocused(true)
    }   
    const handleOutFocus = () => {
        wrapperRef.current.classList.remove('ex-activeWrapper')
        labelRef.current.classList.remove('ex-activeTitle')
        inputRef.current.classList.remove('ex-activeInput')
        setFocused(false)
    }

    return (
        <div ref={wrapperRef} className="ex-inputWrapper" role="button" onClick={handleClick}>
            <label ref={labelRef} className="ex-inputTitle">{children}</label>
            <div className="ex-inputInnerWrapper">
                <div className="ex-textAreaWrapper">
                <input min="2000-01-01" 
                       max="2050-01-01" 
                       value={value} 
                       onChange={handleChange} 
                       type="date"
                       ref={inputRef}
                       onFocus={handleFocus} 
                       onBlur={handleOutFocus}
                       className="ex-textInput"></input>
                </div>
                <div className="ex-svgWrapper">
                    {validationError.length 
                    ? (
                        <>
                            <img src={`${source}/static/Close - red.svg`} alt="Invalid value icon"/>
                            {focused && (<div className="ex-inputErrorMessage">
                                            {validationError}
                                        </div>)}
                        </>
                    )
                    : <img src={`${source}/static/Confirm.svg`} alt="Valid value icon"/>}
                </div>
            </div>
        </div>
    )
}

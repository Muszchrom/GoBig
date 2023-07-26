import { useRef } from "react"
import { DropdownInput, TextInput, StartEndInput, WeekStartEndInput} from "./TileInputs"
import { source } from "../../../source"

// renders form and children which might be buttons
// initial values are taken from subject or hardcoded like below
// submition passes form data to manageData() prop as object
export default function TileForm({children, subject, manageData}) {
    
    const icon = subject?.icon || "Lektorat.svg"
    const subjectStartEnd = useRef()
    const subjectName = useRef()
    const hall = useRef()
    const additionalInfo = useRef()
    const teacher = useRef()
    const weekStart = useRef()
    const weekEnd = useRef()
    const subjectType = useRef()
    const weekType = useRef()
    const weekStartEnd = useRef()
    

    const validate = (value) => {
        return []
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const weekTypeAsNumber = (() => {
            if (weekType.current.value === "Every week") return 0
            if (weekType.current.value === "Odd weeks") return 1
            if (weekType.current.value === "Even weeks") return 2
        })()

        console.log({
            "start": subjectStartEnd.current.value.split(' - ')[0],
            "end": subjectStartEnd.current.value.split(' - ')[1],
            "subjectName": subjectName.current.value,
            "subjectType": subjectType,
            "hall": hall.current.value,
            "teacher": teacher.current.value,
            "icon": icon,
            "additionalInfo": additionalInfo.current.value,
            "weekStart": parseInt(weekStart.current.vlaue),
            "weekEnd": parseInt(weekEnd.current.vlaue),
            "weekType": weekTypeAsNumber,
        })
        // const weekTypeAsNumber = (() => {
        //     if (weekType === "Every week") return 0
        //     if (weekType === "Odd weeks") return 1
        //     if (weekType === "Even weeks") return 2
        // })()

        // manageData({
        //     "start": subjectStartEnd.split(' - ')[0],
        //     "end": subjectStartEnd.split(' - ')[1],
        //     "subjectName": subjectName.current.value,
        //     "subjectType": subjectType,
        //     "hall": hall.current.value,
        //     "teacher": teacher.current.value,
        //     "icon": icon,
        //     "additionalInfo": additionalInfo.current.value,
        //     "weekStart": parseInt(weekStart),
        //     "weekEnd": parseInt(weekEnd),
        //     "weekType": weekTypeAsNumber,
        // })
    }

    return (
        <form onSubmit={handleSubmit} className="tile-form">
            <h1>PLACEHOLDER</h1>
            {/* Need refactoring, its super bad written */}
            <StartEndInput 
                inputRef={subjectStartEnd} initVal={subject ? 
                    `${subject.start.slice(0, 2)}:${subject.start.slice(3, 5)} - ${subject.end.slice(0, 2)}:${subject.end.slice(3, 5)}` 
                    : "00:00 - 00:00"}
                validatingFuntion={validate}>
                Start - end
            </StartEndInput>

            {/* Normal text, validation same as on API endpoint */}
            <TextInput inputRef={subjectName} initVal={subject?.subjectName || ""} validatingFuntion={validate}>
                Subject Name
            </TextInput>
            
            {/* Normal text, optionally one of options array option */}
            <DropdownInput 
                inputRef={teacher}
                initVal={subject?.teacher || ""}
                options={[]} 
                validatingFuntion={validate}>Teacher</DropdownInput>

            {/* For validation only options from options array are available */}
            <DropdownInput 
                inputRef={subjectType}
                initVal={subject?.subjectType || ""}
                options={["Laboratory", "Lecture", "Classes", "Project", "Foreign language course"]} 
                validatingFuntion={validate}>Subject type</DropdownInput>

            {/* Normal text, validation same as on API endpoint */}
            <TextInput inputRef={hall} initVal={subject?.hall || ""}  validatingFuntion={validate}>
                Hall
            </TextInput>

            {/* For validation only options from options array are available */}
            <DropdownInput 
                inputRef={weekType}
                initVal={subject?.weekType || ""}
                options={["Every week", "Odd weeks", "Even weeks"]} 
                validatingFuntion={validate}>Week type</DropdownInput>

            {/* Whatever integer,  */}
            <WeekStartEndInput inputRef={weekStartEnd} initVal={`${subject?.weekStart || 0} - ${subject?.weekEnd || 0}`}>
                Week Start - End                    
            </WeekStartEndInput>

            {/* Normal text, validation same as on API endpoint */}
            <TextInput inputRef={additionalInfo} initVal={subject?.additionalInfo || ""}  validatingFuntion={validate}> 
                Additional Information
            </TextInput>
            
            <div className='two-buttons-horizontal-container'>
                {children}
                <button type="submit" className="span-button heading1">
                    <span>Save</span>
                    <img className="span-button-icon" src={`${source}/static/Confirm.svg`} alt=""></img>
                </button>
            </div>
        </form>
    )
}


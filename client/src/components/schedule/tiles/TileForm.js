import { useRef } from "react"
import { DropdownInput, TextInput, StartEndInput, WeekStartEndInput} from "./TileInputs"
import { source } from "../../../source"
import { validateTile } from "../../Requests"

// renders form and children which might be buttons
// initial values are taken from subject or hardcoded like below
// submition passes form data to manageData() prop as object
export default function TileForm({children, subject, manageData, _title}) {
    const icon = subject?.icon || "Lektorat.svg"
    const subjectStartEnd = useRef()
    const subjectName = useRef()
    const hall = useRef()
    const additionalInfo = useRef()
    const teacher = useRef()
    const subjectType = useRef()
    const weekType = useRef()
    const weekStartEnd = useRef()

    const handleSubmit = (e) => {
        e.preventDefault()
        const weekTypeAsNumber = (() => {
            if (weekType.current.value === "Every week") return 0
            if (weekType.current.value === "Odd weeks") return 1
            if (weekType.current.value === "Even weeks") return 2
        })()
        const [weekStart, weekEnd] = weekStartEnd.current.value.split(' - ')
        const validationSuccessful = (() => {
            if (validateTile.validateStartEnd(subjectStartEnd.current.value).length) return 0
            if (validateTile.validateSubjectName(subjectName.current.value).length) return 0
            if (validateTile.validateSubjectType(subjectType.current.value).length) return 0
            if (validateTile.validateHall(hall.current.value).length) return 0
            if (validateTile.validateTeacher(teacher.current.value).length) return 0
            if (validateTile.validateAdditionalInfo(additionalInfo.current.value).length) return 0
            if (validateTile.validateWeekStartEnd(weekStart.current.value).length) return 0
            if (validateTile.validateWeekStartEnd(weekEnd.current.value).length) return 0
            if (validateTile.validateWeekType(weekType.current.value).length) return 0
            return 1
        })()
        if (validationSuccessful) {
            manageData({
                "start": subjectStartEnd.current.value.split(' - ')[0],
                "end": subjectStartEnd.current.value.split(' - ')[1],
                "subjectName": subjectName.current.value,
                "subjectType": subjectType.current.value,
                "hall": hall.current.value,
                "teacher": teacher.current.value,
                "icon": icon,
                "additionalInfo": additionalInfo.current.value,
                "weekStart": parseInt(weekStart),
                "weekEnd": parseInt(weekEnd),
                "weekType": weekTypeAsNumber,
            })
        }
    }

    return (
        <form onSubmit={handleSubmit} className="tile-form">
            <h1>{_title}</h1>
            {/* Need refactoring, its super bad written */}
            <StartEndInput 
                inputRef={subjectStartEnd} initVal={subject ? 
                    `${subject.start.slice(0, 2)}:${subject.start.slice(3, 5)} - ${subject.end.slice(0, 2)}:${subject.end.slice(3, 5)}` 
                    : "00:00 - 00:00"}
                validatingFuntion={validateTile.validateStartEnd}>
                Start - end
            </StartEndInput>

            {/* Normal text, validation same as on API endpoint */}
            <TextInput inputRef={subjectName} initVal={subject?.subjectName || ""} validatingFuntion={validateTile.validateSubjectName}>
                Subject Name
            </TextInput>
            
            {/* Normal text, optionally one of options array option */}
            <DropdownInput 
                inputRef={teacher}
                initVal={subject?.teacher || ""}
                options={[]} 
                validatingFuntion={validateTile.validateTeacher}>Teacher</DropdownInput>

            {/* For validation only options from options array are available */}
            <DropdownInput 
                inputRef={subjectType}
                initVal={subject?.subjectType || ""}
                options={["Laboratory", "Lecture", "Classes", "Project", "Foreign language course"]} 
                validatingFuntion={validateTile.validateSubjectType}>Subject type</DropdownInput>

            {/* Normal text, validation same as on API endpoint */}
            <TextInput inputRef={hall} initVal={subject?.hall || ""}  validatingFuntion={validateTile.validateHall}>
                Hall
            </TextInput>

            {/* For validation only options from options array are available */}
            <DropdownInput 
                inputRef={weekType}
                initVal={["Every week", "Odd weeks", "Even weeks"][subject?.weekType] || ""}
                options={["Every week", "Odd weeks", "Even weeks"]} 
                validatingFuntion={validateTile.validateWeekType}>Week type</DropdownInput>

            {/* Whatever integer,  */}
            <WeekStartEndInput inputRef={weekStartEnd} initVal={`${subject?.weekStart || 0} - ${subject?.weekEnd || 0}`} validatingFuntion={validateTile.validateWeekStartEnd}>
                Week Start - End                    
            </WeekStartEndInput>

            {/* Normal text, validation same as on API endpoint */}
            <TextInput inputRef={additionalInfo} initVal={subject?.additionalInfo || ""}  validatingFuntion={validateTile.validateAdditionalInfo}> 
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


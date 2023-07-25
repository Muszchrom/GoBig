import { useRef, useState } from "react"
import { DropdownInput, IconInput, TextInput, StartEndInput } from "./TileInputs"
import { source } from "../../../source"

// renders form and children which might be buttons
// initial values are taken from subject or hardcoded like below
// submition passes form data to manageData() prop as object
export default function TileForm({children, subject, manageData}) {
    // const [subjectStartEnd, setSubjectStartEnd] = useState(subject 
    //     ? `${subject.start.slice(0, 2)}:${subject.start.slice(3, 5)} - ${subject.end.slice(0, 2)}:${subject.end.slice(3, 5)}` 
    //     : "00:00 - 00:00")
    // const [subjectType, setSubjectType] = useState(subject?.subjectType || ["Laboratory", "Lecture", "Classes", "Project", "Foreign language course"][0])
    const [icon, setIcon] = useState(subject?.icon || "Lektorat.svg")
    const [weekType, setWeekType] = useState(['Every week', 'Odd weeks', 'Even weeks'][subject?.weekType || 0])

    const subjectStartEnd = useRef()
    const subjectName = useRef()
    const hall = useRef()
    const additionalInfo = useRef()
    const teacher = useRef()
    const weekStart = useRef()
    const weekEnd = useRef()
    const subjectType = useRef()
    

    const validate = (value) => {
        return []
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const weekTypeAsNumber = (() => {
            if (weekType === "Every week") return 0
            if (weekType === "Odd weeks") return 1
            if (weekType === "Even weeks") return 2
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
            {/* <IconInput currentState={icon} changeState={setIcon}/> */}
            {/* <StartEndInput _name="start-end" removeMe={setIcon} start={subjectStartEnd.split(' - ')[0]} end={subjectStartEnd.split(' - ')[1]} startEnd={subjectStartEnd} setStartEnd={setSubjectStartEnd}>Start - End</StartEndInput> */}
            <StartEndInput 
                inputRef={subjectStartEnd} initVal={subject ? 
                    `${subject.start.slice(0, 2)}:${subject.start.slice(3, 5)} - ${subject.end.slice(0, 2)}:${subject.end.slice(3, 5)}` 
                    : "00:00 - 00:00"}
                validatingFuntion={validate}>
                Start - end
            </StartEndInput>
            <TextInput inputRef={subjectName} initVal={subject?.subjectName || ""} validatingFuntion={validate}>
                Subject Name
            </TextInput>
            
            <TextInput inputRef={teacher} initVal={subject?.teacher || ""} validatingFuntion={validate}>
                Teacher
            </TextInput>
            
            {/* <DropdownInput 
                _name="subject-type"
                options={["Laboratory", "Lecture", "Classes", "Project", "Foreign language course"]} 
                currentState={subjectType}
                changeState={setSubjectType}>Subject type</DropdownInput> */}
            <DropdownInput 
                inputRef={subjectType}
                initVal={subject?.subjectType || ""}
                options={["Laboratory", "Lecture", "Classes", "Project", "Foreign language course"]} 
                validatingFuntion={validate}>Subject type</DropdownInput>

            <TextInput inputRef={hall} initVal={subject?.hall || ""}  validatingFuntion={validate}>
                Hall
            </TextInput>

            <DropdownInput 
                _name="week-type"
                options={['Every week', 'Odd weeks', 'Even weeks']} 
                currentState={weekType}
                changeState={setWeekType}>Week type</DropdownInput>

            <TextInput inputRef={weekStart} initVal={subject?.weekStart || 0} validatingFuntion={validate}>
                Week start
            </TextInput>
            
            <TextInput inputRef={weekEnd} initVal={subject?.weekEnd || 0} validatingFuntion={validate}>
                Week end
            </TextInput>

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


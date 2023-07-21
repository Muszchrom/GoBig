import { useState } from "react"
import { StartEndInput, DropdownInput, TextInput, TextInputBigger, IconInput } from "./TileInputs"
import { source } from "../../../source"

// renders form and children which might be buttons
// initial values are taken from subject or hardcoded like below
// submition passes form data to manageData() prop as object
export default function TileForm({children, subject, manageData}) {
    const [subjectStartEnd, setSubjectStartEnd] = useState(subject 
        ? `${subject.start.slice(0, 2)}:${subject.start.slice(3, 5)} - ${subject.end.slice(0, 2)}:${subject.end.slice(3, 5)}` 
        : "00:00 - 00:00")
    const [subjectName, setSubjectName] = useState(subject?.subjectName || "")
    const [subjectType, setSubjectType] = useState(subject?.subjectType || ["Laboratory", "Lecture", "Classes", "Project", "Foreign language course"][0])
    const [hall, setHall] = useState(subject?.hall || "")
    const [teacher, setTeacher] = useState(subject?.teacher || "")
    const [icon, setIcon] = useState(subject?.icon || "Lektorat.svg")
    const [additionalInfo, setAdditionalInfo] = useState(subject?.additionalInfo || "")
    const [weekType, setWeekType] = useState(['Every week', 'Odd weeks', 'Even weeks'][subject?.weekType || 0])
    const [weekStart, setWeekStart] = useState(subject?.weekStart || 0)
    const [weekEnd, setWeekEnd] = useState(subject?.weekEnd || 0)

    const handleSubmit = (e) => {
        e.preventDefault()
        const weekTypeAsNumber = (() => {
            if (weekType === "Every week") return 0
            if (weekType === "Odd weeks") return 1
            if (weekType === "Even weeks") return 2
        })()

        manageData({
            "start": subjectStartEnd.split(' - ')[0],
            "end": subjectStartEnd.split(' - ')[1],
            "subjectName": subjectName,
            "subjectType": subjectType,
            "hall": hall,
            "teacher": teacher,
            "icon": icon,
            "additionalInfo": additionalInfo,
            "weekStart": weekStart,
            "weekEnd": weekEnd,
            "weekType": weekTypeAsNumber,
        })
    }

    return (
        <form onSubmit={handleSubmit} className="tile-form">
            {/* REMOVE SHIT IN STARTENDINPUT RIGHT BELOW */}
            <StartEndInput removeMe={setIcon} start={subjectStartEnd.split(' - ')[0]} end={subjectStartEnd.split(' - ')[1]} startEnd={subjectStartEnd} setStartEnd={setSubjectStartEnd}>Start - End</StartEndInput>
            <TextInputBigger currentState={subjectName} changeState={setSubjectName}>Subject name</TextInputBigger>
            <TextInput currentState={teacher} changeState={setTeacher}>Teacher</TextInput>
            <DropdownInput 
                options={["Laboratory", "Lecture", "Classes", "Project", "Foreign language course"]} 
                currentState={subjectType}
                changeState={setSubjectType}>Subject type</DropdownInput>
            <TextInput currentState={hall} changeState={setHall}>Hall</TextInput>
            <TextInput currentState={additionalInfo} changeState={setAdditionalInfo}>Additional information</TextInput>
            <DropdownInput 
                options={['Every week', 'Odd weeks', 'Even weeks']} 
                currentState={weekType}
                changeState={setWeekType}>Week type</DropdownInput>
            <TextInput currentState={weekStart} changeState={setWeekStart}>Week start</TextInput>
            <TextInput currentState={weekEnd} changeState={setWeekEnd}>Week end</TextInput>
            <IconInput currentState={icon} changeState={setIcon}/>
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


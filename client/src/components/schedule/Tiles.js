import { useState, useEffect } from 'react'
import { source } from "../../source"

import TileData from './tiles/TileData'
import TileEdit from './tiles/TileEdit'
import TileCreate from './tiles/TileCreate'

import Labo from '../../graphics/svgs/Labo.svg'
import Lecture from '../../graphics/svgs/Lecture.svg'
import ForeignLanguageCourse from '../../graphics/svgs/Lektorat.svg'
import Classes from '../../graphics/svgs/Exercises.svg'
import Project from '../../graphics/svgs/Default.svg'

export function CommonTile({subject, editMode,  setEditMode, specialType, signedIn, updateScheduleWithoutApiCall, uniqueKey, groupState}) {
    const [open, setOpen] = useState(false)
    const [editingTile, setEditingTile] = useState(false)

    // effect that hides scrollbar when overlay is open
    useEffect(() => {
        open ? document.querySelector('body').style.overflow = "hidden"
             : document.querySelector('body').style.overflow = "auto"

        const lsitenForEscapeKey = (e) => {
            e.key === "Escape" && setOpen(false)
        }

        open && document.addEventListener("keydown", lsitenForEscapeKey)
        return () => {
            document.removeEventListener("keydown", lsitenForEscapeKey)
        }
    }, [open])

    useEffect(() => {
        setOpen(false)
    }, [editMode])

    return (
    <>
        <div style={{position: "relative"}}>
            <div onKeyPress={(e) => e.key === "Enter" && setOpen(!open)} 
                onClick={() => setOpen(!open)} 
                role="button" 
                tabIndex="0" 
                className="tile" 
                style={{background: specialType === "not today" ? "gray" : subject.onClient_color}}
            >
                <div className="tile-inner">
                    <div className="tile-text-conatiner">
                        <span className="no-select text1">{subject.start} - {subject.end}{specialType === "not today" && " ⛔"}</span>
                        <span className="no-select heading2">{subject.subjectName}</span>
                    </div>
                    <div className="tile-icon-container">
                        <img src={
                            subject.subjectType === 'Laboratory' ? Labo :
                            subject.subjectType === 'Lecture' ? Lecture :
                            subject.subjectType === 'Classes' ? Classes :
                            subject.subjectType === 'Foreign language course' ? ForeignLanguageCourse :
                            subject.subjectType === 'Project' ? Project : Project
                        } alt=""/>
                    </div>
                </div>
            </div>
            {!!editMode && (
                <div role="button" className="tile-edit-button" onClick={() => setEditingTile(!editingTile)}>
                    <img className="tile-edit-button-image" src={`${source}/static/Edit.svg`} alt=""></img>
                </div>
            )}
        </div>

        {open && <TileData color={specialType === "not today" ? "gray" : subject.onClient_color} 
                           setOpen={setOpen} 
                           open={open} 
                           subject={subject} 
                           editMode={editMode} 
                           setEditMode={setEditMode}
                           groupState={groupState}
                           signedIn={signedIn}/>}

        {editingTile && <TileEdit open={editingTile}
                                  setOpen={setEditingTile}
                                  subject={subject}
                                  updateScheduleWithoutApiCall={updateScheduleWithoutApiCall}
                                  uniqueKey={uniqueKey}
                                  color={specialType === "not today" ? "gray" : subject.onClient_color} />}
    </>
    )
}

export function WaitingTile() {
    return (<div className="tile animated-background"></div>)
}

export function CreateTile({updateScheduleWithoutApiCall}) {
    const [creatingTile, setCreatingTile] = useState(false)
    return (
        <>
            <div className="tile create-tile" type="button" onClick={() => setCreatingTile(!creatingTile)}>
                <button className="create-tile-inner" >
                </button>
            </div>
            {creatingTile && <TileCreate open={creatingTile}
                                         updateScheduleWithoutApiCall={updateScheduleWithoutApiCall}
                                         setOpen={setCreatingTile}
                                         color={"#FAEBD7"}/>}
        </>
    )
}
  
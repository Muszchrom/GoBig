import { useState, useEffect } from 'react'
import { source } from "../../source"

import TileData from './tiles/TileData'
import TileEdit from './tiles/TileEdit'
import TileCreate from './tiles/TileCreate'

export function CommonTile({subject, color, editMode,  setEditMode, specialType, signedIn}) {
    const [open, setOpen] = useState(false)
    const [editingTile, setEditingTile] = useState(false)

    // effect that hides scrollbar when overlay is open
    useEffect(() => {
        open ? document.querySelector('body').style.overflow = "hidden"
             : document.querySelector('body').style.overflow = "auto"

        open && document.addEventListener("keydown", (e) => {
            e.keyCode === 27 && setOpen(false)});
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
                style={{background: color}}
            >
                <div className="tile-inner">
                    <div className="tile-text-conatiner">
                        <span className="no-select text1">{subject.start} - {subject.end}{specialType === "not today" && " ⛔"}</span>
                        <span className="no-select heading2">{subject.subjectName}</span>
                    </div>
                    <div className="tile-icon-container">
                        <img src={`${source}/static/${subject.icon}`} alt=""/>
                    </div>
                </div>
            </div>
            {!!editMode && (
                <div role="button" className="tile-edit-button" onClick={() => setEditingTile(!editingTile)}>
                    <img className="tile-edit-button-image" src={`${source}/static/Edit.svg`} alt=""></img>
                </div>
            )}
        </div>

        {open && <TileData color={color} 
                           setOpen={setOpen} 
                           open={open} 
                           subject={subject} 
                           editMode={editMode} 
                           setEditMode={setEditMode}
                           signedIn={signedIn}/>}

        {editingTile && <TileEdit open={editingTile}
                                  setOpen={setEditingTile}
                                  subject={subject}
                                  color={color} />}
    </>
    )
}

export function WaitingTile() {
    return (<div className="tile animated-background"></div>)
}

export function CreateTile() {
    const [creatingTile, setCreatingTile] = useState(false)
    return (
        <>
            <div className="tile create-tile" type="button" onClick={() => setCreatingTile(!creatingTile)}>
                <button className="create-tile-inner" >
                </button>
            </div>
            {creatingTile && <TileCreate open={creatingTile}
                                         setOpen={setCreatingTile}
                                         color={"#FAEBD7"}/>}
        </>
    )
}
  
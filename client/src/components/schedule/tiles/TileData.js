import { Overlay } from "../../Overlay"
import { source } from "../../../source"

export default function TileData({color, setOpen, open, subject, setEditMode, editMode, signedIn, groupState}) {
    return (
        <Overlay backgroundColor={color} setOpen={setOpen} open={open}>
            <span className="heading2">{subject.start} - {subject.end}</span>
            <span className="heading1">{subject.subjectName}</span>
            <span className="heading2">{subject.teacher}</span>
            <span className="heading2">{subject.subjectType}, {subject.hall}</span>
            {!!subject.additionalInfo.length && <span className="heading2">{subject.additionalInfo}</span>}
            {!subject.weekType === 0 && (subject.weekType === 1 ? 
                (<span className="heading2">Odd weeks</span>) : 
                (<span className="heading2">Even weeks</span>)
            )}
            {!(subject.weekStart === subject.weekEnd & subject.weekStart === -1) && (
                <span className="heading2">Week {subject.weekStart === -1 ? "0" : subject.weekStart} - {subject.weekEnd === -1 ? "999" : subject.weekEnd}</span>
            )}
            {signedIn && (groupState.privileges <= 1) && (
                <div role="button" onClick={() => setEditMode(!editMode)} className="span-button heading1">
                    <span>{ editMode ? "Exit edit mode" : "Enter edit mode" }</span>
                    <img src={ editMode ? `${source}/static/Close.svg` : `${source}/static/Edit.svg` } alt=""></img>
                </div>
            )}
            <img className="overlay-svg" style={{pointerEvents: "none"}} src={`${source}/static/${subject.icon}`} alt="School graduation hat"/>
        </Overlay>
    )
}
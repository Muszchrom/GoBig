import { useEffect, useState, useRef, Children } from "react"
import { Overlay } from "./Overlay"
import Draggable from 'react-draggable'
import { semesterSchedule, patchSemesterScheduleDay, patchSemesterScheduleWeek } from "./Requests"
import TileUploadModal from "./schedule/tiles/TileUploadModal"

export default function Semester({handleClose}) {
    const [fetchedData, setFetchedData] = useState({})
    useEffect(() => {
        (async () => {
            const data = await semesterSchedule()
            data && setFetchedData(data)
        })()
    }, [])
    return (
        <Overlay backgroundColor={"var(--Background)"} setOpen={handleClose} open={true}>
            <h1 style={{marginTop: "7px", width: "90%"}}>Semester schedule</h1>
            {fetchedData.dates
                ? fetchedData.dates.map((item, index) => {
                    return (
                        <div key={`1${index}`} style={{minWidth: "fit-content", margin: "0 -1em"}}>
                            <div style={{display: "flex", textAlign: "center"}}>
                                <div className="monthHeader">
                                    {["January", "February", "March", "April", "May", "June",
                                    "July", "August", "September", "October", "November", "December"][new Date(item.month).getMonth()]}
                                </div>
                                <div className="monthSemesterName">
                                    "Placeholder"
                                </div>
                            </div>

                            <div style={{borderTop: "2px solid var(--Lightcoral)", borderTopRightRadius: "2px"}}>
                                <CalendarTable weeks={item.weeks} monthId={item.month}/>
                            </div>  
                        </div>
                    )
                })
                : (
                    fetchedData.status === 401 
                        ? <>you need to be logged in</>
                        : <>nothing to show yet</>
                )
            }
        </Overlay>
    )
}

function CalendarTable({weeks, monthId}) {
    return (
        <table className="calendarTable">
            <tbody>
                {weeks.map((week, index) => {
                    return <MonthsRow key={`2${index}`} week={week} monthId={monthId} style={{backgroundColor: index%2 ? "var(--Color4)" : "var(--Color3)"}}/>
                })}
            </tbody>
        </table>
    )
}

function MonthsRow({week, monthId, style}) {
    return (
        <tr className="calendarRow" style={style}>
            <WeekType weekNum={week.week} weekType={week.type}/>
            {week.days.map((item, index) => {
                return <DayComponent key={`3${index}`} day={item} monthId={monthId}/>
            })}
        </tr>
    )
}

function WeekType({weekNum, weekType}) {
    const [show, setShow] = useState(false)
    const [showUplaodModal, setShowuploadModal] = useState(false)
    const [typeState, setTypeState] = useState(weekType)
    const [tempTypeState, setTempTypeState] = useState(0)

    const type = (() => {
        if (typeState === 0) return ""
        if (typeState === 1) return "I"
        if (typeState === 2) return "II"
        return "Err"
    })()

    const prepareUploadStates = (type) => {
        setShowuploadModal(true)
        setTempTypeState(type)
    }
    
    const uploadChangesToApi = async () => {
        const errors = await patchSemesterScheduleWeek({
            week: weekNum,
            type: tempTypeState,
        })
        if (!errors.length) {
            setTypeState(tempTypeState)
        }
        return errors
    }

    return (<>
        <td onClick={type !== 0 ? (() => setShow(true)) : null}>
            {`${type} ${weekNum}`}
            {show && <ContextWindowForWeekType handleClose={setShow} data={{title: `№ ${weekNum}, ${type === 1 ? "Odd" : (type === 2 ? "Even" : "Unset")}`, type: typeState}} submitFunction={prepareUploadStates}/>}
            {showUplaodModal && <TileUploadModal 
                                        color="var(--Background)" 
                                        handleClose={() => setShowuploadModal(false)} 
                                        handleSoftClose={() => setShowuploadModal(false)} 
                                        submitFunction={uploadChangesToApi}>
                                            Upload changes?
                                    </TileUploadModal>}
        </td>
    </>)
}

function DayComponent({day, monthId}) {
    const [dayState, setDayState] = useState(day)
    const [tempDayState, setTempDayState] = useState({}) // changes only when prepareUploadStates is executed, no big deal
    const [show, setShow] = useState(false) // this one changes quite a lot
    const [showUplaodModal, setShowuploadModal] = useState(false) // changes after prepareUploadStates so not big deal

    const date = new Date(day.day)
    const dateTitle = `${date.getDate()} ${["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][date.getMonth()]} ${date.getFullYear()}`

    const styles = (() => {
        if (dayState.type === 0) return {opacity: 0.5}
        if (dayState.type === 3) return {backgroundColor: "var(--Color8)"}
        if (dayState.type === 4) return {backgroundColor: "var(--Color5)"}
        if (dayState.type === 5) return {backgroundColor: "var(--Color7)"}
        if (dayState.type === 2 || dayState.message.length > 0) return {backgroundColor: "var(--Color1)"}
        return {}
    })()

    const prepareUploadStates = ({message, type}) => {
        setShowuploadModal(true)
        setTempDayState({message: message, type: type})
    }

    const uploadChangesToApi = async () => {
        const errors = await patchSemesterScheduleDay({
            month: monthId,
            day: day.day,
            type: tempDayState.type,
            message: tempDayState.message
        })
        if (!errors.length) {
            dayState.message = tempDayState.message
            dayState.type = tempDayState.type
            setDayState({...dayState})
        }
        return errors
    }

    return (
        <>
            <td onClick={day.type !== 0 ? () => setShow(true) : null} style={styles} className={dayState.type !== 0 && dayState.type !== 1 || dayState.message.length ? "cellOfType" : ""}>
                {date.getDate()}
                {show && <ContextWindow handleClose={setShow} data={{title: dateTitle, message: dayState.message, type: dayState.type}} submitFunction={prepareUploadStates}/>}
                {showUplaodModal && <TileUploadModal 
                                        color="var(--Background)" 
                                        handleClose={() => setShowuploadModal(false)} 
                                        handleSoftClose={() => setShowuploadModal(false)} 
                                        submitFunction={uploadChangesToApi}>
                                            Upload changes?
                                    </TileUploadModal>}
            </td>
        </>
    )
}

function ContextWindow({handleClose, data, submitFunction}) {
    const [editMode, setEditMode] = useState(false)
    const [dataState, setDataState] = useState(data)

    const nodeRef = useRef(null)

    const changeType = () => {
        console.log(dataState.type)
        if (dataState.type === 1) dataState.type = 3
        else if (dataState.type === 3) dataState.type = 4
        else if (dataState.type === 4) dataState.type = 5
        else if (dataState.type === 5) dataState.type = 1
        else dataState.type = 1
        setDataState({...dataState})
    }

    const handleSaveChanges = () => {
        setEditMode(!editMode)
        submitFunction({message: dataState.message, type: dataState.type})
    }

    return (
        <Draggable handle="#handle" nodeRef={nodeRef}>
            <div ref={nodeRef} className="contextWindow">
                <div className="contextWindowHeader">
                    <div id="handle" className="contextWindowText">
                        <span>{data.title}</span>
                    </div>
                    <button onClick={(e) => {e.stopPropagation(); handleClose(false)}} style={{backgroundColor: "transparent", border: "none", outline: "none", fontWeight: "bold", fontSize: "24px", width: "36px", height: "36px"}}>X</button>
                </div>
                <div className="contextWindowMessage">
                    {editMode
                        ? <textarea value={dataState.message} onChange={(e) => {dataState.message = e.target.value; setDataState({...dataState})}} className="ex-textInput ex-activeInput" style={{height: "100%"}}></textarea>
                        : <textarea value={dataState.message} disabled className="ex-textInput" style={{height: "100%"}}></textarea>}
                    <div className="contextWindowButtonsWrapper">
                        {editMode 
                            ? (<>
                                <button onClick={changeType} title="Change day type" className="contextWindowButton contextWindowButtonWide">
                                    {dataState.type === 1 
                                        ? (<span style={{fontWeight: "bold"}}>Unset</span>) 
                                        : (dataState.type === 3 ? (<>
                                                <span style={{fontWeight: "bold"}}>Day off</span>
                                                <Svgs whichOne={4}/>
                                            </>) : (dataState.type === 4 ? (<>
                                                <span style={{fontWeight: "bold"}}>Test</span>
                                                <Svgs whichOne={3}/>
                                            </>) : (<>
                                                <span style={{fontWeight: "bold"}}>Exam</span>
                                                <Svgs whichOne={2}/>
                                            </>)))}
                                </button>
                                <button title="Save changes" onClick={handleSaveChanges} className="contextWindowButton">                                    
                                    <Svgs whichOne={1}/>
                                </button>
                            </>) 
                            : (<>
                                <button title="Edit day" onClick={() => setEditMode(!editMode)} className="contextWindowButton">
                                    <Svgs whichOne={0}/>
                                </button>
                            </>)}
                    </div>
                </div>
            </div>
        </Draggable>
    )
}

function ContextWindowForWeekType({handleClose, data, submitFunction}) {
    const [editMode, setEditMode] = useState(false)
    const [type, setType] = useState(data.type)

    const nodeRef = useRef(null)

    const changeType = () => {
        if (type === 0) setType(1)
        else if (type === 1) setType(2)
        else setType(0)
    }

    const handleSaveChanges = () => {
        setEditMode(!editMode)
        submitFunction(type)
    }

    return (
        <Draggable handle="#handle" nodeRef={nodeRef}>
            <div ref={nodeRef} className="contextWindow" style={{height: "unset"}}>
                <div className="contextWindowHeader">
                    <div id="handle" className="contextWindowText">
                        <span>{data.title}</span>
                    </div>
                    <button onClick={(e) => {e.stopPropagation(); handleClose(false)}} style={{backgroundColor: "transparent", border: "none", outline: "none", fontWeight: "bold", fontSize: "24px", width: "36px", height: "36px"}}>X</button>
                </div>
                <div className="contextWindowMessage">
                    <div className="contextWindowButtonsWrapper">
                        {editMode 
                            ? (<>
                                <button onClick={changeType} title="Change week type" className="contextWindowButton contextWindowButtonWide">
                                    {type === 0 
                                        ? (<span style={{fontWeight: "bold"}}>Unset</span>) 
                                        : (type === 1 ? (<>
                                                <span style={{fontWeight: "bold"}}>Odd</span>
                                                <Svgs whichOne={3}/>
                                            </>) : (<>
                                                    <span style={{fontWeight: "bold"}}>Even</span>
                                                    <Svgs whichOne={2}/>
                                                </>))}
                                </button>
                                <button title="Save changes" onClick={handleSaveChanges} className="contextWindowButton">                                    
                                    <Svgs whichOne={1}/>
                                </button>
                            </>) 
                            : (<>
                                <div style={{backgroundColor: "var(--Background)"}} className="contextWindowButton contextWindowButtonWide">
                                    {type === 0 
                                        ? (<span style={{fontWeight: "bold"}}>Unset</span>) 
                                        : (type === 1 ? (<>
                                                <span style={{fontWeight: "bold"}}>Odd</span>
                                                <Svgs whichOne={3}/>
                                            </>) : (<>
                                                    <span style={{fontWeight: "bold"}}>Even</span>
                                                    <Svgs whichOne={2}/>
                                                </>))}
                                </div>
                                <button title="Edit day" onClick={() => setEditMode(!editMode)} className="contextWindowButton">
                                    <Svgs whichOne={0}/>
                                </button>
                            </>)}
                    </div>
                </div>
            </div>
        </Draggable>
    )
}

function Svgs({whichOne}) {
    if (whichOne === 0) return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M4.5 15L3 20.5L8.5 19M4.5 15L13.5 6M4.5 15C5.33333 14.8333 7 14.9 7 16.5M8.5 19L17.5 10M8.5 19C8.66667 18.1667 8.6 16.5 7 16.5M13.5 6L16.5 3L20.5 7L17.5 10M13.5 6L15.5 8M17.5 10L15.5 8M15.5 8L7 16.5" strokeWidth="1.5" stroke="#322F2B" strokeLinejoin="round"/>
        </svg>)
    
    else if (whichOne === 1) return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M7 13L12 20L20 4.15643" stroke="#322F2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>)
    
    else if (whichOne === 2) return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12V19H16.1111M19 5.1875L15.75 2M19 5.1875H15.75V2M19 5.1875V7.5M15.75 2H6V3.5" stroke="#322F2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M5.25 7.5H9.75M5.25 9.75H12M5.25 12H10.875" stroke="#322F2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M18.625 7.625L19.75 6.5L22 8.75L20.875 9.875M18.625 7.625L20.875 9.875M18.625 7.625L11.875 14.375M20.875 9.875L14.125 16.625M14.125 16.625L10.75 17.75L11.875 14.375M14.125 16.625L11.875 14.375" stroke="#322F2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16 10V7.1875M16 7.1875L12.75 4M16 7.1875H12.75V4M12.75 4H3V21H16V15" stroke="#322F2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>)
    
    else if (whichOne === 3) return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.25 7.5H9.75M5.25 9.75H12M5.25 12H10.875" stroke="#322F2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M17.625 8.625L18.75 7.5L21 9.75L19.875 10.875M17.625 8.625L19.875 10.875M17.625 8.625L10.875 15.375M19.875 10.875L13.125 17.625M13.125 17.625L9.75 18.75L10.875 15.375M13.125 17.625L10.875 15.375" stroke="#322F2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M16.5 9.75V6.375M16.5 6.375L13.125 3M16.5 6.375H13.125V3M13.125 3H3V21H16.5V14.25" stroke="#322F2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>)
    
    else if (whichOne === 4) return (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M2 9V20H22V9M2 9V5.5H6M2 9H22M22 9V5.5H18M13 11.5L19 17.5M19 11.5L13 17.5M5 12H6.5H8M5 14.5H6.5H8M5 17H8M6 5.5V4M6 5.5H18M18 5.5V4" stroke="#322F2B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>)
}
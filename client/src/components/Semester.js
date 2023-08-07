import { useEffect, useState, useRef } from "react"
import { Overlay } from "./Overlay"
import Draggable from 'react-draggable';
import { source } from "../source";

export default function Semester({handleClose}) {
    const [fetchedData, setFetchedData] = useState({})
    useEffect(() => {
        (async () => {
            let data = await fetch(`${source}/calendar/`, {
                method: "GET",
                credentials: "include"
            })
            data = await data.json()
            setFetchedData(data.data)
        })()
    }, [])
    return (
        <Overlay backgroundColor={"var(--Background)"} setOpen={handleClose} open={true}>
            <h1 style={{marginTop: "7px", width: "90%"}}>Semester schedule</h1>
            {fetchedData.dates && !!Object.keys(fetchedData).length 
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
                                <CalendarTable weeks={item.weeks}/>
                            </div>  
                        </div>
                    )
                })
                : <></>
            }
        </Overlay>
    )
}

function CalendarTable({weeks}) {
    return (
        <table className="calendarTable">
            <tbody>
                {weeks.map((week, index) => {
                    return <MonthsRow key={`2${index}`} week={week}/>
                })}
            </tbody>
        </table>
    )
}

function MonthsRow({week}) {
    return (
        <tr className="calendarRow">
            <WeekType weekNum={week.week} weekType={week.type}/>
            {week.days.map((item, index) => {
                return <DayComponent key={`3${index}`} day={item}/>
            })}
        </tr>
    )
}

function WeekType({weekNum, weekType}) {
    const type = (() => {
        if (weekType === 0) return ""
        if (weekType === 1) return "I"
        if (weekType === 2) return "II"
        return "Err"
    })()
    return <SingleCell>{`${type} ${weekNum}`}</SingleCell>
}

function DayComponent({day}) {
    const date = new Date(day.day).getDate()
    return <SingleCell type={day.type}>{date}</SingleCell>
}

function SingleCell({children, type}) {
    const [show, setShow] = useState(false)

    const styles = (() => {
        if (type === 0) return {opacity: 0.5}
        if (type === 2) return {background: "linear-gradient(43deg, rgba(233,43,43,0.6530987394957983) 2%, rgba(18,199,191,0) 58%)"}
        if (type === 3) return {background: "linear-gradient(43deg, rgba(225,43,233,0.6530987394957983) 2%, rgba(18,199,191,0) 58%)"}
        return {}
    })()

    return (
        <>
            <td onClick={type !== 0 ? (() => setShow(true)) : () => {}} style={styles}>
                {children}
            {show && <ContextWindow handleClose={setShow} data={{title: "19 nov 2023", message: "Hello world!"}}/>}
            </td>
        </>
    )
}

function ContextWindow({handleClose, data}) {
    const nodeRef = useRef(null)
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
                    <span>{data.message}</span>
                    <div className="contextWindowButton">
                        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M4.5 15L3 20.5L8.5 19M4.5 15L13.5 6M4.5 15C5.33333 14.8333 7 14.9 7 16.5M8.5 19L17.5 10M8.5 19C8.66667 18.1667 8.6 16.5 7 16.5M13.5 6L16.5 3L20.5 7L17.5 10M13.5 6L15.5 8M17.5 10L15.5 8M15.5 8L7 16.5" strokeWidth="1.5" stroke="#322F2B" strokeLinejoin="round"/>
                        </svg>
                    </div>
                </div>
            </div>
        </Draggable>
    )
}
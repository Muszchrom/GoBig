import { useEffect, useState } from "react"
import { Overlay } from "./Overlay"

// Dont use state in this component, re rendering is super costly
/*
dates = [
    {
        monthId: currentMonth,
        monthName: monthNames[currentMonth],
        semesterType: "Winter semester"
        arrayOfWeeks: [
            {
                weekId: 1,
                weekType: 1/2,
                weekDates: [
                    {
                        date: 31,
                        gray: true
                    },
                    {
                        date: 1,
                        gray: false
                    },
                    ...
                ]
            },
            ...
        ],
        semesterType: "Winter semester"
    },
    ...
]
*/
export default function Semester({handleClose}) {
    // week numbering is relative to semester start
    const semesterStartEnd = ["10 1 2023", "2 31 2024"]
    
    const monthSkeleton = (startingDate, functionState) => {
        const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]
        let currentMonth = startingDate.getMonth()
        let arrayOfWeeks = []
        let firstDayOfWeekIsNotMonday = false

        // this object helps figure out week in which we are at next funciton call
        const newFunctionState = {
            maxWeekId: functionState.maxWeekId,
            incrementFirstWeekId: true
        }

        // shift date back to make first array of dates 7 elements long
        if (startingDate.getDay() !== 1) {
            firstDayOfWeekIsNotMonday = true
            if (startingDate.getDay() === 0) {
                startingDate = new Date(startingDate.setDate(startingDate.getDate() - 6))
            } else {
                startingDate = new Date(startingDate.setDate(startingDate.getDate() - startingDate.getDay() + 1))
            }
        }

        // create first row/week of the month
        let arrayOfDays = []
        for (let i=1; i<8; i++) {
            arrayOfDays.push({
                date: new Date(startingDate.setDate(startingDate.getDate() - startingDate.getDay() + i)).getDate(),
                gray: false
            })
        }

        // mark days of previous month in first row
        if (firstDayOfWeekIsNotMonday) {
            for (let i=0; i<arrayOfDays.length; i+=1) {
                if (arrayOfDays[i].date < arrayOfDays[i+1].date) {
                    arrayOfDays[i].gray = true
                } else {
                    arrayOfDays[i].gray = true
                    break
                }
            }
        }
        newFunctionState.maxWeekId = functionState.incrementFirstWeekId ? functionState.maxWeekId + 1 : functionState.maxWeekId
        
        arrayOfWeeks.push({
            weekId: newFunctionState.maxWeekId,
            weekDates: arrayOfDays
        })

        // create remaining rows of the month
        while(currentMonth === new Date(new Date(startingDate).setDate(startingDate.getDate() - startingDate.getDay() + 1)).getMonth()) {
            arrayOfDays = []
            for (let i=1; i<8; i++) {
                arrayOfDays.push({
                    date: new Date(startingDate.setDate(startingDate.getDate() - startingDate.getDay() + i)).getDate(),
                    gray: false
                })
            }
            newFunctionState.maxWeekId += 1
            arrayOfWeeks.push({
                weekId: newFunctionState.maxWeekId,
                weekDates: arrayOfDays
            })
        }

        // mark days of the next month
        if (arrayOfWeeks[arrayOfWeeks.length-1].weekDates[6].date < 8) {
            newFunctionState.incrementFirstWeekId = false // next function call will not increment week id on the first row, because it will exist both in the current week and the next one
            for (let i=arrayOfWeeks[arrayOfWeeks.length-1].weekDates.length-1; i>0; i-=1) {
                if (arrayOfWeeks[arrayOfWeeks.length-1].weekDates[i].date > arrayOfWeeks[arrayOfWeeks.length-1].weekDates[i-1].date) {
                    arrayOfWeeks[arrayOfWeeks.length-1].weekDates[i].gray = true
                } else {
                    arrayOfWeeks[arrayOfWeeks.length-1].weekDates[i].gray = true
                    break
                }
            }
        }

        return [newFunctionState, {
            monthId: currentMonth,
            monthName: monthNames[currentMonth],
            arrayOfWeeks: arrayOfWeeks,
            semesterType: "Winter semester"
        }]
    }
    
    // create object for every month in date range
    const dates = (() => {
        let dateStart = new Date(semesterStartEnd[0])
        const dateEnd = new Date(semesterStartEnd[1])
        let d = []

        let monthSkeletonState = {
            maxWeekId: 0,
            incrementFirstWeekId: true
        }

        while (dateStart < dateEnd) {
            const returnedVal = monthSkeleton(new Date(dateStart), monthSkeletonState) // create copy of dateStart
            monthSkeletonState = returnedVal[0]
            d.push(returnedVal[1])
            dateStart = new Date(dateStart.setMonth(dateStart.getMonth() + 1))
        }
        return d
    })()

    console.log(dates)

    return (
        <Overlay backgroundColor={"var(--Background)"} setOpen={handleClose} open={true}>
            <h1 style={{marginTop: "7px"}}>Semester schedule</h1>
            {dates.map((month) => {
                return <SemestersMonth monthsObject={month} key={month.monthId}/>
            })}
            <Interactions />
        </Overlay>
    )
}

function Interactions() {
    const [open, setOpen] = useState(false)
    const [data, setData] = useState('')

    useEffect(() => {
        const el = document.getElementById(data)
        if (el) {
            el.classList.add("cellActive")
        }
        return () => {
            const el = document.getElementById(data)
            if (el) {
                el.classList.remove("cellActive")
            }
        }
    }, [data])

    useEffect(() => {
        const listeningFunction = (e) => {
            console.log(e.target.id)
            console.log(typeof(e.target.id))
            if (e.target.id.match(/^[0-9]/)) {
                setOpen(true)
                setData(e.target.id)
            }
        }
        document.addEventListener('mousedown', listeningFunction)
        return () => {
            document.removeEventListener('mousedown', listeningFunction)
        }
    }, [])

    const styles = {
        backgroundColor: "var(--Background)",
        position: "fixed",
        border: "2px solid var(--Lightcoral)",
        boxShadow: "var(--Shadow)",
        borderRadius: "12px",
        width: "50vw",
        height: "50vw",
        maxWidth: "200px",
        maxHeight: "200px"
    }
    return (
        <>
        {
            open && (
                <div style={styles}>
                    <div style={{padding: "4px", borderRadius: "6px 6px 0 0", backgroundColor: "var(--Lightcoral)", display: "flex", justifyContent: "space-between"}}>
                        <span>{data}</span>
                        <button onClick={() => setOpen(false)} style={{backgroundColor: "transparent", border: "none", outline: "none"}}>X</button>
                    </div>
                    <div style={{width: "100%", height: "100%", padding: "4px"}}>
                        <span>Hello</span>
                    </div>
                </div>
            )
        }
        </>
    )
}

function SemestersMonth({monthsObject}) {
    return (
        <div style={{minWidth: "fit-content"}} id={monthsObject.monthId}>
            <div style={{display: "flex", textAlign: "center"}}>
                <div className="monthHeader">
                    {monthsObject.monthName}
                </div>
                <div className="monthSemesterName">
                    {monthsObject.semesterType}
                </div>
            </div>

            <div style={{borderTop: "2px solid var(--Lightcoral)", borderTopRightRadius: "2px"}}>
                <table className="calendarTable">
                    <thead>
                        <tr className="calendarRow">
                            <th>Type</th>
                            <th>Mon</th>
                            <th>Tue</th>
                            <th>Wed</th>
                            <th>Thu</th>
                            <th>Fri</th>
                            <th>Sat</th>
                            <th>Sun</th>
                        </tr>
                    </thead>
                    <tbody>
                        {monthsObject.arrayOfWeeks.map((week, index) => {
                            return <MonthsRow week={week} monthId={monthsObject.monthId} key={`${index}${monthsObject.monthId}`}/>
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

function MonthsRow({week, monthId}) {
    return (
        <tr className="calendarRow" id={`${monthId}-${week.weekId}`}>
            <td>I</td>
            {week.weekDates.map((day) => {
                return day.gray 
                    ? <td className="cellDisabled" key={`${monthId}-${week.weekId}-${day.date}-gray`}>{day.date}</td>
                    : <td id={`${monthId}-${week.weekId}-${day.date}`} key={`${monthId}-${week.weekId}-${day.date}`}>{day.date}</td>
            })}
        </tr>
    )
}
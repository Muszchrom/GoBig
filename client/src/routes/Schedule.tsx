import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import Header from '../components/schedule/Header'
import TileMounter from '../components/schedule/TileMounter'
import { getSchedule, getWeeks } from '../components/Requests'

import { 
    Schedule as ScheduleType, 
    Weeks as WeeksType 
} from '../components/Requests'

export default function Schedule() {
    const daysOfTheWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const [schedule, setSchedule] = useState<ScheduleType[][]>([])
    const [weeks, setWeeks] = useState<{firstMonth: WeeksType["firstMonth"]["month"], weeks: WeeksType["weeks"]} | boolean[]>([])
    const [currentWeek, setCurrentWeek] = useState<{week: number, type: number}>({week: -1, type: -1})

    const createRandomColor = () => {
        const availableColors = [
            "rgb(255, 199, 199)",
            "rgb(255, 232, 192)",
            "rgb(255, 243, 143)",
            "rgb(185, 230, 181)",
            "rgb(183, 228, 255)",
            "rgb(230, 200, 246)",
            "rgb(255, 201, 228)"
        ]
        return availableColors[Math.floor(Math.random() * (6 - 0 + 1)) + 0]
    }

    interface ScheduleTypeExtended extends ScheduleType {
        updateArray: (keyof ScheduleType)[]
    }
    
    const updateScheduleWithoutApiCall = (dayToUpdate: ScheduleType["day"], changes: ScheduleTypeExtended, uniqueKey=-1) => {
        // when subject is deleted
        if (uniqueKey !== -1 && Object.keys(changes).length === 1) {
            schedule[dayToUpdate] = [
                ...schedule[dayToUpdate].slice(0, uniqueKey),
                ...schedule[dayToUpdate].slice(uniqueKey+1, schedule[dayToUpdate].length)
            ]
            setSchedule(schedule.slice())
            return
        }
        // when subject is updated but subject.start is not
        else if (uniqueKey !== -1 && !changes.updateArray.includes('start')) {
            changes.updateArray.forEach((item) => {
                /*
                // naah i cant understand that
                interface aa {
                    a: number
                    b: string // replace string with number here
                }
                
                const c: aa = { a: 2, b: "a" } // and "a" with any number 
                
                const ba = (a: aa, b: (keyof aa)[]) => {
                    b.forEach((item) => {
                        c[item] = a[item] as unknown
                    //  ^ and this error will disappear XD
                    })
                }
                */
                (schedule as any)[dayToUpdate][uniqueKey][item] = changes[item] 
            })
            return setSchedule(schedule.slice())
        } 
        // when subject is updated and subject.start changes
        else if (uniqueKey !== -1 && changes.updateArray.includes('start')) {
            const buffer = schedule[dayToUpdate][uniqueKey]
            changes.updateArray.forEach((item) => {
                // same stuff here
                (buffer as any)[item] = changes[item]
            })
            // remove subject for easier sorting
            schedule[dayToUpdate] = [
                ...schedule[dayToUpdate].slice(0, uniqueKey),
                ...schedule[dayToUpdate].slice(uniqueKey+1, schedule[dayToUpdate].length)
            ]
            changes = buffer as ScheduleTypeExtended // this is really ScheduleType
        }
        if (!changes.onClient_color) {
            changes['onClient_color'] = createRandomColor()
        }
        // if new tile is created or subject.start changes
        const newStart = parseInt(changes.start.replace(':', ''))
        // get injection index
        for (var i=0; i<schedule[dayToUpdate].length; i+=1) {
            if (newStart < parseInt(schedule[dayToUpdate][i].start.replace(':', ''))) break
        }
        // inject changes
        schedule[dayToUpdate] = [
            ...schedule[dayToUpdate].slice(0, i), 
            changes, 
            ...schedule[dayToUpdate].slice(i, schedule[dayToUpdate].length)
        ]
        // update state, since array is mutable, we need to copy the array, in this case with .slice()
        setSchedule(schedule.slice())
    }

    useEffect(() => {
        (async () => {
            const [fetchedSchedule, fetchedWeeks] = await Promise.all([getSchedule(), getWeeks()])
            if (!fetchedWeeks) return setWeeks([false])
            if (fetchedSchedule) {
                const bufferArray: ScheduleType[][] = [[], [], [], [], [], [], []]
                fetchedSchedule.forEach((subject) => {
                    subject['onClient_color'] = createRandomColor()
                    subject.icon = [
                        'Labo.svg', 
                        'Lecture.svg', 
                        'Exercises.svg', 
                        'Default.svg', 
                        'Lektorat.svg'][[
                            'Laboratory', 
                            'Lecture', 
                            'Classes', 
                            'Project', 
                            'Foreign language course'].indexOf(subject.subjectType)]
                    bufferArray[subject.day].push(subject)
                })
                setSchedule(bufferArray)
            }
            if (fetchedWeeks) {
                // shift day to monday
                const firstMonthAsDate = new Date(fetchedWeeks.firstMonth)
                if (firstMonthAsDate.getDay() === 0) fetchedWeeks.firstMonth = firstMonthAsDate.setDate(firstMonthAsDate.getDate() - 6)
                else fetchedWeeks.firstMonth = firstMonthAsDate.setDate(firstMonthAsDate.getDate() - firstMonthAsDate.getDay() + 1)
                setWeeks(fetchedWeeks)

                // eslint was crying about default parameter of getAndSetCurrentWeek being state
                if (!fetchedWeeks.weeks || !fetchedWeeks.firstMonth) return
                const timeDiff = new Date().getTime() - fetchedWeeks.firstMonth
                const weekDiff = timeDiff/(1000*60*60*24*7)
                // if weekDiff is in range <0, 1) where 1 is not inclusive, then it means we're in the same week
                if (weekDiff < 1) return setCurrentWeek(fetchedWeeks.weeks[0])
                if (fetchedWeeks.weeks.length > weekDiff) return setCurrentWeek(fetchedWeeks.weeks[Math.floor(weekDiff)])
                else return setCurrentWeek(fetchedWeeks.weeks[fetchedWeeks.weeks.length - 1])
            }
        })()
    }, [])
    
    const getCurrentDay = () => daysOfTheWeek[new Date().getDay()]

    const getAndSetCurrentWeek = (weeksObjet=weeks) => {
        if (Array.isArray(weeksObjet)) return
        const timeDiff = new Date().getTime() - weeksObjet.firstMonth
        const weekDiff = timeDiff/(1000*60*60*24*7)
        // if weekDiff is in range <0, 1) where 1 is not inclusive, then it means we're in the same week
        if (weekDiff < 1) return setCurrentWeek(weeksObjet.weeks[0])
        if (weeksObjet.weeks.length > weekDiff) return setCurrentWeek(weeksObjet.weeks[Math.floor(weekDiff)])
        else return setCurrentWeek(weeksObjet.weeks[weeksObjet.weeks.length - 1])
    }
    // shiftDirection should be -1 or 1
    const handleWeekChange = (shiftDirection: -1 | 1) => {
        if (Array.isArray(weeks)) return
        // prevent shifting outside weeks array
        if (currentWeek.week + shiftDirection < 1) return
        if (currentWeek.week + shiftDirection > weeks.weeks[weeks.weeks.length - 1].week) return
        // shift current week
        setCurrentWeek(weeks.weeks[currentWeek.week - 1 + shiftDirection])        
    }

    return (
    <>
        {Array.isArray(weeks) && weeks[0] === false && <Navigate to="/schedule/create" replace={true}/>}
        <Header 
            getCurrentDay={getCurrentDay} 
            currentWeek={currentWeek} 
            handleWeekChange={handleWeekChange} 
            getAndSetCurrentWeek={getAndSetCurrentWeek}/>
        <Routes>
            <Route path="/" element={<HandleDefaultPath getCurrentDay={getCurrentDay} />} />
            {daysOfTheWeek.map((path, index) => (
                <Route path={`/${path}`} key={index} element={
                    <TileMounter 
                        signedIn={true} 
                        scheduleForTheDay={schedule[index]}
                        updateScheduleWithoutApiCall={updateScheduleWithoutApiCall}
                        currentWeek={currentWeek}/>
                        
                } />
            ))}
            <Route path="*" element={<Navigate to="/" replace={true}></Navigate>} />
        </Routes>
    </>
    )
}
function HandleDefaultPath({getCurrentDay}: {getCurrentDay: () => string}) {
    return <Navigate to={getCurrentDay()} />
}

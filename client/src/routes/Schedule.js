import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import NotFound from './NotFound'
import { semesterBlueprint } from '../components/data.js' // change it later
import Header from '../components/schedule/Header'
import TileMounter from '../components/schedule/TileMounter'
import { getSchedule } from '../components/Requests'

export default function Schedule({signedIn}) {
    const [currentWeek, setCurrentWeek] = useState(semesterBlueprint.weeks[0])
    const daysOfTheWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
    const [schedule, setSchedule] = useState([])

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

    const updateScheduleWithoutApiCall = (dayToUpdate, changes, uniqueKey=-1) => {
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
                schedule[dayToUpdate][uniqueKey][item] = changes[item]
            })
            setSchedule(schedule.slice())
            return
        } 
        // when subject is updated and subject.start changes
        else if (uniqueKey !== -1 && changes.updateArray.includes('start')) {
            const buffer = schedule[dayToUpdate][uniqueKey]
            changes.updateArray.forEach((item) => {
                buffer[item] = changes[item]
            })
            // remove subject for easier sorting
            schedule[dayToUpdate] = [
                ...schedule[dayToUpdate].slice(0, uniqueKey),
                ...schedule[dayToUpdate].slice(uniqueKey+1, schedule[dayToUpdate].length)
            ]
            changes = buffer
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

    useEffect(() => {getAndSetCurrentWeek()}, [])
    useEffect(() => {
        (async () => {
            const fetchedSchedule = await getSchedule()
            if (fetchedSchedule) {
                const bufferArray = [[], [], [], [], [], [], []]
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
        })()
    }, [])
    
    const getCurrentDay = () => {return daysOfTheWeek[new Date().getDay()]}

    const getAndSetCurrentWeek = () => {
        let i = 0
        const studiesWeek = new Date(semesterBlueprint.weeks[i].start + "T00:00")
        for (i; i<semesterBlueprint.weeks.length-1; i++) {
            const aWeekBack = new Date(new Date().setDate(new Date().getDate() - 7))
            if (aWeekBack < studiesWeek) break
        }
        i !== 0 && setCurrentWeek(semesterBlueprint.weeks[i])
    }

    const handleWeekChange = (s) => {
        if (s < 1 || s > semesterBlueprint.weeks.length) return
        setCurrentWeek(semesterBlueprint.weeks[s-1])
    }

    return (
    <>
        <Header 
            getCurrentDay={getCurrentDay} 
            currentWeek={currentWeek} 
            handleWeekChange={handleWeekChange} 
            getAndSetCurrentWeek={getAndSetCurrentWeek}/>
        <Routes>
            <Route exact path="/" element={<HandleDefaultPath getCurrentDay={getCurrentDay} />} />
            {daysOfTheWeek.map((path, index) => (
                <Route path={`/${path}`} key={index} element={
                    <TileMounter 
                        signedIn={signedIn} 
                        scheduleForTheDay={schedule[index]}
                        updateScheduleWithoutApiCall={updateScheduleWithoutApiCall}
                        currentWeek={currentWeek}/>
                        
                } />
            ))}
            <Route path="*" element={<NotFound goTo={"/"} title={"ERR 404"} />} />
        </Routes>
    </>
    )
}
function HandleDefaultPath(props) {
    return <Navigate to={props.getCurrentDay()} />
}

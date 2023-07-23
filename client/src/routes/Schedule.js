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

    useEffect(() => {getAndSetCurrentWeek()}, [])
    useEffect(() => {
        (async () => {
            const fetchedSchedule = await getSchedule()
            if (fetchedSchedule) {
                const bufferArray = [[], [], [], [], [], [], []]
                fetchedSchedule.forEach((subject) => {
                    const availableColors = [
                        "rgb(255, 199, 199)",
                        "rgb(255, 232, 192)",
                        "rgb(255, 243, 143)",
                        "rgb(185, 230, 181)",
                        "rgb(183, 228, 255)",
                        "rgb(230, 200, 246)",
                        "rgb(255, 201, 228)"
                    ]
                    subject['onClient_color'] = availableColors[Math.floor(Math.random() * (6 - 0 + 1)) + 0]
                    // data is sorted by day and start, so theres no need for extra sorting
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

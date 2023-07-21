import { useState, useEffect } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'

import NotFound from './NotFound'
import { semesterBlueprint } from '../components/data.js' // change it later
import Header from '../components/schedule/Header'
import TileMounter from '../components/schedule/TileMounter'

export default function Schedule({signedIn}) {
    const [currentWeek, setCurrentWeek] = useState(semesterBlueprint.weeks[0])
    const daysOfTheWeek = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]

    useEffect(() => {getAndSetCurrentWeek()}, [])
    
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
        <Header getCurrentDay={getCurrentDay} currentWeek={currentWeek} handleWeekChange={handleWeekChange} getAndSetCurrentWeek={getAndSetCurrentWeek}/>
        <Routes>
            <Route exact path="/" element={<HandleDefaultPath getCurrentDay={getCurrentDay} />} />
            {daysOfTheWeek.map((path, index) => (
                <Route path={`/${path}`} key={index} element={<TileMounter signedIn={signedIn} currentWeek={currentWeek}/>} />
            ))}
            <Route path="*" element={<NotFound goTo={"/"} title={"ERR 404"} />} />
        </Routes>
        <span>
            semesterBlueprint should be fetched from server
            AdditionalInfo data should also be fetched from server
        </span>
    </>
    )
}
function HandleDefaultPath(props) {
    return <Navigate to={props.getCurrentDay()} />
}

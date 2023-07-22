import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom';

import { CommonTile, WaitingTile, CreateTile } from './Tiles'
import AdditionalInfo from './AdditionalInfo'
import { NavigateBackTo } from '../Common';

const availableColors = [
    "rgb(255, 199, 199)",
    "rgb(255, 232, 192)",
    "rgb(255, 243, 143)",
    "rgb(185, 230, 181)",
    "rgb(183, 228, 255)",
    "rgb(230, 200, 246)",
    "rgb(255, 201, 228)"
  ];


export default function TileMounter({signedIn, currentWeek, scheduleForTheDay}) {
    const [dataAcquired, setDataAcquired] = useState(false)
    const [fetchedSchedule, setFetchedSchedule] = useState([])
    const [color, setColor] = useState([])

    let location = useLocation()

    // true: [][any index] === undefined
    useEffect(() => {
      if (scheduleForTheDay) {
        setFetchedSchedule(scheduleForTheDay)
        setDataAcquired(true)
      }
    }, [location, scheduleForTheDay])

    // create random color array
    useEffect(() => {
      if (fetchedSchedule.length) {
        setColor(fetchedSchedule.map(() => {
          return availableColors[Math.floor(Math.random() * (6 - 0 + 1)) + 0]
        }))
      } 
    }, [fetchedSchedule])

    return (
      <div className="container">
        {dataAcquired ? (
          <SubDayBuilder scheduleForDay={fetchedSchedule} color={color} currentWeek={currentWeek} signedIn={signedIn}></SubDayBuilder>
        ) : (
          <>
            <WaitingTile></WaitingTile>
            <WaitingTile></WaitingTile>
          </>
        )}
        <div style={{display: "flex", justifyContent: "space-between", padding: "0 1em", position: "sticky", bottom: "2em"}}>
          <NavigateBackTo path="/"/>
          <AdditionalInfo/>
        </div>
        {/* <button onClick={() => {navigate("/", {replace: true})}} className="absolute-button">{"<-"}</button> */}
    </div>
  )
}

function SubDayBuilder({color, scheduleForDay, currentWeek, signedIn}) {
  const [editMode, setEditMode] = useState(false)
  return (
    <>
      {scheduleForDay.map((subject, index) => {
        let c = color[index]
        let specialType = "unset"

        if ((subject.weekStart >= currentWeek.number && subject.weekStart !== -1) ||
            (subject.weekEnd <= currentWeek.number && subject.weekEnd !== -1) ||
            (subject.weekType !== 0 && Boolean(subject.weekType % 2) !== currentWeek.isOdd)) {
              c = "gray"
              specialType = "not today"
        }

        return (
          <CommonTile
            subject={subject}
            key={index}
            color={c}
            editMode={editMode}
            setEditMode={setEditMode}
            specialType={specialType}
            signedIn={signedIn}>
          </CommonTile>
        )
      })}
      {!!signedIn && (
        (editMode || !scheduleForDay.length) && <CreateTile></CreateTile>
      )}
    </>
  )
}
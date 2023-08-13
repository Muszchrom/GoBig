import { useState } from 'react'

import { CommonTile, WaitingTile, CreateTile } from './Tiles'
import AdditionalInfo from './AdditionalInfo'
import { NavigateBackTo } from '../Common'

export default function TileMounter({signedIn, currentWeek, scheduleForTheDay, updateScheduleWithoutApiCall}) {
  const [editMode, setEditMode] = useState(false)
  return (
    <div className="container">
      {scheduleForTheDay ? (
        <>
          {scheduleForTheDay.map((subject, index) => {
            let specialType = "unset"
    
            if ((subject.weekStart >= currentWeek.week && subject.weekStart !== -1) ||
                (subject.weekEnd <= currentWeek.week && subject.weekEnd !== -1) ||
                (subject.weekType !== 0 && subject.weekType !== currentWeek.type)) {
                  specialType = "not today"
            }
    
            return (
              <CommonTile
                key={index}
                subject={subject}
                specialType={specialType}
                updateScheduleWithoutApiCall={updateScheduleWithoutApiCall}
                uniqueKey={index}
                editMode={editMode}
                setEditMode={setEditMode}
                signedIn={signedIn}>
              </CommonTile>
            )
          })}
          {!!signedIn && (
            (editMode || !scheduleForTheDay.length) && <CreateTile updateScheduleWithoutApiCall={updateScheduleWithoutApiCall}></CreateTile>
          )}
        </>
      ) : (
        <>
          <WaitingTile></WaitingTile>
          <WaitingTile></WaitingTile>
        </>
      )}
        <div style={{display: "flex", justifyContent: "space-between", padding: "0 1em", position: "sticky", height: "0", bottom: "5em"}}>
          <NavigateBackTo path="/"/>
          <AdditionalInfo/>
        </div>
    </div>
  )
}
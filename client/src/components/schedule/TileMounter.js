import { useState } from 'react'

import { CommonTile, WaitingTile, CreateTile } from './Tiles'
import AdditionalInfo from './AdditionalInfo'
import { NavigateBackTo } from '../Common';

export default function TileMounter({signedIn, currentWeek, scheduleForTheDay}) {
  const [editMode, setEditMode] = useState(false)
  return (
    <div className="container">
      {scheduleForTheDay ? (
        <>
          {scheduleForTheDay.map((subject, index) => {
            let specialType = "unset"
    
            if ((subject.weekStart >= currentWeek.number && subject.weekStart !== -1) ||
                (subject.weekEnd <= currentWeek.number && subject.weekEnd !== -1) ||
                (subject.weekType !== 0 && Boolean(subject.weekType % 2) !== currentWeek.isOdd)) {
                  specialType = "not today"
            }
    
            return (
              <CommonTile
                key={index}
                subject={subject}
                specialType={specialType}
                editMode={editMode}
                setEditMode={setEditMode}
                signedIn={signedIn}>
              </CommonTile>
            )
          })}
          {!!signedIn && (
            (editMode || !scheduleForTheDay.length) && <CreateTile></CreateTile>
          )}
        </>
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
    </div>
  )
}
import { useState, useEffect, useRef } from "react"
import { getUsers } from "../../Requests"

export default function UsersBox() {
    const [focused, setFocused] = useState(false)
    const [usersArray, setUsersArray] = useState<{name: string, privileges: number}[] | undefined>(undefined) 
    
    const wrapRef = useRef<HTMLDivElement | null>(null)

    useEffect(() => {
        const clickInDetector = (e: Event) => {
            if ((!wrapRef.current!.contains(e.target as Node)) || (e as KeyboardEvent).key === "Tab") {
                setFocused(false)
            }
        }
        if (focused) {
            document.addEventListener('mousedown', clickInDetector)
            document.addEventListener('keydown', clickInDetector)
        } else {
            setFocused(false)
        }
        return () => {
            document.removeEventListener('mousedown', clickInDetector)
            document.removeEventListener('keydown', clickInDetector)
        }
      }, [focused])
    
    useEffect(() => {
      (async () => {
        const data = await getUsers()
        setUsersArray(data.map((item) => {return {name: item.username, privileges: 2}}))
      })()
    }, [])
  
    const buttonStyles = {
      padding: 0,
      margin: 0,
      width: "24px",
      height: "24px",
      background: "var(--Lightcoral)",
      border: "none",
      borderRadius: "4px",
      boxShadow: "var(--Shadow)"
    }
  
    return (
      <>
        <div ref={wrapRef} className={`ex-inputWrapper${focused ? " ex-activeWrapper" : ""}`} style={{outline: "none"}} tabIndex={0} onFocus={() => setFocused(true)}>
          <label className={`ex-inputTitle${focused ? " ex-activeTitle" : ""}`}>Users of your group</label>
            <div className={`ex-inputInnerWrapper ${!usersArray && "animated-background"}`} style={{flexDirection: "column", paddingTop: "10px"}}>
              {usersArray && usersArray.length 
                ? usersArray.map((item) => {
                  return (<div key={item.name} className="usersListItem" style={{display: "flex", justifyContent: "space-between"}}>
                    <div>
                      <span title={
                        item.privileges === 1 
                          ? "User have write and read permissions on this group" 
                          : "User have read only permissions on this group"}>
                          {item.privileges === 1 ? "👷" : "👀"}
                      </span>
                      <span title="Your group's name">
                        &nbsp;&nbsp;{item.name}&nbsp;&nbsp;
                      </span>
                    </div>
                    <div style={{display: "flex", gap: "12px"}}>
                      <button title="Remove user" style={buttonStyles}>❌</button>
                    </div>
                  </div>)
                }) : <div className="usersListItem" style={{textAlign: "center"}}>Your group currently has no users</div>}
            </div>
        </div>
      </>
    )
  }
  
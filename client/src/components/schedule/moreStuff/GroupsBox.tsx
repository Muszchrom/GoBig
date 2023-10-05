import { useState, useEffect, useRef } from "react"
import { getUserGroups, getInvites, acceptInvite, rejectInvite, leaveGroup } from "../../Requests"
import UploadModal from "../../UploadModal"

export default function GroupsBox() {
    const [focused, setFocused] = useState(false)
    const [groupsArray, setGroupsArray] = useState<{name: string, userPrivileges: 0 | 1 | 2, isMainGroup: 0 | 1}[] | undefined>(undefined)
    const [invitesArray, setInvitesArray] = useState<{name: string, owner: string, privileges: 0 | 1 | 2}[] | undefined>(undefined)
    const wrapRef = useRef<HTMLDivElement | null>(null)
  
    const [modalState, setModalState] = useState({
      show: false, 
      fun: async () => await [] as string[], 
      handleClose: () => {},
      message: ""
    })

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
        const data = await getUserGroups()
        setGroupsArray(data)
        const invites = await getInvites()
        if (!invites) return
        setInvitesArray(invites.map((item) => {
          return {name: item.name, owner: item.username, privileges: 2}
        }))
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
    const handleSoftClose = () => {
      const cpy = {...modalState}
      cpy.show = false
      setModalState(cpy)
    }
  
    const inviteAction = (accept: boolean, owner: string, name: string) => {
      if (accept) {
        setModalState({
          show: true,
          fun: () => acceptInvite(owner, name),
          handleClose: () => {
            setInvitesArray(invitesArray?.filter((item) => item.owner !== owner))
            if (groupsArray?.length) {
              groupsArray.push({name: name, userPrivileges: 2, isMainGroup: 0})
              setGroupsArray([...groupsArray])
            }
          },
          message: "Are you sure to accept this invite?"
        })
      } else {
        setModalState({
          show: true,
          fun: () => rejectInvite(owner, name),
          handleClose: () => {
            setInvitesArray(invitesArray?.filter((item) => item.owner !== owner))
          },
          message: "Are you sure to reject this invite?"
        })
      }
      // if (accept) acceptInvite(owner, name)
      // else rejectInvite(owner, name)
      // setInvitesArray(invitesArray?.filter((item) => item.owner !== owner))
      // if (groupsArray?.length && accept) {
      //   groupsArray.push({name: name, userPrivileges: 2, isMainGroup: 0})
      //   setGroupsArray([...groupsArray])
      // }
    }
    const handleLeaveGroup = (groupName: string) => {
      setModalState({
        show: true, 
        fun: () => leaveGroup(groupName), 
        handleClose: () => setGroupsArray(groupsArray?.filter((item) => item.name !== groupName)),
        message: "Are you sure to leave group?"
      })
    }
  
    return (
      <>
        <div ref={wrapRef} className={`ex-inputWrapper${focused ? " ex-activeWrapper" : ""}`} style={{outline: "none"}} tabIndex={0} onFocus={() => setFocused(true)}>
          <label className={`ex-inputTitle${focused ? " ex-activeTitle" : ""}`}>Your groups</label>
            <div className={`ex-inputInnerWrapper ${!groupsArray && "animated-background"}`} style={{flexDirection: "column", paddingTop: "10px"}}>
              {groupsArray && groupsArray?.map((item) => {
                return (<div key={item.name} className="usersListItem" style={{display: "flex", justifyContent: "space-between"}}>
                  <div>
                    <span title={
                      item.userPrivileges === 0 
                        ? "You're an author of this group" 
                        : item.userPrivileges === 1 
                          ? "You have write and read permissions on this group" 
                          : "You have read only permissions on this group"}>
                            {item.userPrivileges === 0 ? "👑" : item.userPrivileges === 1 ? "👷" : "👀"}
                    </span>
                    <span title="Group's name">
                      &nbsp;&nbsp;{item.name}&nbsp;&nbsp;
                    </span>
                    <span title={item.isMainGroup ? "This is your main group" : "Just a group"}>
                      {item.isMainGroup ? "✨" : ""}
                    </span>
                  </div>
                  <div style={{display: "flex", gap: "12px"}}>
                    {!item.isMainGroup && <button title="Mark as main" style={buttonStyles}>✨</button>}
                    {item.userPrivileges !== 0 && <button title="Leave group" style={buttonStyles} onClick={() => handleLeaveGroup(item.name)}>❌</button>}
                  </div>
                </div>)
              })}
            </div>
            <br></br>
            <label className={`ex-inputTitle${focused ? " ex-activeTitle" : ""}`}>Invites</label>
            {invitesArray?.length ? (
              <div className={`ex-inputInnerWrapper ${!groupsArray && "animated-background"}`} style={{flexDirection: "column", paddingTop: "10px"}}>
                {invitesArray.map((item) => {
                  return (<div key={item.name} className="usersListItem" style={{display: "flex", justifyContent: "space-between"}}>
                    <div>
                      <span title={
                          item.privileges === 1 
                            ? "You'll have write and read permissions on this group" 
                            : "You'll have read only permissions on this group"}>
                              {item.privileges === 1 ? "👷" : "👀"}
                      </span>
                      <span title={`Sent by ${item.owner}`}>
                        &nbsp;&nbsp;{item.name}&nbsp;&nbsp;
                      </span>
                    </div>
                    <div style={{display: "flex", gap: "12px"}}>
                      <button title="Accept invite" style={buttonStyles} onClick={() => inviteAction(true, item.owner, item.name)}>✔️</button>
                      <button title="Reject invite" style={buttonStyles} onClick={() => inviteAction(false, item.owner, item.name)}>❌</button>
                    </div>
                  </div>)
                })}
              </div>
            ) : (
              <div className="usersListItem" style={{textAlign: "center"}}>You have currently no invites</div>
            )}
        </div>
        {modalState.show && (
          <UploadModal 
            color="var(--Color4)" 
            handleClose={(e) => {e!.stopPropagation(); modalState.handleClose(); handleSoftClose()}} 
            handleSoftClose={(e) => {e!.stopPropagation(); handleSoftClose()}} 
            submitFunction={modalState.fun}>
                {modalState.message}
          </UploadModal>
        )}
      </>
    )
  }
  
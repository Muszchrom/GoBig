import React, { useState, useRef, useEffect } from 'react'
import { Navigate } from 'react-router-dom';
import { Overlay } from '../Overlay'

import UploadModal from '../UploadModal';
import { InputLoading } from '../forms/Common';
import TextInput from '../forms/TextInput';
import ImageInput, {ImageInputLoading} from '../forms/ImageInput';
import { SubmitButton } from '../forms/Buttons';
import { 
  getImage, 
  getNotes, 
  uploadNotes, 
  getUserGroups, 
  searchUsers, 
  getInvites, 
  sendInvite, 
  acceptInvite, 
  rejectInvite, 
  getUsers, 
  leaveGroup
} from '../Requests';

export default function AdditionalInfo() {
  const [open, setOpen] = useState(false) // is This window open
  const [show, setShow] = useState(false) // is sign out button pressed
  const [signOutConfirmed, setSignOutConfirmed] = useState(false) // sign out confirmed, nav to sign out path

  const handleSignOut = async () => {
    setSignOutConfirmed(true)
    return []
  }

  return (
    <>
      {open &&
        <Overlay backgroundColor={"antiquewhite"} setOpen={setOpen} open={open}>
          {/* Page context */}
          <h1 style={{marginTop: "7px"}}>More stuff</h1>
          <NotesBox />
          <ImageBox />
          <h1 style={{marginTop: "7px"}}>Groups</h1>
          <UsersBox />
          <SearchUsers />
          <GroupsBox />
          {/* Sign Out */}
          <h1 style={{marginTop: "7px"}}>Account</h1>
          <SubmitButton waitingFor={false} handleClick={() => setShow(true)}>Sign out</SubmitButton>
          {show && (<UploadModal 
                        color="var(--Color4)" 
                        handleClose={(e) => {e!.stopPropagation();setShow(false)}} 
                        handleSoftClose={(e) => {e!.stopPropagation(); setShow(false)}} 
                        submitFunction={handleSignOut}>
                            Are you sure?
                    </UploadModal>)}
        </Overlay>
      }
      {signOutConfirmed && <Navigate to="/signout" replace={true}></Navigate>}
      {/* Close button */}
      <button style={{background: "lightcoral", position: "sticky"}} aria-label="Additional info" className="absolute-button" onClick={() => setOpen(!open)}>
        <div className="dots"></div>
      </button>
    </>
  )
}

function ImageBox() {
  const [image, setImage] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      const image = await getImage()
      if (image.status !== 200) return setLoading(false)
      const imgblob = await image.blob()
      setImage(URL.createObjectURL(imgblob))
      setLoading(false)
    })()
  }, [])

  return (<>
      {loading
        ? <ImageInputLoading>Campus map</ImageInputLoading>
        : <ImageInput imageSrc={image} setImageSrc={setImage}>Campus map</ImageInput>}
  </>) 
}

// notes
function NotesBox() {
  const [showModal, setShowModal] = useState(false)
  const [fetchedNote, setFetchedNote] = useState<string | undefined>(undefined)  // this one if fetched
  const [note, setNote] = useState<string | undefined>(undefined)  // this one is edited/typed by user

  useEffect(() => {
    (async () => {
      const data = await getNotes()
      setFetchedNote(data)
      setNote(data)
    })()
  }, [])

  const handleBlur = async () => fetchedNote !== note && setShowModal(true)

  const uploadNote = async () => {
    if (note === undefined) return ["Note can not be undefined"]
    const result = await uploadNotes(note)
    if (result.length === 0) setFetchedNote(note)
    return result
  }

  return (
    <>
      {note !== undefined
        ? <TextInput 
            validatingFuntion={() => ""} 
            state={{field: "value", fun: (a, b) => setNote(b), initVal: note}}
            multiline={true}
            rows={4}
            blurHandler={handleBlur}>Notes</TextInput>
        : <InputLoading rows={4}>Notes</InputLoading> 
      }
      {showModal && (
        <UploadModal 
          color="var(--Color4)" 
          handleClose={() => {setShowModal(false)}} 
          handleSoftClose={() => {setShowModal(false)}} 
          submitFunction={uploadNote}>
              Upload changes?
        </UploadModal>
      )}
    </>
  )
}

// search bar
function SearchUsers() {
  const [focused, setFocused] = useState(false)
  const [inputVal, setInputVal] = useState("")
  const [errorMessage, setErrorMessage] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [choosenUser, setChoosenUser] = useState<string | undefined>(undefined)
  const [data, setData] = useState<string[]>([])
  
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inputField = useRef<HTMLInputElement | null>(null)

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

  const handleClick = () => inputField.current!.focus()

  const handleSearchClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (inputVal.length <3) {
      setErrorMessage("Provide 3 or more characters ☝️🤓")
      setData([])
      return
    }
    const result = await searchUsers(inputVal)
    const usernames = result.map((val: {username: string}) => val.username)
    usernames && setData(usernames)
    if (!usernames) {
      setErrorMessage("Something went wrong 🥺")
      setData([])
    } else if (!usernames.length) {
      setErrorMessage("No results found 😔")
      setData([])
    } else {
      setData(usernames)
      setErrorMessage("")
    }
  }

  const handleUsernameClick = (username: string) => {
    setChoosenUser(username)
    setShowUploadModal(true)
  }

  const submitFunction = async () => {
    if (!choosenUser) return ["You didnt choose an user"]
    const result = sendInvite(choosenUser)
    return result
  }

  return (
    <div ref={wrapRef} className={`ex-inputWrapper${focused ? " ex-activeWrapper" : ""}`} role="button" onClick={handleClick}>
        <label className={`ex-inputTitle${focused ? " ex-activeTitle" : ""}`}>Add users to your schedule</label>
        <div className="ex-inputInnerWrapper">
            <div className="ex-textAreaWrapper">
              <input type="text" 
                    ref={inputField} 
                    className={`ex-textInput ex-activeInput`}
                    value={inputVal} 
                    onChange={(e) => setInputVal(e.target.value)} 
                    onFocus={() => setFocused(true)} ></input>
              </div>
            <div className="ex-svgWrapper">
              <button style={{
                        backgroundImage: "url(https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Magnifying_glass_icon.svg/1200px-Magnifying_glass_icon.svg.png)",
                        backgroundSize: "contain",
                        width: "32px", 
                        height: "32px",
                        borderRadius: "7px",
                        border: "5px solid var(--Lightcoral)",
                        backgroundColor: "var(--Lightcoral)",
                        backgroundRepeat: "no-repeat"}}
                      onClick={handleSearchClick}></button>
            </div>
        </div>
        {!!focused && (
          <div className="ex-inputInnerWrapper" style={{flexDirection: "column", paddingTop: "10px", maxHeight: "100px", overflow: "auto"}}>
            {!!data.length 
              ? data.map(item => {
                  return <div key={item} className="usersListItem" onClick={() => handleUsernameClick(item)}><span>{item}</span></div>
              }) : <div className="usersListItem" style={{textAlign: "center"}}>{errorMessage}</div>}
          </div>
        )}
        {!!showUploadModal && (
          <UploadModal 
              color="var(--Color4)" 
              handleClose={(e) => {e!.stopPropagation(); setShowUploadModal(false)}} 
              handleSoftClose={(e) => {e!.stopPropagation(); setShowUploadModal(false)}} 
              submitFunction={submitFunction}>
                  Invite {choosenUser} to your group?
          </UploadModal>
        )}
    </div>
)
}

// your groups
function GroupsBox() {
  const [groupsArray, setGroupsArray] = useState<{name: string, userPrivileges: 0 | 1 | 2, isMainGroup: 0 | 1}[] | undefined>(undefined)
  const [invitesArray, setInvitesArray] = useState<{name: string, owner: string, privileges: 0 | 1 | 2}[] | undefined>(undefined)
  const wrapRef = useRef<HTMLDivElement | null>(null)

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

  const inviteAction = (accept: boolean, owner: string, name: string) => {
    if (accept) acceptInvite(owner, name)
    else rejectInvite(owner, name)
    setInvitesArray(invitesArray?.filter((item) => item.owner !== owner))
    if (groupsArray?.length && accept) {
      groupsArray.push({name: name, userPrivileges: 2, isMainGroup: 0})
      setGroupsArray([...groupsArray])
    }
  }
  const handleLeaveGroup = (groupName: string) => {
    leaveGroup(groupName)
    setGroupsArray(groupsArray?.filter((item) => item.name !== groupName))
  }

  return (
    <>
      <div ref={wrapRef} className={`ex-inputWrapper`} role="button" onClick={() => {}}>
        <label className="ex-inputTitle">Your groups</label>
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
          <label className="ex-inputTitle">Invites</label>
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
    </>
  )
}

// users of your group
function UsersBox() {
  const [usersArray, setUsersArray] = useState<{name: string, privileges: number}[] | undefined>(undefined) 
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

  const handleClick = () => {}
  return (
    <>
      <div className={`ex-inputWrapper`} role="button" onClick={handleClick}>
        <label className="ex-inputTitle">Users of your group</label>
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


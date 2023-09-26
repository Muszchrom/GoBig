import React, { useState, useRef, useEffect } from 'react'
import { Navigate } from 'react-router-dom';
import { Overlay, OverlayNoBounds } from '../Overlay'

import UploadModal from '../UploadModal';
import { InputLoading, TextInput, ImageContainer } from '../FormElements';
import { SubmitButton } from '../Common';
import { getImage, uploadImage, getNotes, uploadNotes, getUserGroups, searchUsers } from '../Requests';

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
          <NotesBox></NotesBox>
          <ImageBox></ImageBox>
          <h1 style={{marginTop: "7px"}}>Groups</h1>
          <UsersBox></UsersBox>
          <SearchUsers></SearchUsers>
          <GroupsBox></GroupsBox>
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

// campus map
function ImageBox() {
  const [labelFocused, setLabelFocused] = useState(false)
  const [imageFocused, setImageFocused] = useState(false)
  const [data, setData] = useState({
    isRequestRecieved: false,
    image: ""
  })
  const [newImage, setNewImage] = useState<File | null>(null)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showBigImage, setShowBigImage] = useState(false)

  useEffect(() => {
    (async () => {
      const image = await getImage()
      if (image.status !== 200) {
        setData({
          isRequestRecieved: true,
          image: ""
        })
        return
      }
      const imgblob = await image.blob()
      setData({
        isRequestRecieved: true,
        image: URL.createObjectURL(imgblob)
      })
    })()
  }, [])

  const uploadNewImage = async () => {
    if (!newImage) return ["Image not found"]
    const formData = new FormData()
    formData.append('image', newImage)
    const response = await uploadImage(formData)

    if (response.status === 201) {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        setData({
          isRequestRecieved: true,
          image: e.target!.result as string
        })
      }
      reader.readAsDataURL(newImage);
      return []
    } else {
      const errors = await response.json();
      if (!errors.errors.length) return ["An error occured"]
      else return errors.errors 
    }
  }

  return (
    <>
      <ImageContainer imgSrc={data.image}
        imgAlt="Your campus map"
        showLoadingAnimation={!data.isRequestRecieved}
        labelFocused={labelFocused}
        imageFocused={imageFocused}
        labelClickHandler={() => {setShowUploadModal(true)}}
        labelKeyDownHandler={(e: React.KeyboardEvent | undefined) => {(e?.key === "Enter" || e?.key === " ") && (() => {e.preventDefault(); setShowUploadModal(true)})()}}
        imageClickHandler={() => {setShowBigImage(true)}}
        imageKeyDownHandler={(e: React.KeyboardEvent | undefined) => {(e?.key === "Enter" || e?.key === " ") && setShowBigImage(true)}}
        labelFocusHandler={() => {setLabelFocused(true)}} 
        imageFocusHandler={() => {setImageFocused(true)}} 
        labelBlurHandler={() => {setLabelFocused(false)}}
        imageBlurHandler={() => {setImageFocused(false)}}
        >Campus map</ImageContainer>
      {showUploadModal && (
        <UploadModal 
          color="var(--Color4)" 
          handleClose={() => {setShowUploadModal(false)}} 
          handleSoftClose={() => {setShowUploadModal(false)}} 
          submitFunction={uploadNewImage}>
              <UploadImage userImage={newImage} setUserImage={setNewImage}></UploadImage>
        </UploadModal>
      )}
      {showBigImage && (
        <OverlayNoBounds open={showBigImage} setOpen={setShowBigImage}>
          <img src={data.image} className="map-image" style={(data.isRequestRecieved ? {} : {display: "none"})} alt="Campus map"/>
        </OverlayNoBounds>
      )}
    </>
  )
}

// campus map
function UploadImage({userImage, setUserImage}: {userImage: File | null, setUserImage: (file: File) => void}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownBox = useRef<HTMLDivElement>(null)
  const [draggedOver, setDraggedOver] = useState(false)
  const [imageUrl, setImageUrl] = useState("")


  useEffect(() => {
    if (!userImage) return
    displayImage(userImage)
    setDraggedOver(false)
  }, [userImage])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return
    setUserImage(e.target.files[0])
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    if (!e.dataTransfer.files) return
    setUserImage(e.dataTransfer.files[0])
  }

  const displayImage = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e: ProgressEvent<FileReader>) => {
      const f = e.target!.result as string
      setImageUrl(f)
    }
    reader.readAsDataURL(file);
  }

  return (
    <>
      <input ref={inputRef} onChange={handleChange} type="file" accept="image/*" style={{display: "none"}}></input>
      <span>{imageUrl.length ? "File preview" : "Drop your file below"}</span>
      <div ref={dropdownBox} 
           title="Drop image here" 
           className={`dropdownBox${draggedOver ? " dropdownBoxOnDrag" : ""}`} 
           onDrop={handleDrop} 
           onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()} 
           onDragEnter={() => setDraggedOver(true)} 
           onDragLeave={() => setDraggedOver(false)} 
           onClick={() => inputRef.current!.click()}>
        {imageUrl.length ? (
          <img src={imageUrl} style={{filter: draggedOver ? "brightness(0.9)" : "brightness(1)"}} alt="Your file"></img>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" pointerEvents={"none"}>
            <path d="M4 14V18H20V14M12 6L8 10M12 6L16 10M12 6V14" stroke="#322F2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </>
  )
}

// search bar
function SearchUsers() {
  const [focused, setFocused] = useState(false)
  const [inputVal, setInputVal] = useState("")
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [choosenUser, setChoosenUser] = useState<string | undefined>(undefined)
  const [data, setData] = useState<string[]>([])
  
  const wrapRef = useRef<HTMLDivElement | null>(null)
  const inputField = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const clickInDetector = (e: Event) => {
      console.log("XD?D?X?DX")
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

  const handleClick = () => {
    inputField.current!.focus()
  }

  const handleSearchClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault()
    if (inputVal.length === 0) return
    const result = await searchUsers(inputVal)
    const re = result.map((val: {username: string}) => val.username)
    re && setData(re)
  }

  const handleUsernameClick = (username: string) => {
    setChoosenUser(username)
    setShowUploadModal(true)
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
              }) : <div className="usersListItem" style={{textAlign: "center"}}>No results found 😔</div>}
          </div>
        )}
        {!!showUploadModal && (
          <UploadModal 
              color="var(--Color4)" 
              handleClose={(e) => {e!.stopPropagation(); setShowUploadModal(false)}} 
              handleSoftClose={(e) => {e!.stopPropagation(); setShowUploadModal(false)}} 
              submitFunction={async () => []}>
                  Invite {choosenUser} to your group?
          </UploadModal>
        )}
    </div>
)
}

// your groups
function GroupsBox() {
  const [groupsArray, setGroupsArray] = useState<{name: string, userPrivileges: 0 | 1 | 2, isMainGroup: 0 | 1}[] | undefined>(undefined)
  
  const wrapRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    (async () => {
      const data = await getUserGroups()
      const boilerplate: {name: string, userPrivileges: 0 | 1 | 2, isMainGroup: 0 | 1}[] = [
        {name: "Lotem group", userPrivileges: 1, isMainGroup: 0},
        {name: "Jonh's group", userPrivileges: 2, isMainGroup: 0},
        {name: "Janna's group", userPrivileges: 1, isMainGroup: 0},
        {name: "Miky's group", userPrivileges: 2, isMainGroup: 0}
      ]
      data.push(...boilerplate)
      setGroupsArray(data)
    })()
  }, [])

  const buttonStyles = {
    padding: 0,
    margin: 0,
    width: "24px",
    height: "24px",
    background: "var(--Lightcoral)",
    outline: "none",
    border: "none",
    borderRadius: "4px",
    boxShadow: "var(--Shadow)"
  }

  const handleClick = () => {}
  return (
    <>
      <div ref={wrapRef} className={`ex-inputWrapper`} role="button" onClick={handleClick}>
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
                  <span title="Your group's name">
                    &nbsp;&nbsp;{item.name}&nbsp;&nbsp;
                  </span>
                  <span title={item.isMainGroup ? "This is your main group" : "Just a group"}>
                    {item.isMainGroup ? "✨" : ""}
                  </span>
                </div>
                <div style={{display: "flex", gap: "12px"}}>
                  {!item.isMainGroup && <button title="Mark as main" style={buttonStyles}>✨</button>}
                  {item.userPrivileges !== 0 && <button title="Leave group" style={buttonStyles}>❌</button>}
                </div>
              </div>)
            })}
          </div>
      </div>
    </>
  )
}

// users of your group
function UsersBox() {
  const [usersArray, setUsersArray] = useState<{name: string, privileges: number}[] | undefined>(undefined) 
  useEffect(() => {
    (async () => {
      const boilerplate = [
        {name: "Bartek", privileges: 1},
        {name: "Martyna", privileges: 0},
        {name: "Mateusz", privileges: 1}
      ]
      setUsersArray(boilerplate)
    })()
  }, [])

  const buttonStyles = {
    padding: 0,
    margin: 0,
    width: "24px",
    height: "24px",
    background: "var(--Lightcoral)",
    outline: "none",
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
            {usersArray && usersArray?.map((item) => {
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
            })}
          </div>
      </div>
    </>
  )
}


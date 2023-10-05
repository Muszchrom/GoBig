import { useState, useEffect, useRef } from "react"
import { searchUsers, sendInvite } from "../../Requests"
import UploadModal from "../../UploadModal"

export default function SearchBar() {
    const [focused, setFocused] = useState(false)
    const [inputVal, setInputVal] = useState("")
    const [errorMessage, setErrorMessage] = useState("")
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [choosenUser, setChoosenUser] = useState<string | undefined>(undefined)
    const [data, setData] = useState<string[]>([])
    const [loading, setLoading] = useState(false)
    const wrapRef = useRef<HTMLDivElement | null>(null)
    const inputField = useRef<HTMLInputElement | null>(null)
  
    useEffect(() => {
      const clickInDetector = (e: Event) => {
        if ((!wrapRef.current!.contains(e.target as Node)) || (e as KeyboardEvent).key === "Tab") {
          setFocused(false)
          setInputVal("")
          setData([])
        }
      }
      if (focused) {
          document.addEventListener('mousedown', clickInDetector)
          document.addEventListener('keydown', clickInDetector)
      } else {
          setFocused(false)
          setInputVal("")
          setData([])
      }
      return () => {
          document.removeEventListener('mousedown', clickInDetector)
          document.removeEventListener('keydown', clickInDetector)
      }
    }, [focused])
  
    const handleClick = () => inputField.current!.focus()
  
    const handleSearchSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault()
      setLoading(true)
      setData([])
      if (inputVal.length <3) {
        setErrorMessage("Provide 3 or more characters ☝️🤓")
        setData([])
        setLoading(false)
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
      setLoading(false)
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
              <form onSubmit={handleSearchSubmit} className="ex-textAreaWrapper" style={{flexDirection: "row"}}>
                <input type="text" 
                      ref={inputField} 
                      className={`ex-textInput ex-activeInput`}
                      value={inputVal} 
                      onChange={(e) => setInputVal(e.target.value)} 
                      onFocus={() => setFocused(true)} ></input>
                <button type="submit" onFocus={() => setFocused(true)} style={{
                          backgroundImage: "url(https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/Magnifying_glass_icon.svg/1200px-Magnifying_glass_icon.svg.png)",
                          backgroundSize: "contain",
                          width: "32px", 
                          height: "32px",
                          borderRadius: "7px",
                          border: "5px solid var(--Lightcoral)",
                          backgroundColor: "var(--Lightcoral)",
                          backgroundRepeat: "no-repeat"}}></button>
                </form>
          </div>
          {!!focused && (
            <div className="ex-inputInnerWrapper" style={{flexDirection: "column", paddingTop: "10px", maxHeight: "100px", overflow: "auto"}}>
              {!!loading && <div className="usersListItem animated-background" style={{textAlign: "center"}}><span>Looking for user...</span></div>}
              {!loading && (!!data.length 
                ? data.map(item => {
                    return <div key={item} className="usersListItem" onClick={() => handleUsernameClick(item)}><span>{item}</span></div>
                }) : <div className="usersListItem" style={{textAlign: "center"}}>{errorMessage}</div>)}
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
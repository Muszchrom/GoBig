import { useState, useRef, useEffect } from 'react'
import { Navigate } from 'react-router-dom';
import { Overlay, OverlayNoBounds } from '../Overlay'

import UploadModal from '../UploadModal';
import { MultilineInput } from '../FormElements';
import { SubmitButton } from '../Common';
import { getImage, uploadImage } from '../Requests';

export default function AdditionalInfo() {
  const [open, setOpen] = useState(false) // is This window open
  const [show, setShow] = useState(false) // is sign out button pressed
  const [signOutConfirmed, setSignOutConfirmed] = useState(false) // sign out confirmed, nav to sign out path

  const [data, setData] = useState({
    isRequestRecieved: true,
    notes: ""
  })

  const handleSignOut = async () => {
    setSignOutConfirmed(true)
    if (false) setData(data)
    return []
  }
  const textt = "If you open it directly in the browser, you will see an empty page. You can add webfonts, meta tags, or analytics to this file.The build step will place the bundled scripts into the <body> tag.To begin the development, run `npm start` or `yarn start`.To create "

  return (
    <>
      {open &&
        <Overlay backgroundColor={"antiquewhite"} setOpen={setOpen} open={open}>
          {/* Page context */}
          <h1 style={{marginTop: "7px"}}>More stuff</h1>
          <MultilineInput initVal={textt} validatingFuntion={() => ""}>Notes</MultilineInput>
          <ImageBox></ImageBox>
          <SubmitButton waitingFor={false} handleClick={() => setShow(true)}>Sign out</SubmitButton>
          {/* Upload Modal */}
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
  const [showBigImage, setShowBigImage] = useState(false)
  const [showUploadImageModal, setShowUploadImageModal] = useState(false)
  const [data, setData] = useState({
    isRequestRecieved: false,
    image: ""
  })
  const [userImage, setUserImage] = useState<File | null>(null)

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
      console.log(URL.createObjectURL(imgblob))
      setData({
        isRequestRecieved: true,
        image: URL.createObjectURL(imgblob)
      })
    })()
  }, [])

  const uploadNewImage = async () => {
    if (!userImage) return ["Image not found"]
    const formData = new FormData()
    formData.append('image', userImage)
    const response = await uploadImage(formData)

    if (response.status === 201) {
      const reader = new FileReader()
      reader.onload = (e: ProgressEvent<FileReader>) => {
        setData({
          isRequestRecieved: true,
          image: e.target!.result as string
        })
      }
      reader.readAsDataURL(userImage);
      return []
    } else {
      const errors = await response.json();
      if (!errors.errors.length) return ["An error occured"]
      else return errors.errors 
    }
  }

  return (
    <>
      <div className="ex-inputWrapper" style={{padding: 0}} role="button">
        <label className="ex-inputTitle" onClick={() => setShowUploadImageModal(true)} style={{padding: "12px"}}>Campus map</label>
        <div className="ex-inputInnerWrapper">
          <div className={`image-frame ${!data.isRequestRecieved && "animated-background"}`} style={{borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px", ...(data.image && {height: "unset", maxHeight: "600px"})}}>
            {!!data.isRequestRecieved && (
                data.image ? (
                  <img onClick={() => setShowBigImage(true)} 
                    src={data.image} 
                    className="map-image" 
                    style={{borderBottomLeftRadius: "10px", borderBottomRightRadius: "10px", ...(data.isRequestRecieved ? {} : {display: "none"})}} 
                    alt="Campus map"/>
                ) : (
                  <div style={{width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center"}}>
                    <span>No image has been found</span>
                  </div>
                )
            )}
          </div>
        </div>
        {showUploadImageModal && (
          <UploadModal 
            color="var(--Color4)" 
            handleClose={(e) => {e!.stopPropagation(); setShowUploadImageModal(false)}} 
            handleSoftClose={(e) => {e!.stopPropagation(); setShowUploadImageModal(false)}} 
            submitFunction={uploadNewImage}>
                <UploadImage userImage={userImage} setUserImage={setUserImage}></UploadImage>
          </UploadModal>
        )}
        {showBigImage && (
          <OverlayNoBounds open={showBigImage} setOpen={setShowBigImage}>
            <img src={data.image} className="map-image" style={(data.isRequestRecieved ? {} : {display: "none"})} alt="Campus map"/>
          </OverlayNoBounds>
        )}
      </div>
    </>
  )
}

function UploadImage({userImage, setUserImage}: {userImage: File | null, setUserImage: (file: File) => void}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const dropdownBox = useRef<HTMLDivElement>(null)
  const [imageUrl, setImageUrl] = useState("")


  useEffect(() => {
    if (!userImage) return
    displayImage(userImage)
    changeStyle(true)
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

  const changeStyle = (remove?: boolean) => {
    if (remove) {
      dropdownBox.current?.classList.remove("dropdownBoxOnDrag")
      const image = dropdownBox.current?.firstChild as HTMLImageElement
      if (image) {
        image.style.filter = "brightness(1)"
      }
    } else {
      dropdownBox.current?.classList.add("dropdownBoxOnDrag")
      const image = dropdownBox.current?.firstChild as HTMLImageElement
      if (image) {
        image.style.filter = "brightness(0.9)"
      }
    }
  }

  return (
    <>
      <input ref={inputRef} onChange={handleChange} type="file" accept="image/*" style={{display: "none"}}></input>
      <span>{imageUrl.length ? "File preview" : "Drop your file below"}</span>
      <div ref={dropdownBox} 
           title="Drop image here" 
           className="dropdownBox" 
           onDrop={handleDrop} 
           onDragOver={(e: React.DragEvent<HTMLDivElement>) => e.preventDefault()} 
           onDragEnter={() => changeStyle()} 
           onDragLeave={() => changeStyle(true)} 
           onClick={() => inputRef.current!.click()}>
        {imageUrl.length ? (
          <img src={imageUrl} alt="Your file"></img>
        ) : (
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" pointerEvents={"none"}>
            <path d="M4 14V18H20V14M12 6L8 10M12 6L16 10M12 6V14" stroke="#322F2B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        )}
      </div>
    </>
  )
}
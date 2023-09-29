import { useState, useEffect, useRef } from "react"
import UploadModal from "../UploadModal"
import { OverlayNoBounds } from "../Overlay"
import { uploadImage } from "../Requests"

export default function ImageInput({imageSrc, setImageSrc, children}: {imageSrc: string, setImageSrc: (val: string) => void, children: React.ReactNode}) {
    const [labelFocused, setLabelFocused] = useState(false)
    const [imageFocused, setImageFocused] = useState(false)
    const [newImage, setNewImage] = useState<File | null>(null)
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [showBigImage, setShowBigImage] = useState(false)
  
    const uploadNewImage = async () => {
      if (!newImage) return ["Image not found"]
      const formData = new FormData()
      formData.append('image', newImage)
      const response = await uploadImage(formData)
  
      if (response.status === 201) {
        const reader = new FileReader()
        reader.onload = (e: ProgressEvent<FileReader>) => setImageSrc(e.target!.result as string)
        reader.readAsDataURL(newImage);
        return []
      } else {
        const errors = await response.json();
        if (!errors.errors.length) return ["An error occured"]
        else return errors.errors 
      }
    }

    const handleLabelKeyDown = (e: React.KeyboardEvent | undefined) => {
        if (e?.key === "Enter" || e?.key === " ") {
            e.preventDefault()
            setShowUploadModal(true)
        }
    }

    const handleImageKeyDown = (e: React.KeyboardEvent | undefined) => {
        if (e?.key === "Enter" || e?.key === " ") {
            setShowBigImage(true)
        }
    }

    return (
      <>
        <div className="image-wrapper">
            <div className={`image-inner-label-wrapper${labelFocused ? " iiw-active" : ""}`}
                    role="button" 
                    tabIndex={0} 
                    onClick={() => {setShowUploadModal(true)}} onKeyDown={handleLabelKeyDown} 
                    onFocus={() => {setLabelFocused(true)}} onBlur={() => {setLabelFocused(false)}}>
                <span className={`ex-inputTitle${labelFocused ? " ex-activeTitle" : ""}`}>{children}</span>
            </div>
            <div className={`image-inner-image-wrapper${imageFocused ? " iiw-active" : ""}${!!imageSrc ? " image-present" : ""}`} 
                    role="button" 
                    tabIndex={0} 
                    onClick={() => {setShowBigImage(true)}} onKeyDown={handleImageKeyDown} 
                    onFocus={() => {setImageFocused(true)}} onBlur={() => {setImageFocused(false)}}>
                {imageSrc ? (
                    <img src={imageSrc} 
                        className="map-image" 
                        alt="Your campus map"></img>
                ) : (<ImageInputNoImage focused={imageFocused}/>)}
            </div>
        </div>

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
            <img src={imageSrc} className="map-image" alt="Campus map"/>
          </OverlayNoBounds>
        )}
      </>
    )
  }

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

export function ImageInputLoading({children}: {children: React.ReactNode}) {
    return (
        <div className="image-wrapper">
            <div className="image-inner-label-wrapper">
                <span className={`ex-inputTitle`}>{children}</span>
            </div>
            <div className={`image-inner-image-wrapper animated-background`}></div>
        </div>
    )
}

function ImageInputNoImage({focused}: {focused: boolean}) {
    return (
        <div style={{height: "100%", width: "100%", display: "flex", justifyContent: "center", alignItems: "center"}}>
            <span style={(focused ? {color: "var(--Lightcoral)"} : {opacity: .5, color: "var(--Text)"})}>No image to preview</span>
        </div>
    )
}
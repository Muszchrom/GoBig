import { SubmitButton, CancelButton, LoadingButtonAnimation, ErrorList } from "../../Common"
import { ModalWindow } from "../../Overlay"
import { useState } from "react"

/**
 * @param {string} color - Background color for window
 * @param {string} children - Title in initial appearance
 * @param {function} handleClose - Ran on successfull modal close button click
 * @param {function} handleSoftClose - Ran on every cancel button click
 * @param {function} submitFunction - Must return an array. If this array is empty then upload is considered successfull
 */
export default function TileUploadModal({color, children, handleClose, handleSoftClose, submitFunction}) {
    const [uploading, setUploading] = useState(false)
    const [uploadErrors, setUploadErrors] = useState([])
    const [uploadFinished, setUploadFinished] = useState(false)

    const upload = async () => {
        setUploading(true)
        const errors = await submitFunction()
        setUploadErrors(errors)
        setUploadFinished(true)
        setUploading(false)
    }

    return (
        <>
            <ModalWindow color={color}>
                {!!(!uploading & !uploadFinished) && 
                    <>
                        <span className="heading1">
                            {children}
                        </span>
                        <div className="two-buttons-horizontal-container-v2">
                            <CancelButton handleClick={handleSoftClose}>
                                Cancel
                            </CancelButton>
                            <SubmitButton waitingFor={false} handleClick={upload}>
                                Confirm
                            </SubmitButton>
                        </div>
                    </>
                }
                {uploading && 
                    <>
                        <span className="heading1">
                            Uploading...
                        </span>
                        <LoadingButtonAnimation />
                    </>
                }
                {!!(uploadFinished & !!uploadErrors.length) && 
                    <>
                        <span className="heading1">
                            Upload failure!
                        </span>
                        <ErrorList errors={uploadErrors}/>
                        <CancelButton handleClick={handleSoftClose}>
                            Close
                        </CancelButton>
                    </>
                }
                {!!(uploadFinished & !uploadErrors.length) && 
                    <>
                        <span className="heading1">
                            Upload success!
                        </span>
                        <CancelButton handleClick={handleClose}>
                            Close
                        </CancelButton>
                    </>
                }
            </ModalWindow>
        </>
    )
}
export function ErrorModal({color, uploadErrors, handleSoftClose}) {
    return (
        <ModalWindow color={color}>
            <span className="heading1">
               Upload failure 
            </span>
            <ErrorList errors={uploadErrors}/>
            <CancelButton handleClick={handleSoftClose}>
                Close
            </CancelButton>
        </ModalWindow>
    )
}
import { SubmitButton, CancelButton, LoadingButtonAnimation, ErrorList } from "../../Common"
import { ModalWindow } from "../../Overlay"
import { useState } from "react"

export default function TileUploadModal({color, children, handleClose, submitFunction, data}) {
    const [uploading, setUploading] = useState(false)
    const [uploadErrors, setUploadErrors] = useState([])
    const [uploadFinished, setUploadFinished] = useState(false)

    const upload = async () => {
        setUploading(true)
        const errors = await submitFunction(data)
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
                            <CancelButton handleClick={handleClose}>
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
                        <CancelButton handleClick={handleClose}>
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

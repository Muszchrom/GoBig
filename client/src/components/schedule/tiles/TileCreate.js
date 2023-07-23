import { useState } from "react"
import { Overlay } from "../../Overlay"
import { createSubject } from "../../Requests"

import { useLocation } from 'react-router-dom';
import TileUploadModal from "./TileUploadModal"
import TileForm from "./TileForm";

export default function TileCreate({open, setOpen, color, updateScheduleWithoutApiCall}) {
    const [userData, setUserData] = useState({})
    const [showModal, setShowModal] = useState(false)
    const [uploadedSuccessfully, setUploadedSuccessfully] = useState(false)

    let location = useLocation()

    const handleCreateButtonClick = (data) => {
        const pathName = location.pathname.split('/')
        const dayName = pathName[pathName.length - 1]
        const dayNameAsNumber = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(dayName.toLowerCase())
        if (dayNameAsNumber < 0) return

        data.day = dayNameAsNumber
        setUserData(data)
        setShowModal(!showModal)
    }
    const submitionFunction = async () => {
        const result = await createSubject(userData)
        if (Array.isArray(result)) {
            return result
        } else {
            setUserData(result)
            setUploadedSuccessfully(true)
            return []
        }
    }

    const handleClose = () => {
        setOpen(!open)
        if (uploadedSuccessfully) {
            updateScheduleWithoutApiCall(userData.day, userData)
        }
    }

    return (
        <Overlay backgroundColor={color} setOpen={setOpen} open={open}>
            <TileForm manageData={handleCreateButtonClick}/>

            {showModal && <TileUploadModal color={color}
                                           handleClose={handleClose}
                                           submitFunction={submitionFunction}>Upload subject?</TileUploadModal>}
            
        </Overlay>
    )
}
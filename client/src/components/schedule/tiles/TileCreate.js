import { useState } from "react"
import { Overlay } from "../../Overlay"
import { createSubject } from "../../Requests"

import { useLocation } from 'react-router-dom';
import UploadModal from "../../UploadModal";
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

    const handleSoftClose = () => {
        setShowModal(!showModal)
    }

    const handleClose = () => {
        setOpen(!open)
        if (uploadedSuccessfully) {
            updateScheduleWithoutApiCall(userData.day, userData)
        }
    }

    return (
        <Overlay backgroundColor={color} setOpen={setOpen} open={open}>
            <TileForm color={color} manageData={handleCreateButtonClick} _title="Create new subject"/>

            {showModal && <UploadModal color={color}
                                           handleClose={handleClose}
                                           handleSoftClose={handleSoftClose}
                                           submitFunction={submitionFunction}>Upload subject?</UploadModal>}
            
        </Overlay>
    )
}
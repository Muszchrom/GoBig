import { useState } from "react"
import { Overlay } from "../../Overlay"
import { createSubject } from "../../Requests"
import { source } from "../../../source"

import { useLocation } from 'react-router-dom';
import TileUploadModal from "./TileUploadModal"
import TileForm from "./TileForm";

export default function TileCreate({open, setOpen, color}) {
    const [userData, setUserData] = useState({})
    const [showModal, setShowModal] = useState(false)
    let location = useLocation()

    const handleCreate = (data) => {
        const pathName = location.pathname.split('/')
        const dayName = pathName[pathName.length - 1]
        const dayNameAsNumber = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"].indexOf(dayName.toLowerCase())
        if (dayNameAsNumber < 0) return

        data.day = dayNameAsNumber
        setUserData(data)
        setShowModal(!showModal)
    }
    
    return (
        <Overlay backgroundColor={color} setOpen={setOpen} open={open}>
            <TileForm manageData={handleCreate}/>
            {/* <OverlayInnerEditSubjectForm setUserData={setUserData} handleClick={toggleModal}/> */}

            {showModal && <TileUploadModal color={color}
                                           handleClose={() => setShowModal(!showModal)}
                                           submitFunction={createSubject}
                                           data={userData}>Upload subject?</TileUploadModal>}
            
        </Overlay>
    )
}
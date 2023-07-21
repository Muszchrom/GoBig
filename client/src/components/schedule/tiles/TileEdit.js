import { useState } from "react"
import { Overlay } from "../../Overlay"
import { updateSubject, deleteSubject } from "../../Requests"
import { source } from "../../../source"

import TileUploadModal from "./TileUploadModal"
import TileForm from "./TileForm"

export default function TileEdit({open, setOpen, subject, color}) {
    const [userData, setUserData] = useState({})
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState('UPDATE')

    const handleUpload = (data) => {
        // find changes
        const fields = ["start", "end", "subjectName", "subjectType", "hall", "teacher", "icon", "additionalInfo", "weekStart", "weekEnd", "weekType"]
        const updateArray = []
        fields.forEach((item) => {
            if (data[item] !== subject[item]) updateArray.push(item)
        })

        data.id = subject.id
        data.day = subject.day
        data.updateArray = updateArray
        
        setModalType("UPDATE")
        setUserData(data)
        setShowModal(!showModal)
    }

    const handleDelete = () => {
        setModalType("DELETE")
        setUserData({"id": subject.id})
        setShowModal(!showModal)
    }
    
    return (
        <Overlay backgroundColor={color} setOpen={setOpen} open={open}>
            <TileForm subject={subject} manageData={handleUpload}>
                <div role="button" onClick={handleDelete} className="span-button heading1 error">
                    <img className="span-button-icon" src={`${source}/static/Close - red.svg`} alt=""></img>
                    <span className="error">Delete</span>
                </div>
            </TileForm>
            {showModal && 
                <TileUploadModal color={color}
                                 handleClose={() => setShowModal(!showModal)}
                                 submitFunction={modalType === "UPDATE" ? updateSubject : deleteSubject}
                                 data={userData}>
                    {modalType === "UPDATE" ? "Update subject?" : "Delete subject?"}
                </TileUploadModal>
            }
            {/* <img className="overlay-svg" src={`${source}/static/Edit.svg`} alt="Pencil icon"/> */}
        </Overlay>
    )
}


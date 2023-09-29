import { useState } from "react"
import { Overlay } from "../../Overlay"
import { updateSubject, deleteSubject } from "../../Requests"
import { CancelButton } from "../../forms/Buttons"
import UploadModal from "../../UploadModal"
import TileForm from "./TileForm"

export default function TileEdit({open, setOpen, subject, color, updateScheduleWithoutApiCall, uniqueKey}) {
    const [userData, setUserData] = useState({})
    const [showModal, setShowModal] = useState(false)
    const [modalType, setModalType] = useState('UPDATE')
    const [uploadedSuccessfully, setUploadedSuccessfully] = useState(false)

    const handleUploadButtonClick = (data) => {
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

    const handleDeleteButtonClick = () => {
        setModalType("DELETE")
        setUserData({"id": subject.id})
        setShowModal(!showModal)
    }

    const handleSoftClose = () => {
        setShowModal(!showModal)
    }

    const handleClose = () => {
        setOpen(!open)
        if (uploadedSuccessfully) {
            updateScheduleWithoutApiCall(subject.day, userData, uniqueKey)
        }
    }

    const handleDeleteSubject = async () => {
        const errors = await deleteSubject(userData)
        if (!errors.length) setUploadedSuccessfully(true)
        return errors
    }

    const handleUpdateSubject = async () => {
        const errors = await updateSubject(userData)
        if (!errors.length) setUploadedSuccessfully(true)
        return errors
    }

    return (
        <Overlay backgroundColor={color} setOpen={setOpen} open={open}>
            <TileForm color={color} subject={subject} manageData={handleUploadButtonClick} _title="Edit this subject">
                <CancelButton handleClick={handleDeleteButtonClick}>
                    Delete
                </CancelButton>
            </TileForm>
            {showModal && 
                <UploadModal color={color}
                                 handleClose={handleClose}
                                 handleSoftClose={handleSoftClose}
                                 submitFunction={modalType === "UPDATE" ? handleUpdateSubject : handleDeleteSubject}>
                    {modalType === "UPDATE" ? "Update subject?" : "Delete subject?"}
                </UploadModal>
            }
        </Overlay>
    )
}


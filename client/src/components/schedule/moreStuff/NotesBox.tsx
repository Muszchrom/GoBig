import { useState, useEffect } from "react"
import TextInput from '../../forms/TextInput';
import { InputLoading } from "../../forms/Common"
import { getNotes } from "../../Requests"
import UploadModal from "../../UploadModal"
import { uploadNotes } from "../../Requests"
import { GroupState } from "../AdditionalInfo";

export default function NotesBox({groupState}: {groupState: GroupState["groupState"]}) {
    const [showModal, setShowModal] = useState(false)
    const [fetchedNote, setFetchedNote] = useState<string | undefined>(undefined)  // this one if fetched
    const [note, setNote] = useState<string | undefined>(undefined)  // this one is edited/typed by user
  
    useEffect(() => {
      (async () => {
        const data = await getNotes(groupState.groupId)
        setFetchedNote(data)
        setNote(data)
      })()
    }, [])

    const handleBlur = async () => fetchedNote !== note && setShowModal(true)

    const uploadNote = async () => {
      if (note === undefined) return ["Note can not be undefined"]
      const result = await uploadNotes(note)
      if (result.length === 0) setFetchedNote(note)
      return result
    }
  
    return (
      <>
        {note !== undefined
          ? <TextInput 
              validatingFuntion={() => ""} 
              state={{field: "value", fun: (a, b) => {setNote(b)}, initVal: note}}
              multiline={true}
              rows={4}
              disabled={!(groupState.privileges <= 1)}
              blurHandler={groupState.privileges <= 1 ? handleBlur : () => {}}>Notes</TextInput>
          : <InputLoading rows={4}>Notes</InputLoading> 
        }
        {showModal && (
          <UploadModal 
            color="var(--Color4)" 
            handleClose={() => {setShowModal(false)}} 
            handleSoftClose={() => {setShowModal(false)}} 
            submitFunction={uploadNote}>
                Upload changes?
          </UploadModal>
        )}
      </>
    )
  }
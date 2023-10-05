import { useState, useEffect } from 'react'
import { Navigate } from 'react-router-dom';
import { Overlay } from '../Overlay'
import UploadModal from '../UploadModal';

import SearchBar from './moreStuff/SearchBar';
import ImageBox from './moreStuff/ImageBox';
import NotesBox from './moreStuff/NotesBox';
import GroupsBox from './moreStuff/GroupsBox';
import UsersBox from './moreStuff/UsersBox';

import { SubmitButton } from '../forms/Buttons';

export interface GroupState {
  groupState: {
    privileges: 0 | 1 | 2,
    groupId: number
  }
  setGroupState: (val: {privileges: 0 | 1 | 2, groupId: number}) => void
}

export default function AdditionalInfo({groupState, setGroupState}: GroupState) {
  const [open, setOpen] = useState(false) // is This window open
  const [show, setShow] = useState(false) // is sign out button pressed
  const [signOutConfirmed, setSignOutConfirmed] = useState(false) // sign out confirmed, nav to sign out path

  const handleSignOut = async () => {
    setSignOutConfirmed(true)
    return []
  }

  return (
    <>
      {open &&
        <Overlay backgroundColor={"antiquewhite"} setOpen={setOpen} open={open}>
          {/* Page context */}
          <h1 style={{marginTop: "7px"}}>More stuff</h1>
          <NotesBox groupState={groupState}/>
          <ImageBox groupState={groupState}/>
          <h1 style={{marginTop: "7px"}}>Groups</h1>
          <UsersBox />
          <SearchBar />
          <GroupsBox groupState={groupState} setGroupState={setGroupState} setOpen={setOpen}/>
          {/* Sign Out */}
          <h1 style={{marginTop: "7px"}}>Account</h1>
          <SubmitButton waitingFor={false} handleClick={() => setShow(true)}>Sign out</SubmitButton>
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

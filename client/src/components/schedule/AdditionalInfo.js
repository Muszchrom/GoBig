import { useState } from 'react'
import { NavLink } from 'react-router-dom';
import { Overlay } from '../Overlay'

import UploadModal from '../UploadModal';
import { signOut } from '../Requests';


import ExercisesSVG from '../../graphics/svgs/Exercises.svg'
import LaboSVG from '../../graphics/svgs/Labo.svg'
import LectureSVG from '../../graphics/svgs/Lecture.svg'
import LektoratSVG from '../../graphics/svgs/Lektorat.svg'
import DefaultSVG from '../../graphics/svgs/Default.svg'

import mapa from '../../graphics/jpg/mapaKampusu.jpg'

export default function AdditionalInfo() {
  const [open, setOpen] = useState(false)
  const [show, setShow] = useState(false)

  const [imageLoaded, setImageLoaded] = useState(false)
  return (
    <>
      {open &&
        <Overlay backgroundColor={"antiquewhite"} setOpen={setOpen} open={open}>
          <a href="http://we1.pollub.pl/ats4/" target="_blank" rel="noreferrer" style={{textDecoration: "underline"}}>Oryginalny plan</a>
          <span onClick={() => setShow(true)}>SIGN OUT
            {show && (<UploadModal 
                        color="var(--Color4)" 
                        handleClose={(e) => {e.stopPropagation();setShow(false)}} 
                        handleSoftClose={(e) => {e.stopPropagation(); setShow(false)}} 
                        submitFunction={signOut}>
                            Are you sure?
                    </UploadModal>)}</span>
          <ul style={{marginTop: "2em"}}>
            <li>E XXX - Wydział Elektrotechniki i Informatyki</li>
            <li>CI XXX, Rdzewiak</li>
            <li>CT XXX - CenTech</li>
            <li>PE 15a - Katedra Informatyki (Pentagon)</li>
            <li>M IX - Wydział Mechaniczny</li>
          </ul>
          <div className="image-frame animated-background">
            <img src={mapa} className="map-image" style={imageLoaded ? {} : {display: "none"}} alt="Mapa kampusu" onLoad={() => setImageLoaded(true)}/>
          </div>
          <ul style={{marginTop: "2em"}}>
            <li><img src={ExercisesSVG} alt=""/> - Wykład</li>
            <li><img src={LaboSVG} alt=""/> - Laboratoria</li>
            <li><img src={LectureSVG} alt=""/> - Ćwiczenia</li>
            <li><img src={LektoratSVG} alt=""/> - Lektorat</li>
            <li><img src={DefaultSVG} alt=""/> - Podstawowa ikona</li>
            <NavLink to={"/"}>
              Go back to the landing page
            </NavLink>
          </ul>
        </Overlay>
      }
      <button style={{background: "lightcoral", position: "sticky"}} aria-label="Additional info" className="absolute-button" onClick={() => setOpen(!open)}>
        <div className="dots"></div>
      </button>
    </>
  )
}

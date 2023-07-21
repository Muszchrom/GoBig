import FocusTrap from 'focus-trap-react';
import { CloseButton } from './Common';

export function Overlay({backgroundColor, setOpen, open, children}) {
  return (
    <FocusTrap>
      <div className="overlay" style={{backgroundColor: backgroundColor}}>
        <div className="overlay-inner">
          <CloseButton setOpen={setOpen} open={open}/>
          {children}
        </div>
      </div>
    </FocusTrap>
  );
}

export function ModalWindow({color, children}) {
  return (
      <div className="overlay" style={{backgroundColor: "rgba(110, 106, 106, .5)"}}>
          <div className="overlay-inner" style={{backgroundColor: "transparent"}}>
              <div className="modal">
                  <div style={{backgroundColor: color}} className="modal-inner">
                      {children}
                  </div>
              </div>
          </div>
      </div>
  )
}
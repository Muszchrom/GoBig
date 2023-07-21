import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

import FocusTrap from 'focus-trap-react';

export default function Header(props) {
  const [open, setOpen] = useState(false);
  const [dayName, setDayName] = useState("")

  let location = useLocation()

  useEffect(() => {
    const name = location.pathname.split('/')
    setDayName(name[name.length - 1])
  }, [location])

  useEffect(() => {
    open && document.addEventListener("keydown", (e) => {
      e.key === "Escape" && setOpen(false);
    })
  }, [open])

  return (
    <header className="app-header">
      <div className="header-inner">
          {open ? (
            <FocusTrap>
              <div style={{display: "flex"}}>
                <button onClick={() => setOpen(!open)} className="day-picker" aria-label="Open navigation">
                  <h1 className="no-select">{dayName}</h1>
                </button>
                {open && <NavDropdown setOpen={setOpen}/>}
                {open && <Overlay setOpen={setOpen} open={open}/>}
              </div>
            </FocusTrap>
          ) : (
            <div style={{display: "flex"}}>
              <button onClick={() => setOpen(!open)} className="day-picker" aria-label="Open navigation">
                <h1 className="no-select">{dayName}</h1>
              </button>
              {open && <NavDropdown setOpen={setOpen}/>}
              {open && <Overlay setOpen={setOpen} open={open}/>}
            </div>
          )}
        <ul className="buttons-wrapper">
          <NavButton getAndSetCurrentWeek={props.getAndSetCurrentWeek} getCurrentDay={props.getCurrentDay}/>
        </ul>
      <div className="week-info">
        <button type="button" className="week-nav-button" onClick={() => props.handleWeekChange(props.currentWeek.number-1)}>{"<<"}</button>
        <span className="week-info-txt">Week &#x2116; {props.currentWeek.number}, Is {props.currentWeek.isOdd ? "Odd" : "Even"}</span>
        <button type="button" className="week-nav-button" onClick={() => props.handleWeekChange(props.currentWeek.number+1)}>{">>"}</button>
      </div>
      </div>
    </header>
  );
}

// Navigate to current day
function NavButton(props) {
  const navigate = useNavigate();

  const handleClick = () => {
    props.getAndSetCurrentWeek();
    navigate(props.getCurrentDay())
  }

  return (
    <li className="button-container">
      <button onClick={() => handleClick()} className="nav-button" aria-label="Go to the current day">
      </button>
    </li>
  )
}

function NavDropdown(props) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  useEffect(() => {
    let today = new Date().getDay() - 1;
    today = today < 0 ? 6 : today;
    const currentDaysElement = document.getElementById(`nav${today}`);
    currentDaysElement.scrollIntoView();
  })

  return (
      <div className="nav-dropdown">
        <ul>
          {days.map((day, index) => {
            return <DrpdnItem index={index} key={index} setOpen={props.setOpen}>{day}</DrpdnItem>;
          })}
        </ul>
      </div>
  )
}

function DrpdnItem(props) {
  return (
    <li>
      <NavLink id={`nav${props.index}`} onClick={() => props.setOpen(false)} to={props.children.toLowerCase()}>
        {props.children}
      </NavLink>
    </li>
  );
}

function Overlay(props) {
  return (
    <div
      className="overlay"
      onClick={() => props.setOpen(!props.open)}>
    </div>
  );
}

import { useState, useRef, useEffect } from 'react';
import { source } from "../../../source"

// Custom input for editing subject, takes subject start and end time in 00:00 format
export function StartEndInput({startEnd, setStartEnd, children, _name}) {
    const [cursor, setCursor] = useState(0)
    const timeInput = useRef();

    useEffect(() => {
        timeInput.current.selectionStart = cursor;
        timeInput.current.selectionEnd = cursor;
    }, [cursor])


    const charDifference = (e, str) => {
        for (let i=0; i<str.length; i++) {
            if (str[i] !== e.target.value[i]) {
                return {
                    char: str[i],
                    idx: i,
                    eventChar: e.target.value[i]
                }
            }
        }
    }

    // basically only allow digits to be changed
    const handleChange = (e) => {
        let cursorLocation = e.target.selectionStart
        let newTimeString = startEnd
        const difference = charDifference(e, startEnd)
        
        // if character is getting removed
        if (e.target.value.length < startEnd.length) {
            if (cursorLocation === 10 || cursorLocation === 2) cursorLocation -= 1
            else if (cursorLocation === 7) cursorLocation -= 3
            newTimeString = startEnd.slice(0, cursorLocation) + "0" + startEnd.slice(cursorLocation+1, startEnd.length)
            // if character is getting added
        } else if (e.target.value.length > startEnd.length) {
            if (!isNaN(parseInt(difference?.eventChar))) {
                if (difference) {
                    newTimeString = startEnd.slice(0, cursorLocation-1) + difference.eventChar + startEnd.slice(cursorLocation, startEnd.length)    
                } else if (e.target.value[cursorLocation]) {
                    newTimeString = startEnd.slice(0, cursorLocation-1) + e.target.value[cursorLocation] + startEnd.slice(cursorLocation, startEnd.length)
                }
                if (cursorLocation === 2 || cursorLocation === 10) cursorLocation += 1
                else if (cursorLocation === 5) cursorLocation += 3
            }
        }
        
        newTimeString.match(/^[0-9]{2}:[0-9]{2} - [0-9]{2}:[0-9]{2}$/) && (() => {
            setStartEnd(newTimeString)
            setCursor(cursorLocation)
        })()
    }

    return (
        <div>
            <label htmlFor={_name} className='edit-tile-input-label'>{children}</label><br></br>
            <input id={_name} autoComplete="off" type="text" className="heading2 edit-tile-input" value={startEnd} ref={timeInput} onChange={handleChange}></input>
        </div>
    )
}

export function DropdownInput({options, children, currentState, changeState, _name}) {
    const [open, setOpen] = useState(false);

    const handleSelect = (e) => {
        changeState(e.target.innerHTML)
        setOpen(!open)
    }

    return (
        <div style={{backgroundColor: "inherit"}}>
            <label htmlFor={_name} className='edit-tile-input-label'>{children}</label><br></br>
            <button id={_name} type="button" className="heading2 edit-tile-button" onClick={() => setOpen(!open)}>{currentState}</button>
            {open && (
                <ul className="edit-tile-dropdown no-select">
                    {options.map((item, index) => {
                        if (item === currentState) {
                            return (<li key={index} onClick={handleSelect} className="edit-tile-dropdown-item-selected">{item}</li>)    
                        }
                        return (<li key={index} onClick={handleSelect}>{item}</li>)
                    })}
                </ul>
            )}
        </div>
    )
}

export function TextInputBigger({children, currentState, changeState, _name}) {
    return (
        <div>
            <label htmlFor={_name} className='edit-tile-input-label'>{children}</label><br></br>
            <input id={_name} type="text" className="heading1 edit-tile-input" value={currentState} onChange={e => changeState(e.target.value)}></input>
        </div>
    )
}

export function TextInput({children, currentState, changeState, _name}) {
    return (
        <div>
            <label htmlFor={_name} className='edit-tile-input-label'>{children}</label><br></br>
            <input id={_name} type="text" className="heading2 edit-tile-input" value={currentState} onChange={e => changeState(e.target.value)}></input>
        </div>
    )
}

export function IconInput({currentState, changeState}) {
    // Styles logic was moved from css to js because webpack couldnt compile those.
    // Original css looked like that, every nth child had an angle diminished by 6rad. Might be helpfull for adjusting elements position in the future
    // .icon-input-active:nth-of-type(1) {
    //     top: calc(-1 * (min(calc((50vw + 50vw / 2) / 2 + 50vw / 8), 175px) * cos(-0.4rad) - min(calc(50vw / 4), 50px)));
    //     left: calc(min(calc((50vw + 50vw / 2) / 2 + 50vw / 8), 175px)  * sin(-0.4rad) + min(calc(50vw / 4), 50px));
    // }
    const icons = ["Default.svg", "Exercises.svg", "Labo.svg", "Lecture.svg", "Lektorat.svg"]
    const btn = useRef()
    let state = false

    const vw = (percent) => {
        return (percent * window.innerWidth)/100
    }

    const calculateTop = (radAngle) => {
        return -1 * (Math.min(vw(50)*7/8, 175) * Math.cos(radAngle) - Math.min(vw(50)/4, 50))
    }
    
    const calculateLeft = (radAngle) => {
        return Math.min(vw(50)*7/8, 175) * Math.sin(radAngle) + Math.min(vw(50)/4, 50)
    }

    const adjustElementsPosition = () => {
        // cleanup statement, if btn.current?.children is undefined then remove event listener (this component will not exist)
        if (!btn.current?.children) {
            window.removeEventListener('resize', adjustElementsPosition)
            return;
        }
        const elementsToAdjust = btn.current.children
        for (let i=1; i<elementsToAdjust.length; i++) {
            elementsToAdjust[i].style.top = `${calculateTop(-0.4 - (i-1)*0.6)}px`
            elementsToAdjust[i].style.left = `${calculateLeft(-0.4 - (i-1)*0.6)}px`
            elementsToAdjust[i].style.transform = 'translate(0, 0)'
        }
    }
    const resetElementsPosition = () => {
        const elementsToAdjust = btn.current.children
        for (let i=1; i<elementsToAdjust.length; i++) {
            elementsToAdjust[i].style.top = '50%'
            elementsToAdjust[i].style.left = '50%'
            elementsToAdjust[i].style.transform = 'translate(-50%, -50%)'
        }
    }

    const schowChildren = () => {
        if (state) {
            window.removeEventListener('resize', adjustElementsPosition)
            resetElementsPosition()
            state = false
        } else {
            window.addEventListener('resize', adjustElementsPosition)
            adjustElementsPosition()
            state = true
        }
    }
    return (
        <div className="icon-input-wrapper">
            <div ref={btn} className="icon-input-button" onClick={schowChildren}>
                <img src={`${source}/static/${currentState}`} alt="School graduation hat"/>
                {icons.map((item, index) => {
                    return (
                        <div className="icon-input-child" key={index} role="button" onClick={() => changeState(item)}>
                            <img key={index + icons.length} src={`${source}/static/${item}`} alt="School graduation hat"/>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}
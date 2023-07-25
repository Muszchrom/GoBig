import { useState, useRef, useEffect } from 'react';
import { source } from "../../../source"


export function TextInput({children, inputRef, initVal, validatingFuntion}) {
    const [validationErrors, setValidationError] = useState([])
    
    const wrapperRef = useRef()
    const labelRef = useRef()
    // const inputRef = useRef()

    const handleClick = () => {
        inputRef.current.focus()
    }

    const handleFocus = () => {
        wrapperRef.current.classList.add('ex-activeWrapper')
        labelRef.current.classList.add('ex-activeTitle')
        inputRef.current.classList.add('ex-activeInput')
    }
    
    const handleOutFocus = () => {
        if (validationErrors.length) {
            console.log(validationErrors)
        }
        wrapperRef.current.classList.remove('ex-activeWrapper')
        labelRef.current.classList.remove('ex-activeTitle')
        inputRef.current.classList.remove('ex-activeInput')
    }
    const calcRows = (e) => {
        setValidationError(validatingFuntion(e.target.value))
        inputRef.current.rows = 1
        inputRef.current.rows = parseInt(inputRef.current.scrollHeight/19)
    }

    return (
        <div ref={wrapperRef} className="ex-inputWrapper" role="button" onClick={handleClick}>
            <label ref={labelRef} className="ex-inputTitle">{children}</label>
            <div className="ex-inputInnerWrapper">
                <div className="ex-textAreaWrapper">
                    <textarea ref={inputRef} rows="1" className="ex-textInput" onChange={calcRows} onFocus={handleFocus} onBlur={handleOutFocus}></textarea>
                </div>
                <div className="ex-svgWrapper">
                    <img src={`${source}/static/Confirm.svg`} alt="Change me"/>
                </div>
            </div>
        </div>
    )
}


export function StartEndInput({children, inputRef, initVal, validatingFuntion}) {
    const [validationErrors, setValidationError] = useState([])
    const wrapperRef = useRef()
    const labelRef = useRef()

    const [startEnd, setStartEnd] = useState(initVal)
    const [previousSelection, setpreviousSelection] = useState('')
    const [cursor, setCursor] = useState(0)

    useEffect(() => {
        inputRef.current.selectionStart = cursor;
        inputRef.current.selectionEnd = cursor;
    }, [cursor, inputRef])

    const listeningFunction = () => {
        setpreviousSelection([inputRef.current.selectionStart, inputRef.current.selectionEnd])
    }

    const handleFocus = () => {
        wrapperRef.current.classList.add('ex-activeWrapper')
        labelRef.current.classList.add('ex-activeTitle')
        inputRef.current.classList.add('ex-activeInput')
        document.addEventListener("selectionchange", listeningFunction);
    }
    const handleOutFocus = () => {
        document.removeEventListener("selectionchange", listeningFunction);
        if (validationErrors.length) console.log(validationErrors)
        wrapperRef.current.classList.remove('ex-activeWrapper')
        labelRef.current.classList.remove('ex-activeTitle')
        inputRef.current.classList.remove('ex-activeInput')
    }


    // basically only allow digits to be changed
    const handleChange = (e) => {
        // save previous unchanged parts of string
        let unchangedBeggining = ''
        let unchangedEnding = ''
        let diff = e.target.value
        let iBeginning = 0
        let iEnding = 1

        while (true) {
            if (iBeginning < previousSelection[0]) {
                unchangedBeggining += diff[0]
                diff = diff.slice(1, diff.length)
                iBeginning += 1
            }
            if (startEnd.length - iEnding >= previousSelection[1]) {
                unchangedEnding = startEnd[startEnd.length - iEnding] + unchangedEnding
                diff = diff.slice(0, diff.length-1)
                iEnding += 1
            }
            if (!(iBeginning < previousSelection[0]) && !(startEnd.length - iEnding >= previousSelection[1])) break
        }
        
        // remove all non nums
        unchangedBeggining = unchangedBeggining.replace(/\D/g, '');
        unchangedEnding = unchangedEnding.replace(/\D/g, '');
        diff = diff.replace(/\D/g, '');
    
        let out = ["0", "0", "0", "0", "0", "0", "0", "0"]
        // insert beginning
        for (let i=0; i<unchangedBeggining.length; i++) {
            out[i] = unchangedBeggining[i]
        }
        // inser end
        for (let i=0; i<unchangedEnding.length; i++) {
            out[out.length - 1 - i] = unchangedEnding[unchangedEnding.length - 1 - i]
        }
        // insert diff
        for (let i=0; i<diff.length; i++) {
            if (unchangedBeggining.length + i > out.length - 1) break
            out[unchangedBeggining.length + i] = diff[i]
        }

        setValidationError(validatingFuntion(e.target.value))
        setStartEnd(`${out[0]}${out[1]}:${out[2]}${out[3]} - ${out[4]}${out[5]}:${out[6]}${out[7]}`)
        setCursor(e.target.selectionEnd)
    }

    return (
        <div ref={wrapperRef} className="ex-inputWrapper" role="button" onClick={() => {inputRef.current.focus()}}>
            <label ref={labelRef} className="ex-inputTitle">{children}</label>
            <div className="ex-inputInnerWrapper">
                <div className="ex-textAreaWrapper">
                    <textarea ref={inputRef} rows="1" className="ex-textInput" value={startEnd} onChange={handleChange} onFocus={handleFocus} onBlur={handleOutFocus}></textarea>
                </div>
                <div className="ex-svgWrapper">
                    <img src={`${source}/static/Confirm.svg`} alt="Change me"/>
                </div>
            </div>
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
            <input id={_name} autoComplete="off" type="text" className="heading1 edit-tile-input" value={currentState} onChange={e => changeState(e.target.value)}></input>
        </div>
    )
}

// export function TextInput({children, currentState, changeState, _name}) {
//     return (
//         <div>
//             <label htmlFor={_name} className='edit-tile-input-label'>{children}</label><br></br>
//             <input id={_name} autoComplete="off" type="text" className="heading2 edit-tile-input" value={currentState} onChange={e => changeState(e.target.value)}></input>
//         </div>
//     )
// }

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

    const vh = (percent) => {
        return (percent * window.innerHeight)/100
    }

    const calculateTop = (radAngle) => {
        return -1 * (Math.min(vw(50)*7/8, 175, vh(50)*7/8) * Math.cos(radAngle) - Math.min(vw(50)/4, 50, vh(50)/4))
    }
    
    const calculateLeft = (radAngle) => {
        return Math.min(vw(50)*7/8, 175, vh(50)*7/8) * Math.sin(radAngle) + Math.min(vw(50)/4, 50, vh(50)/4)
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
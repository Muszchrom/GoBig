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

// this needs refactoring
// eventListeners doesnt unmount
// memory leaks
// basically tragic behavior, i might kill myself
export function StartEndInput({children, inputRef, initVal, validatingFuntion}) {
    const [validationErrors, setValidationError] = useState([])
    const wrapperRef = useRef()
    const labelRef = useRef()

    const [startEnd, setStartEnd] = useState(initVal)
    const [previousSelection, setpreviousSelection] = useState([0, 0])
    const [cursor, setCursor] = useState(0)

    useEffect(() => {
        inputRef.current.selectionStart = cursor;
        inputRef.current.selectionEnd = cursor;
    }, [cursor, inputRef])

    const listeningFunction = () => {
        setpreviousSelection([inputRef?.current?.selectionStart, inputRef?.current?.selectionEnd])
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

export function DropdownInput({children, inputRef, initVal, options, validatingFuntion}) {
    const [validationErrors, setValidationError] = useState([])
    const [matchingOptions, setMatchingOptions] = useState(options)
    const [value, setValue] = useState(initVal)
    const [focused, setFocused] = useState(false)

    const wrapperRef = useRef()
    const labelRef = useRef()
    const dropdown = useRef()

    useEffect(() => {
        // call handleOutFocus if conditions are met
        const clickInDetector = (e) => {
            if ((wrapperRef.current && !wrapperRef.current.contains(e.target)) || e.key === "Tab") {
                e.key === "Tab" & matchingOptions.length === 1 && setValue(matchingOptions[0])
                handleOutFocus()
            }
        }
        if (focused) {
            document.addEventListener('mousedown', clickInDetector)
            document.addEventListener('keydown', clickInDetector)
        }
        return () => {
            document.removeEventListener('mousedown', clickInDetector)
            document.removeEventListener('keydown', clickInDetector)
        }
    }, [focused, value])

    const handleClick = () => {
        if (!focused) inputRef.current.focus()
    }

    const handleFocus = () => {
        wrapperRef.current.classList.add('ex-activeWrapper')
        labelRef.current.classList.add('ex-activeTitle')
        dropdown.current.classList.add('ex-dropdownItemsContainerActive')
        inputRef.current.classList.add('ex-activeInput')
        setFocused(true)
    }
    
    const handleOutFocus = () => {
        wrapperRef.current.classList.remove('ex-activeWrapper')
        labelRef.current.classList.remove('ex-activeTitle')
        dropdown.current.classList.remove('ex-dropdownItemsContainerActive')
        inputRef.current.classList.remove('ex-activeInput')
        setFocused(false)
    }

    const handleChange = (e) => {
        const opts = []
        options.forEach(element => {
            if (element.match(new RegExp(e.target.value + ".+", "i"))) {
                opts.push(element)
            }
        });
        e.target.value ? setMatchingOptions(opts) : setMatchingOptions(options)
        setValidationError(validatingFuntion(e.target.value))
        setValue(e.target.value)
        inputRef.current.rows = 1
        inputRef.current.rows = parseInt(inputRef.current.scrollHeight/19)
    }
    
    return (
        <div ref={wrapperRef} className="ex-inputWrapper" role="button" onClick={handleClick}>
            <label ref={labelRef} className="ex-inputTitle">{children}</label>
            <div className="ex-inputInnerWrapper">
                <div className="ex-textAreaWrapper">
                    <input ref={inputRef} rows="1" className="ex-textInput" value={value} onChange={handleChange} onFocus={handleFocus}></input>
                    <div ref={dropdown} className="ex-dropdownItemsContainer">
                        {matchingOptions.map((item, index) => {
                            return <span className="ex-dropdownItem" key={index} role="button" onClick={() => {setValue(item); handleOutFocus()}}>{item}</span>
                        })}
                    </div>
                </div>
                <div className="ex-svgWrapper">
                    <img src={`${source}/static/Confirm.svg`} alt="Change me"/>
                </div>
            </div>
        </div>
    )
}

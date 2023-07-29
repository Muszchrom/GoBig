import React from "react";

import { NavLink } from 'react-router-dom';

export default function Landing({signedIn, setSignedIn}) {
    const signOut = () => {
        document.cookie = "";
        setSignedIn(false);
    }
    return(
        <>
        <div className="jumbo" style={{position: "fixed", zIndex: "-1"}}>
            <span className="welcome-sign">Hello!</span>
        </div>
        <div className="jumbo invis">
            <svg className="waveAnimSvg" preserveAspectRatio="none" id="svg" viewBox="0 0 1440 490" xmlns="http://www.w3.org/2000/svg">
                <path stroke="none" strokeWidth="0" fill="#faebd7" fillOpacity="0.4" className="waveAnimPath-0" d="M 0,500 C 0,500 0,125 0,125 C 138,106 276,87 426,98 C 575.4,108 736,146 907,156 C 1077,165 1258,145 1440,125 C 1440,125 1440,500 1440,500 Z"></path>
                <path stroke="none" strokeWidth="0" fill="#faebd7" fillOpacity="0.53" className="waveAnimPath-1" d="M 0,500 C 0,500 0,250 0,250 C 166,256 333,263 475,258 C 616,252 733,235 890,232 C 1046,228 1243,239 1440,250 C 1440,250 1440,500 1440,500 Z"></path>
                <path stroke="none" strokeWidth="0" fill="#faebd7" fillOpacity="1" className="waveAnimPath-2" d="M 0,500 C 0,500 0,375 0,375 C 164,374 328,373 493,365 C 657,356 822,341 980,342 C 1137,342 1288,358 1440,375 C 1440,375 1440,500 1440,500 Z"></path>
            </svg>
        </div>
        <div className="landingBackground">
            <div className="container funnycont">
                <div className="tile tile-landing">
                    <NavLink to={"/plan/monday"} className="tile-link" style={{backgroundColor: "var(--Color1)"}}>
                        SCHEDULE
                    </NavLink>
                </div>
                <div className="tile tile-landing">
                    <NavLink to={"/plan/monday"} className="tile-link" style={{backgroundColor: "var(--Color2)"}}>
                         QUIZZES
                    </NavLink>
                </div>
                <div className="tile tile-landing">
                    <NavLink to={"/plan/monday"} className="tile-link" style={{backgroundColor: "var(--Color3)"}}>
                        FILES 
                    </NavLink>
                </div>
                <div className="tile tile-landing">
                    {signedIn ? (
                        <span className="tile-link" onClick={signOut}  style={{backgroundColor: "var(--Color4)"}}>SIGN OUT</span>
                    ) : (
                    <NavLink to={"/signin"} className="tile-link" style={{backgroundColor: "var(--Color4)"}}>
                        SIGN IN{true && signedIn}
                    </NavLink>
                    )}
                </div>
            </div>
        </div>
        </>
    );
}

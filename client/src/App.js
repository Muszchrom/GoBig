import './App.css';
import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import SignIn from './routes/SignIn';
import SignUp from './routes/SignUp';
import SignOut from './routes/SignOut';
import CreateSchedule from './routes/CreateSchedule';
import Schedule from './routes/Schedule';
import { isTokenValid } from './components/Requests';

function App() {
  const [signedIn, setSignedIn] = useState(false);
  const [fetchingSignedState, setFetchingSignedState] = useState(true);

  useEffect(() => {
    (async () => {
      const tokenState = await isTokenValid()
      tokenState ? setSignedIn(true) : setSignedIn(false)
      setFetchingSignedState(false)
    })()
  }, [])

  return (
    <div className="App">
      <BrowserRouter>
        {(signedIn || fetchingSignedState) ? (
          <Routes>
            <Route path="/schedule/*" element={<Schedule />} />
            <Route path="/signout" element={<SignOut setSignedIn={setSignedIn} />}/>
            <Route path="/schedule/create" element={<CreateSchedule/>} />
            <Route path="*" element={<Navigate to="/schedule/monday" replace={true}/>} />
          </Routes>    
        ) : (
          <Routes>
            <Route path="/signin" element={<SignIn signedIn={signedIn} setSignedIn={setSignedIn}/>}/>
            <Route path="/signup" element={<SignUp />}/>
            <Route path="*" element={<Navigate to="/signin" replace={true}/>} />
          </Routes>    
        )}
      </BrowserRouter>
    </div>
  );
}

export default App;

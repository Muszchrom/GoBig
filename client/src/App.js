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
        <Routes>
          <Route path="/schedule/*" element={(fetchingSignedState || signedIn) ? <Schedule /> : <Navigate to="/signin" replace={true}/>} />
          <Route path="/signin" element={<SignIn signedIn={signedIn} setSignedIn={setSignedIn}/>}/>
          <Route path="/signup" element={<SignUp signedIn={signedIn}/>}/>
          <Route path="/schedule/create" element={<CreateSchedule/>} />
          <Route path="/" element={<Navigate to="/schedule/monday" replace={true}/>}/>
          <Route path="*" element={<Navigate to="/schedule/monday" replace={true}/>} />
        </Routes>    
      </BrowserRouter>
    </div>
  );
}

export default App;

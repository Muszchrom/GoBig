import './App.css';
import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

//monday
import NotFound from './routes/NotFound';
import SignIn from './routes/SignIn';
import SignUp from './routes/SignUp';
import Landing from './routes/Landing'
import CreateSchedule from './routes/CreateSchedule';
import Schedule from './routes/Schedule';
import { isTokenValid } from './components/Requests';

function App() {
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    (async () => {
      const tokenState = await isTokenValid()
      tokenState ? setSignedIn(true) : setSignedIn(false)
    })()
  }, [])

  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/schedule/*" element={signedIn ? <Schedule signedIn={signedIn}/> : <Navigate to="/signin" replace={true}/>} />
          <Route path="/signin" element={<SignIn type="signIn" signedIn={signedIn} setSignedIn={setSignedIn}/>}/>
          <Route path="/signup" element={<SignUp type="signUp"/>}/>
          <Route path="/schedule/create" element={<CreateSchedule/>} />
          <Route exact path="/" element={<Landing signedIn={signedIn} setSignedIn={setSignedIn} />}/>
          <Route path="*" element={<NotFound />} />
        </Routes>    
      </BrowserRouter>
    </div>
  );
}

export default App;

import './App.css';
import { useEffect, useState } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

//monday
import NotFound from './routes/NotFound';
import SignIn from './routes/SignIn';
import SignUp from './routes/SignUp';
import Landing from './routes/Landing'

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
          <Route path="/plan/*" element={<Schedule signedIn={signedIn}/>} />
          <Route path="/signin" element={<SignIn type="signIn" signedIn={signedIn} setSignedIn={setSignedIn}/>}/>
          <Route path="/signup" element={<SignUp type="signUp"/>}/>
          <Route exact path="/" element={<Landing signedIn={signedIn} setSignedIn={setSignedIn} />}/>
          <Route path="*" element={<NotFound />} />
        </Routes>    
      </BrowserRouter>
    </div>
  );
}

export default App;

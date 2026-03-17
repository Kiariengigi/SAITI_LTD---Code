import Hero_page from './Hero_page/Hero_page'
import Login from './Login_page/Login';
import Signup from './Signup_Page/Signup';
import User_Dt_Main from './Signup_Page/User_details_Collection/User_Dt_Main';
import Profile_Main from './User_Profile/Profile_main'
import { BrowserRouter, Routes, Route } from 'react-router-dom';
function App() {
  return (
    <BrowserRouter>
        <Routes>
            <Route path='/' element={<Hero_page/>}/>
            <Route path='/login' element={<Login/>}/>
            <Route path='/signup' element={<Signup/>}/>
            <Route path='/signup/userdetails' element={<User_Dt_Main/>}/>
            <Route path='/profile' element={<Profile_Main/>}/>
        </Routes>
    </BrowserRouter>
  );
}

export default App
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './Styles/index.css'
import Navbar_comp from './Hero_page/navbar.tsx'
import Main_cont from './Hero_page/main_content.tsx'
import 'bootstrap/dist/css/bootstrap.min.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Navbar_comp />
    <Main_cont/>
  </StrictMode>,
)

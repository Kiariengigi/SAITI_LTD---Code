import '../Styles/navbar.css'
import Button from 'react-bootstrap/Button'
import Container from 'react-bootstrap/Container'
import Navbar from 'react-bootstrap/Navbar'


function Navbar_comp() {

  return (
    <Navbar className="nav_bar" fixed="top">
      <Container fluid className="d-flex justify-content-between align-items-center px-3 px-md-5 mt-5">
        
        {/* Logo scales with clamp() in CSS */}
        <Navbar.Brand href="#home" className="m-0">
          <h1 className="logo-text">
            <span className="fw-bold">SAITI</span>_LTD
          </h1>
        </Navbar.Brand>

        {/* Action Button scales with padding/font classes */}
        <Button className="nav-btn rounded-pill btn-dark border-0 px-4">
          Log in
        </Button>

      </Container>
    </Navbar>
  )
}

export default Navbar_comp

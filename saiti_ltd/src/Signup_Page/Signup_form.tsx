import { Button, Container } from "react-bootstrap"
import { useNavigate } from "react-router-dom"
import '../Styles/Login_form.css'
function Signup_form() {
    const Navigate = useNavigate()
    return(
        <Container fluid className="">
            <div className=" mb-5">
        <h1>WELCOME!</h1>
        <p>Digitally connect your entire distribution network and make 
faster, data-driven decisions from production to the retail shelf. </p>
            </div>
            <div className="d-flex flex-column form_input align-items-center">
        <input type="text" placeholder="Full Name" />
        <input type="email" placeholder="E-mail" />
        <input type="password" placeholder="Password" />
        <input type="password" placeholder="Confirm Password" />
        <Button onClick={() => Navigate('/signup/userdetails')} style={{padding: "0.5rem 4rem", backgroundColor: "#F3D948"}} className=" rounded-pill border-white">Sign Up</Button>
            </div>
        </Container>

    )
}

export default Signup_form
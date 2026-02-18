import '../Styles/main_cont.css'
import Container from 'react-bootstrap/Container'
import background from '../assets/Hero_assets/Asset 1.png'
import Button from 'react-bootstrap/Button'
function Main_content(){
    return(
        <div className='main_cont vw-100 d-flex justify-content-center align-items-center min-vh-100'>
        <Container fluid className="hero_text text-center d-flex flex-column align-items-center justify-content-center position-absolute z-3">
        <h1 className=' fw-bold'>Connect your supply chain. Predict Demand. <br/> Deliver with Confidence</h1>
        <h3 className=' fw-light text-muted'>This platform unifies producers, wholesalers, and retailers into a single intelligent ecosystem. By combining real-time inventory visibility, predictive demand insights, and smart delivery planning, keeping products moving efficiently across the supply chain.</h3>
        <Button className=' mt-3 btn_signup rounded-pill px-5 fs-5'>Sign Up</Button>
        </Container>
        <Container fluid className='bg_picture position-relative z-0 d-flex justify-content-center mt-auto p-0'>
            <img style={{minWidth: '1200px', objectFit: 'contain'}} className='vw-100 h-auto' src={background} alt="Background picture" />
        </Container>
        </div>

    )
}

export default Main_content
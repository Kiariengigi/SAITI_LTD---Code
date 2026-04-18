import { Container, Row, Col } from "react-bootstrap";
import Navbar_comp from "../Hero_page/navbar";
import Signup_form from "./Signup_form";
import Signup_Animation from "./Signup_Animation";
import "../Styles/Signup_form.css";

function Signup() {
    return (
        <div className="signup-page-wrapper min-vh-100 overflow-hidden position-relative">
            <div className="signup-ambient signup-ambient-left" />
            <div className="signup-ambient signup-ambient-right" />

            <div className="position-absolute top-0 w-100 z-3">
                <Navbar_comp />
            </div>

            <Container fluid className="signup-shell p-0">
                <Row className="g-0 min-vh-100 align-items-stretch">
                    <Col
                        xs={12}
                        lg={5}
                        className="d-flex align-items-center justify-content-center px-4 px-md-5 py-5"
                    >
                        <Signup_form />
                    </Col>

                    <Col lg={7} className="d-none d-lg-block p-0">
                        <div className="signup-visual-panel h-100">
                            <Signup_Animation />
                            <div className="signup-visual-overlay" />
                            <div className="signup-visual-copy">
                                <p className="signup-kicker">SAITI LTD</p>
                                <h2>Build your account with a modern, guided onboarding flow.</h2>
                                <p>
                                    Create an account, add business details, and start managing orders with a cleaner, faster registration experience.
                                </p>
                            </div>
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}

export default Signup;
import { useState } from 'react';
import { Container, Row, Col, Form } from 'react-bootstrap';

import LocationandReach from './LocationandReach';
import type { LocationResult } from './LocationandReach';

import GeneralInfo from './GeneralInfo';
import Productioninfo from './Productioninfo';
import VerticalStepper from './VerticalStepper';

const spinStyle = document.createElement("style")
spinStyle.textContent = `@keyframes spin { to { transform: rotate(360deg); } }`
document.head.appendChild(spinStyle)

const User_Dt_Main = () => {

  const [step, setStep] = useState<number>(1);

  const [formData, setFormData] = useState({
    role_type: 'Merchant',
    business_name: '',
    phone_number: '',
    location: '',
    business_logo: '',

    // Merchant
    business_type: '',
    products_sold: [],
    shelf_capacity: 0,
    initial_stock: [],
    sales_data: '',

    // Wholesaler
    distribution_Areas: [],
    lead_time: 0,

    // Producer
    primary_distribution_partners: [],
    daily_prod: []
  });

  const nextStep = () => setStep(prev => prev + 1);
  const prevStep = () => setStep(prev => prev - 1);

  const [result, setResult] = useState<LocationResult | null>(null)

  return (
    <Container fluid className="p-4 vh-100 overflow-hidden bg-white">
      <Row className="g-0 h-100 rounded-3">

        {/* LEFT PANEL */}
        <Col md={4} lg={3} style={{backgroundColor: '#FFF8DE'}} className="d-flex justify-content-center pt-5 rounded-start-4">
          <VerticalStepper currentStep={step} setStep={setStep} />
        </Col>

        {/* RIGHT PANEL */}
        <Col md={8} lg={9} className=" bg-light d-flex align-items-center justify-content-center px-5 overflow-auto rounded-end-4">
          <div className="w-100" style={{ maxWidth: '600px' }}>

            <Form>

              {step === 1 && (
                <GeneralInfo
                  formData={formData}
                  setFormData={setFormData}
                  onNext={nextStep}
                />
              )}

              {step === 2 && (
                <>
                  <LocationandReach
                    apiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
                    formData={formData}
                    setFormData={setFormData}
                    onNext={nextStep}
                    onBack={prevStep}
                    onChange={setResult}
                    mapHeight='420px'
                  />
                </>
              )}

              {step === 3 && (
                <Productioninfo
                  formData={formData}
                  setFormData={setFormData}
                  onBack={prevStep}
                />
              )}

            </Form>

          </div>
        </Col>

      </Row>
    </Container>
  );
};

export default User_Dt_Main;
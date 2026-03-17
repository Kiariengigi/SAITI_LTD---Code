import '../../Styles/verticalstepper.css'
import { Navbar } from 'react-bootstrap';
import { Link } from 'react-router-dom';
interface StepperProps {
  currentStep: number;
  setStep: (step: number) => void;
}

const VerticalStepper = ({ currentStep, setStep }: StepperProps) => {

  const steps = [
    { id: 1, label: 'General Info' },
    { id: 2, label: 'Location & Reach' },
    { id: 3, label: 'Production Info' },
  ];

  return (
    <div className="stepper-wrapper">
        <Navbar.Brand as={Link} to="/" className="m-0 pb-5">
          <h3 className="logo-text ">
            <span className="fw-bold">SAITI</span>_LTD
          </h3>
        </Navbar.Brand>
        <h3 className=' pb-4'>Create account</h3>
      {steps.map((s, index) => {

        const isCompleted = currentStep > s.id;
        const isActive = currentStep === s.id;

        return (
          <div
            key={s.id}
            onClick={() => {
            if (s.id <= currentStep) setStep(s.id);
            }}
            className={`step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
          >
            <div className="step-circle">
              {isCompleted ? '✓' : s.id}
            </div>

            <span className="step-label ms-3 fs-5">{s.label}</span>

            {index < steps.length - 1 && (
              <div className="step-line"></div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default VerticalStepper;
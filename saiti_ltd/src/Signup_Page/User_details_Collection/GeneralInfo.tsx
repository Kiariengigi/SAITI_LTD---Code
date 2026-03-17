import { useRef } from 'react';
import { Form, Button } from "react-bootstrap";

const GeneralInfo = ({ formData, setFormData, onNext }: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (file: File | undefined) => {
    if (file) {
      setFormData({ ...formData, business_logo: file.name });
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevents the file dialog from opening
    setFormData({ ...formData, business_logo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Reset input to allow re-uploading the same file if needed
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  return (
    <>
      <h3 className="fw-bold mb-4">Account Information</h3>
      
      <Form.Group className="mb-3">
        <Form.Label>Business Role</Form.Label>
        <Form.Select 
          value={formData.role_type} 
          onChange={(e) => setFormData({...formData, role_type: e.target.value})}
          required
        >
          <option value="Producer">Producer</option>
          <option value="Wholesaler">Wholesaler</option>
          <option value="Merchant">Merchant</option>
        </Form.Select>
      </Form.Group>

      <Form.Group className="mb-4">
        <Form.Control 
          type="text" 
          placeholder="Business Name" 
          value={formData.business_name}
          onChange={(e) => setFormData({...formData, business_name: e.target.value})} 
          required 
        />
      </Form.Group>

      {/* Drop Zone with Relative Positioning */}
      <div 
        className="border rounded-4 p-4 text-center bg-light mb-4 position-relative" 
        style={{ 
          cursor: 'pointer', 
          borderStyle: 'dashed',
        }}
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
      >
        {/* Removal Button */}
        {formData.business_logo && (
          <button 
            type="button"
            className="btn-close position-absolute top-0 end-0 m-3" 
            aria-label="Remove logo"
            onClick={removeLogo}
            style={{ zIndex: 10 }}
          ></button>
        )}

        <i className="bi bi-cloud-arrow-up fs-2 text-warning"></i>
        <p className="mb-0 mt-2 fw-bold">
          {formData.business_logo ? formData.business_logo : "Click or drag to upload business logo"}
        </p>
        
        <input 
          type="file" 
          ref={fileInputRef}
          className="d-none" 
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files?.[0])} 
        />
      </div>

      <Form.Group className="mb-4">
        <Form.Control 
          type="text" 
          placeholder="Business Number" 
          value={formData.phone_number}
          onChange={(e) => setFormData({...formData, phone_number: e.target.value})} 
          required 
        />
      </Form.Group>

      <Button variant="warning" className="w-100 rounded-pill" onClick={onNext}>
        Next
      </Button>
    </>
  );
};

export default GeneralInfo;
import { Form, Button } from "react-bootstrap";

const Productioninfo = ({ formData, setFormData, onBack }: any) => (
  <>
    <h3 className="fw-bold mb-4">{formData.role_type} Operational Details</h3>

    {/* Producer Specific Fields */}
    {formData.role_type === 'Producer' && (
      <>
        <Form.Group className="mb-3">
          <Form.Label>Primary Product Category</Form.Label>
          <Form.Select 
            value={formData.primary_product_category}
            onChange={(e) => setFormData({...formData, primary_product_category: e.target.value})}
          >
            <option value="">Select Category</option>
            <option value="Beverages">Beverages</option>
            <option value="FMCG">General FMCG</option>
            <option value="Dairy">Dairy Products</option>
            <option value="Grains">Grains & Cereals</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Daily Production Capacity (Units)</Form.Label>
          <Form.Select 
            value={formData.daily_prod}
            onChange={(e) => setFormData({...formData, daily_prod: e.target.value})}
          >
            <option value="">Select Capacity</option>
            <option value="1000">Up to 1,000</option>
            <option value="5000">1,001 - 5,000</option>
            <option value="10000">5,001 - 10,000</option>
            <option value="50000">10,000+</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Distribution Partners</Form.Label>
          <Form.Select 
            value={formData.primary_distribution_partners}
            onChange={(e) => setFormData({...formData, primary_distribution_partners: e.target.value})}
          >
            <option value="">Select Network Type</option>
            <option value="Local">Local/Regional</option>
            <option value="National">National Coverage</option>
            <option value="Export">International/Export</option>
          </Form.Select>
        </Form.Group>
      </>
    )}

    {/* Wholesaler Specific Fields */}
    {formData.role_type === 'Wholesaler' && (
      <>
        <Form.Group className="mb-3">
          <Form.Label>Distribution Radius (km)</Form.Label>
          <Form.Select 
            value={formData.distribution_radius}
            onChange={(e) => setFormData({...formData, distribution_radius: e.target.value})}
          >
            <option value="">Select Coverage</option>
            <option value="20">Local (Within 20km)</option>
            <option value="50">Regional (Within 50km)</option>
            <option value="100">Wide (Within 100km)</option>
            <option value="200">Extended (100km+)</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Warehouse Storage Capacity</Form.Label>
          <Form.Select 
            value={formData.storage_capacity}
            onChange={(e) => setFormData({...formData, storage_capacity: e.target.value})}
          >
            <option value="">Select Capacity</option>
            <option value="Small">Small (Up to 500 crates)</option>
            <option value="Medium">Medium (500 - 2000 crates)</option>
            <option value="Large">Large (2000+ crates)</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Average Restock Lead Time</Form.Label>
          <Form.Select 
            value={formData.lead_time}
            onChange={(e) => setFormData({...formData, lead_time: e.target.value})}
          >
            <option value="">Select Days</option>
            <option value="1">1 Day</option>
            <option value="3">2-3 Days</option>
            <option value="7">1 Week</option>
            <option value="14">2 Weeks+</option>
          </Form.Select>
        </Form.Group>
      </>
    )}

    {/* Merchant Specific Fields */}
    {formData.role_type === 'Merchant' && (
      <>
        <Form.Group className="mb-3">
          <Form.Label>Business Type</Form.Label>
          <Form.Select 
            value={formData.business_type}
            onChange={(e) => setFormData({...formData, business_type: e.target.value})}
          >
            <option value="">Select Shop Type</option>
            <option value="Kiosk">Kiosk/Small Shop</option>
            <option value="Mini-Market">Mini-Market</option>
            <option value="Retailer">General Retailer</option>
            <option value="Supermarket">Supermarket</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Average Reordering Point (Crates)</Form.Label>
          <Form.Select 
            value={formData.reorder_point}
            onChange={(e) => setFormData({...formData, reorder_point: e.target.value})}
          >
            <option value="2">At 2 Crates</option>
            <option value="5">At 5 Crates</option>
            <option value="10">At 10 Crates</option>
            <option value="20">At 20+ Crates</option>
          </Form.Select>
        </Form.Group>

        <Form.Group className="mb-3">
          <Form.Label>Total Shelf Capacity</Form.Label>
          <Form.Select 
            value={formData.shelf_capacity}
            onChange={(e) => setFormData({...formData, shelf_capacity: e.target.value})}
          >
            <option value="20">Up to 20 Crates</option>
            <option value="50">21 - 50 Crates</option>
            <option value="100">51 - 100 Crates</option>
            <option value="200">100+ Crates</option>
          </Form.Select>
        </Form.Group>
      </>
    )}

    <div className="d-flex gap-2 mt-4">
      <Button variant="dark" className="w-50 rounded-pill" onClick={onBack}>
        Back
      </Button>
      <Button type="submit" variant="warning" className="w-50 rounded-pill text-white fw-bold">
        Complete Sign Up
      </Button>
    </div>
  </>
);

export default Productioninfo;
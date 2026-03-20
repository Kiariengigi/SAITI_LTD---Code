import { Container, Row } from "react-bootstrap"
import pepsi_bottle from '../assets/Products_page/Pepsi-Cola-Soda-Pop-2-Liter-Bottle_297e1fa7-ccfe-41ac-8712-b60046000cd0.340c56162d8eb0cf194fe9581072c357.png'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faInfo } from "@fortawesome/free-solid-svg-icons"
import { Popover, OverlayTrigger } from "react-bootstrap"
interface Order_suggest {
    id: number 
    supplier: string
    productname: string 
    product_img: string
    quantity: number
    price: number
}

interface Order_summary {
    order_Total: number
    order_desc: string
    stockout_In_Days: number 
    stockout_desc: string
    data_Insights: number 
    data_desc: string
    times_Ordered: number 
    Avg_delivery_Day: number
}

var orderItemId = 1

const suggestedOrders:Order_suggest[] = [
  { id: 1, supplier: "Sam West Distributors", productname: "Pepsi 500ml x 12", product_img: pepsi_bottle, quantity: 12, price: 5790 },
  { id: 2, supplier: "Sam West Distributors", productname: "Pepsi 500ml x 12", product_img: pepsi_bottle, quantity: 12, price: 5790 },
  { id: 3, supplier: "Sam West Distributors", productname: "Pepsi 500ml x 12", product_img: pepsi_bottle, quantity: 12, price: 5790 },
  { id: 4, supplier: "Sam West Distributors", productname: "Pepsi 500ml x 12", product_img: pepsi_bottle, quantity: 12, price: 5790 },
  { id: 5, supplier: "Sam West Distributors", productname: "Pepsi 500ml x 12", product_img: pepsi_bottle, quantity: 12, price: 5790 },
];

const summary:Order_summary = {order_Total: 5790, order_desc: "idk bro", stockout_In_Days: 10, stockout_desc: "idk bro", data_Insights: 80, data_desc: "idk bro", times_Ordered: 4, Avg_delivery_Day: 10}


const getPopover = (title: string, desc: string) => (
  <Popover id="popover-basic">
    <Popover.Header as="h3">{title}</Popover.Header>
    <Popover.Body>{desc}</Popover.Body>
  </Popover>
);

function AI_Insights(){
  return (
    <>
      <div className="d-flex align-items-center gap-2 mb-3">
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: 4,
            background: "linear-gradient(135deg, #667eea, #764ba2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg viewBox="0 0 16 16" width="12" height="12" fill="white">
            <path d="M8 1l1.5 3 3.5.5-2.5 2.5.6 3.5L8 9l-3.1 1.5.6-3.5L3 4.5l3.5-.5z" />
          </svg>
        </div>
        <span style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1a1a2e" }}>
          AI Suggested Orders
        </span>
      </div>
      <Container fluid className="p-3" style={{ background: "#f8f9fa", borderBottom: "1px solid #e9ecef" }}>
        <Row className="g-3">
          {/* 80% Section */}
          <div className="col-12 col-lg-9 d-flex overflow-auto py-3 justify-content-center" style={{ gap: '6rem' }}>
            {
              suggestedOrders.map((item) => (
                <div key={item.id} style={{ width: '150px' }} className="flex-shrink-0 text-center">
                  <h6 className="text-muted">{item.supplier}</h6>
                  <h5>{item.productname}</h5>
                  <div className="d-flex align-items-center">
                    <img className="img-fluid" src={item.product_img}/>
                    <h6>{item.quantity}</h6>
                  </div>
                  <h4>KSH {item.price}</h4>
                </div>
              ))
            }
          </div>
          {/* 20% Section */}
          <div className="col-12 col-lg-3 d-flex flex-column justify-content-center border-start">
            <h4>Order Total</h4>
            <h3>KSH {summary.order_Total}</h3>
            <p className="text-muted">Why <span> <FontAwesomeIcon icon={faInfo}/> </span></p>
            <Container fluid className="px-0">
              <Row className="g-2">
                <div className="col-6 text-center">
                  <OverlayTrigger placement="top" overlay={getPopover('AI Insight', summary.data_desc)}>
                    <span style={{cursor: 'pointer'}}>
                      <h2><strong>{summary.data_Insights}%</strong></h2>
                      <h6>Demand Forecasting <FontAwesomeIcon icon={faInfo} size="sm"/></h6>
                    </span>
                  </OverlayTrigger>
                </div>
                <div className="col-6 text-center">
                  <OverlayTrigger placement="top" overlay={getPopover('AI Insight', summary.stockout_desc)}>
                    <span style={{cursor: 'pointer'}}>
                      <h2><strong>{summary.stockout_In_Days} Days</strong></h2>
                      <h6>Until Stockout <FontAwesomeIcon icon={faInfo} size="sm"/></h6>
                    </span>
                  </OverlayTrigger>
                </div>
                <div className="col-6 text-center">
                      <h2><strong>{summary.times_Ordered}</strong></h2>
                      <h6>Times Ordered</h6>
                </div>
                <div className="col-6 text-center">
                      <h2><strong>{summary.Avg_delivery_Day}</strong></h2>
                      <h6>Delivery time</h6>
                </div>
              </Row>
            </Container>
          </div>
        </Row>
      </Container>
    </>
  );
};

export default AI_Insights;

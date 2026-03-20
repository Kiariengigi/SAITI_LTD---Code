interface PromoSlide {
    id: number
    imagePath: string
    title: string 
    link: string
}

import { Carousel } from "react-bootstrap";
import coke from '../assets/Products_page/coke-advertisement-website-banner-design-template-1e534b3188cd3fa4d35ed86b639737f1_screen.jpg'
import pepsi from '../assets/Products_page/1661335819_Mainbanner03.jpg'

var bannerid = 1

const PROMO_DATA:PromoSlide[] = [{id: bannerid++, imagePath: pepsi, title: 'Pepsi_Banner', link: '/profile'}, 
    {id: bannerid++, imagePath: coke, title: 'Coke_Banner', link: '/profile'}]

function Promo_Banner(){
  return (
    <Carousel>
        {
            PROMO_DATA.map((promo) => (
                <Carousel.Item key={promo.id}>
                    <img
                    className='d-block w-100'
                    src={promo.imagePath}
                    alt={promo.title}
                    style={{maxHeight: '350px', objectFit: 'cover'}}
                    />
                </Carousel.Item>
            ))
        }
    </Carousel>
  )
};

export default Promo_Banner;

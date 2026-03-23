import Navbar from '../User_Profile/Header'
import Promo_Banner from './Promo_Banner'
import AI_Insights from './AI_Insights'
import Filter from './Filter'
import ProductGrid from './ProductGrid'
function Products_main(){
    return(
        <>
        <Navbar/>
        <Promo_Banner/>
        <AI_Insights/>
        <ProductGrid/>
        </>
        
    )
}

export default Products_main
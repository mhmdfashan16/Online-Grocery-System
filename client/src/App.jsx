import React from 'react'
import Navbar from './components/Navbar'
import './App.css'
import Home from './pages/Home'
import { Route, Routes, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Footer from './components/Footer'
import Login from './components/Login'
import { useAppContext } from './context/AppContext'
import AllProducts from './pages/AllProducts'
import ProductCategory from './pages/ProductCategory'
import ProductDetails from './pages/ProductDetails'
import Cart from './pages/Cart'
import AddAddress from './pages/AddAddress'
import MyOrders from './pages/MyOrders'
import SellerLogin from './components/seller/sellerLogin'
import SellerLayout from './pages/seller/SellerLayout'
import AddProduct from './pages/seller/AddProduct'
import ProductList from './pages/seller/ProductList'
import Orders from './pages/seller/Orders'
import Loading from './components/Loading'

const App = () => {


  const isSellerPath = useLocation().pathname.includes("seller");
  const {showUserLoggin, IsSeller} = useAppContext();

  return (
    <div className='text-default '>
      {isSellerPath ? "" : <Navbar/>}
      {showUserLoggin ? <Login/> : null}

      <Toaster />
      <div className={`${isSellerPath ? "" : "px-6 md:px-16 lg:px-24 xl:px-32" }`}>
        <Routes>
          <Route path='/' element={<Home/>}/>
          <Route path='/products' element={<AllProducts/>}/>
          <Route path='/products/:category' element={<ProductCategory/>}/>
          <Route path='/product/:category/:id' element={<ProductDetails/>}/>
          <Route path='/cart' element={<Cart/>}/>
          <Route path='/add-address' element={<AddAddress/>}/>
          <Route path='/my-orders' element={<MyOrders/>}/>
          <Route path='/loader' element={<Loading/>}/>
          <Route path='/seller' element={IsSeller ? <SellerLayout/> : <SellerLogin/>}>
            <Route  index element={IsSeller ? <AddProduct/> : null}/>
            <Route path='product-list' element={<ProductList />}/>
            <Route path='orders' element={<Orders/>}/>
          </Route>
          

           

        </Routes>

        {!isSellerPath && <Footer/>}
      </div>


    </div>
  )
}

export default App

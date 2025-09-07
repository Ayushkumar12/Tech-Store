import React from 'react';
import Home from './page/Home';
import Cart from './page/Cart';
import Admin from './page/Admin';
import Order from './page/Order';
import Seller from './page/Seller';
import { BrowserRouter, Routes ,Route} from 'react-router-dom';
import Auth from './Authentication/Auth';
import { AuthProvider } from './Authentication/Authpro';
import Protectroute from './Authentication/Protectroute';

function App() {
  return (
    <section className='ba'>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path='/' element={<Home />}/>
            <Route path='/cart' element={<Cart />} />
            <Route path='/auth' element={<Auth />}/>
            <Route path='/admin' element={<Protectroute roles={["admin"]}><Admin /></Protectroute>} />
            <Route path='/seller' element={<Protectroute roles={["seller","admin"]}><Seller /></Protectroute>} />
            <Route path='/order' element={<Protectroute roles={["admin","seller"]}><Order /></Protectroute>} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </section>
  );
}

export default App;

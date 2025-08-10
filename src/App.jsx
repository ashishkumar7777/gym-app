import { useState } from 'react'
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import 'bootstrap/dist/css/bootstrap.min.css'
import Users from './Users'
import CreateUser from './CreateUser'
import UpdateUser from './UpdateUser'
import Login from './login'
import MemberDashboard from './MemberDashboard'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div>
      <BrowserRouter>
        <Routes>
          <Route path='/' element={<Users />}></Route>
          <Route path='/create' element={<CreateUser />}></Route>
          <Route path='/update/:id' element={<UpdateUser />}></Route>
          <Route path="/login" element={<Login />} />
          <Route path="/member-dashboard" element={<MemberDashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App

import axios from 'axios';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

function CreateUser() {
  const [member, setMember] = useState({
    name: '',
    email: '',
    password: '', 
    age: '',
    number: '',
    membershipType: 'Standard', // Default value
    paymentStatus: {
      isPaid: false,
      lastPaymentDate: null,
      nextDueDate: new Date(new Date().setMonth(new Date().getMonth() + 1))
    }
  });

  
  

  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name in member.paymentStatus) {
      setMember(prev => ({
        ...prev,
        paymentStatus: {
          ...prev.paymentStatus,
          [name]: name === 'isPaid' ? e.target.checked : value
        }
      }));
    } else {
      setMember(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Format dates properly
    const memberToSend = {
      ...member,
      age: Number(member.age),
      paymentStatus: {
        ...member.paymentStatus,
        lastPaymentDate: member.paymentStatus.isPaid ? new Date() : null
      }
    };

    axios.post("http://localhost:3002/members", memberToSend)
      .then(result => {
        console.log("Member created:", result.data);
        navigate('/');
      })
      .catch(err => {
        console.error("Error creating member:", err.response?.data || err.message);
        alert(`Error: ${err.response?.data?.message || err.message}`);
      });
  };

  return (
    <div className='d-flex vh-100 bg-primary justify-content-center align-items-center'>
      <div className='w-50 bg-white rounded p-3'>
        <form onSubmit={handleSubmit}>
          <h2>Add Gym Member</h2>
          
          <div className='mb-2'>
            <label htmlFor="name">Full Name</label>
            <input 
              type="text" 
              placeholder='Enter Full Name' 
              className='form-control'
              id="name"
              name="name"
              value={member.name}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className='mb-2'>
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              placeholder='Enter Email' 
              className='form-control'
              id="email"
              name="email"
              value={member.email}
              onChange={handleChange}
              required
            />
          </div>

            <div className='mb-2'>
                <label htmlFor="password">Password</label>
                <input 
                  type="password" 
                  placeholder='Set Password' 
                  className='form-control'
                  id="password"
                  name="password"
                  value={member.password || ''}
                  onChange={handleChange}
                  required
                />
          </div>
          
          <div className='mb-2'>
            <label htmlFor="age">Age</label>
            <input 
              type="number" 
              placeholder='Enter Age' 
              className='form-control'
              id="age"
              name="age"
              value={member.age}
              onChange={handleChange}
              min="16"
              max="100"
              required
            />
          </div>

          <div className='mb-2'>
            <label htmlFor="age">number</label>
            <input 
              type="number" 
              placeholder='Enter Age' 
              className='form-control'
              id="age"
              name="number"
              value={member.number}
              onChange={handleChange}
              //min="16"
              //max="10000000"
              required
            />
          </div>
          
          <div className='mb-2'>
            <label htmlFor="membershipType">Membership Type</label>
            <select
              className='form-control'
              id="membershipType"
              name="membershipType"
              value={member.membershipType}
              onChange={handleChange}
              required
            >
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="Student">Student</option>
              <option value="Senior">Senior</option>
            </select>
          </div>
          
          <div className='mb-2 form-check'>
            <input
              type="checkbox"
              className='form-check-input'
              id="isPaid"
              name="isPaid"
              checked={member.paymentStatus.isPaid}
              onChange={handleChange}
            />
            <label className='form-check-label' htmlFor="isPaid">
              Payment Completed
            </label>
          </div>
          
          <button type="submit" className='btn btn-success'>Add Member</button>
        </form>
      </div>
    </div>
  );
}

export default CreateUser;
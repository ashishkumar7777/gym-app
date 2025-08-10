import axios from 'axios';
import { useState, useEffect } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';

function UpdateUser() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [age, setAge] = useState('');

 useEffect(() => {
  const token = localStorage.getItem('token');
  axios.get(`http://localhost:3002/members/${id}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
    .then((res) => {
      setName(res.data.name || '');
      setEmail(res.data.email || '');
      setAge(res.data.age || '');
    })
    .catch((err) => console.log(err));
}, [id]);

const handleUpdate = (e) => {
  e.preventDefault();
  const token = localStorage.getItem('token');
  axios.put(
    `http://localhost:3002/members/${id}`,
    { name, email, age },
    { headers: { Authorization: `Bearer ${token}` } }
  )
    .then(() => navigate('/'))
    .catch((err) => console.log(err));
};

  return (
    <div className='d-flex vh-100 bg-primary justify-content-center align-items-center'>
      <div className='w-50 bg-white rounded p-3'>
        <form onSubmit={handleUpdate}>
          <h2>Update User</h2>
          <div className='mb-2'>
            <label htmlFor="name">Name</label>
            <input 
              type="text" 
              id="name"
              className='form-control'
              placeholder='Enter Name' 
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className='mb-2'>
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email"
              className='form-control'
              placeholder='Enter Email' 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className='mb-2'>
            <label htmlFor="age">Age</label>
            <input 
              type="number"
              id="age"
              className='form-control'
              placeholder='Enter Age' 
              value={age}
              onChange={(e) => setAge(e.target.value)}
            />
          </div>
          <button className='btn btn-success'>Update</button>
        </form>
      </div>
    </div>
  );
}

export default UpdateUser;

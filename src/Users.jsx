import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom';
import Logout from './logout';

// ✅ Base URL from env OR fallback to localhost
const API_BASE_URL = import.meta.env.VITE_API_URL || "mongodb+srv://Ashish:Ashish@cluster0.zuueesf.mongodb.net/gymDB?retryWrites=true&w=majority&appName=Cluster0";

function Users() {
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const token = localStorage.getItem('token');

        if (!token) {
            navigate('/login'); // redirect if no token
            return;
        }

        axios.get(`${API_BASE_URL}/members`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(result => {
            console.log("API Response:", result.data);
            setUsers(result.data);
        })
        .catch(err => console.log("Error fetching users:", err));
    }, [navigate]);

    const handleDelete = (id) => {
        const token = localStorage.getItem('token');

        axios.delete(`${API_BASE_URL}/members/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => {
            console.log("Delete response:", res);
            setUsers(users.filter(u => u._id !== id)); // ✅ remove from state instead of reload
        })
        .catch(err => console.log("Error deleting user:", err));
    }

    return (
        <div className='d-flex vh-100 bg-primary justify-content-center align-items-center'>
            <div className='w-50 bg-white rounded p-3'>
                <Link to="/create" className='btn btn-success mb-2'>Add+</Link>

                <table className='table'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Age</th>
                            <th>Membership</th>
                            <th>Payment Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id}>
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.age}</td>
                                <td>{user.membershipType}</td>
                                <td className={user.paymentStatus?.overdue ? 'text-danger' : 'text-success'}>
                                    {user.paymentStatus?.isPaid ? 'Paid' : 'Unpaid'}
                                </td>
                                <td>
                                    <Link to={`/update/${user._id}`} className='btn btn-info'>Update</Link>
                                    <button 
                                        className='btn btn-danger ms-2' 
                                        onClick={() => handleDelete(user._id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Logout />
            </div>
        </div>
    );
}

export default Users;

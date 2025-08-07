import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom';

function Users() {
    const [users, setUsers] = useState([]);

    useEffect(() => {
    const token = localStorage.getItem('token');
    
    axios.get('http://localhost:3002/members', {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(result => {
        console.log("API Response:", result.data);
        setUsers(result.data);
    })
    .catch(err => console.log("Error fetching users:", err));
}, []);

const handleDelete = (id) => {
    const token = localStorage.getItem('token');

    axios.delete(`http://localhost:3002/members/${id}`, {
        headers: {
            Authorization: `Bearer ${token}`
        }
    })
    .then(res => {
        console.log("Delete response:", res);
        window.location.reload();
    })
    .catch(err => console.log("Error deleting user:", err));
}

    return (
        <div className='d-flex vh-100 bg-primary justify-content-center align-items-center'>
            <div className='w-50 bg-white rounded p-3'>
                <Link to="/create" className='btn btn-success'>Add+</Link>

                <table className='table'>
                    <thead>
                        <tr>
                            <th>Name</th>
                            <th>Email</th>
                            <th>Age</th>
                            <th>Membership</th>  {/* Added new column */}
                            <th>Payment Status</th>  {/* Added new column */}
                            <th>new Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map((user) => (
                            <tr key={user._id}>  {/* Changed from user.id to user._id */}
                                <td>{user.name}</td>
                                <td>{user.email}</td>
                                <td>{user.age}</td>
                                <td>{user.membershipType}</td>  {/* New column */}
                                <td className={user.paymentStatus?.overdue ? 'text-danger' : 'text-success'}>
                                    {user.paymentStatus?.isPaid ? 'Paid' : 'Unpaid'}
                                </td>
                                <td>
                                    <Link to={`/update/${user._id}`} className='btn btn-info'>Update</Link>
                                    <button 
                                        className='btn btn-danger ms-2' 
                                        onClick={(e) => handleDelete(user._id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default Users;
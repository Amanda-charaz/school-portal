import React, { useState } from 'react';
import api from '../api/axios';

const Register = () => {
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        role_id: 1 // Default to Student
    });
    const [msg, setMsg] = useState('');

    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            await api.post('/auth/register', formData);
            setMsg('Student created successfully! 🎉');
            setFormData({ full_name: '', email: '', password: '', role_id: 1 });
        } catch (err) {
            setMsg('Error creating student.');
        }
    };

    return (
        <div style={{ padding: '40px' }}>
            <h2>Create New Student Account</h2>
            <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', maxWidth: '300px', gap: '10px' }}>
                <input type="text" placeholder="Full Name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} required />
                <input type="email" placeholder="Email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                <input type="password" placeholder="Password" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required />
                <button type="submit" style={{ backgroundColor: '#4f46e5', color: 'white', padding: '10px', border: 'none', borderRadius: '5px' }}>
                    Register Student
                </button>
            </form>
            {msg && <p>{msg}</p>}
        </div>
    );
};

export default Register;
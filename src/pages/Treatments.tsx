import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Plus, Edit2, Trash2, Search, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import socket from '../lib/socket.ts';

interface Treatment {
  id: number;
  name: string;
  description: string | null;
  baseCost: number;
}

export default function Treatments() {
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTreatment, setEditingTreatment] = useState<Treatment | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    baseCost: ''
  });

  useEffect(() => {
    fetchTreatments();

    // WebSocket listeners
    socket.on('treatment_created', (newTreatment: Treatment) => {
      setTreatments(prev => [...prev, newTreatment].sort((a, b) => a.name.localeCompare(b.name)));
    });

    socket.on('treatment_updated', (updatedTreatment: Treatment) => {
      setTreatments(prev => prev.map(t => t.id === updatedTreatment.id ? updatedTreatment : t));
    });

    socket.on('treatment_deleted', (id: number) => {
      setTreatments(prev => prev.filter(t => t.id !== id));
    });

    return () => {
      socket.off('treatment_created');
      socket.off('treatment_updated');
      socket.off('treatment_deleted');
    };
  }, []);

  const fetchTreatments = async () => {
    try {
      const response = await axios.get('/api/treatments', {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setTreatments(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching treatments:', error);
      setLoading(false);
    }
  };

  const handleOpenModal = (treatment: Treatment | null = null) => {
    if (treatment) {
      setEditingTreatment(treatment);
      setFormData({
        name: treatment.name,
        description: treatment.description || '',
        baseCost: treatment.baseCost.toString()
      });
    } else {
      setEditingTreatment(null);
      setFormData({
        name: '',
        description: '',
        baseCost: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const config = {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      };

      if (editingTreatment) {
        await axios.put(`/api/treatments/${editingTreatment.id}`, formData, config);
      } else {
        await axios.post('/api/treatments', formData, config);
      }

      setIsModalOpen(false);
      fetchTreatments();
    } catch (error) {
      console.error('Error saving treatment:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this treatment?')) {
      try {
        await axios.delete(`/api/treatments/${id}`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        fetchTreatments();
      } catch (error) {
        console.error('Error deleting treatment:', error);
      }
    }
  };

  const filteredTreatments = treatments.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.description && t.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Treatment Management</h1>
          <p className="text-gray-600">Manage available services and their costs</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Add Treatment
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search treatments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base Cost</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">Loading treatments...</td>
                </tr>
              ) : filteredTreatments.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">No treatments found</td>
                </tr>
              ) : (
                filteredTreatments.map((treatment) => (
                  <tr key={treatment.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 height-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                          <Activity size={16} />
                        </div>
                        <span className="font-medium text-gray-900">{treatment.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600 text-sm">{treatment.description || '-'}</td>
                    <td className="px-6 py-4 font-semibold text-gray-900">${treatment.baseCost.toFixed(2)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(treatment)}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(treatment.id)}
                          className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden"
          >
            <div className="p-6 border-b border-gray-100">
              <h2 className="text-xl font-bold text-gray-800">
                {editingTreatment ? 'Edit Treatment' : 'Add New Treatment'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Treatment Name</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base Cost ($)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={formData.baseCost}
                  onChange={(e) => setFormData({ ...formData, baseCost: e.target.value })}
                />
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingTreatment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}

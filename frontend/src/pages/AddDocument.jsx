import React, { useState } from 'react';
import axios from 'axios';
import { CheckCircle, Download, AlertCircle, FileText, User, Building, Phone, Archive } from 'lucide-react';

// Using a different method to access the environment variable
const API_URL = import.meta.env.VITE_API_URL;

const AddDocument = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    departement: '',
    owner_name: '',
    owner_contact: '',
    shelf_code: '',
    box_number: '',
    folder_number: ''
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [createdDocumentId, setCreatedDocumentId] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Create document
      const response = await axios.post(`${API_URL}/documents`, formData);
      
      setSuccess(true);
      setCreatedDocumentId(response.data.id);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        departement: '',
        owner_name: '',
        owner_contact: '',
        shelf_code: '',
        box_number: '',
        folder_number: ''
      });

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to create document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const downloadReceipt = async () => {
    if (!createdDocumentId) return;
    
    setIsDownloading(true);
    try {
      const response = await axios.post(
        `${API_URL}/documents/${createdDocumentId}/generate-receipt`,
        {},
        {
          responseType: 'blob'
        }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_receipt_${createdDocumentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

    } catch (err) {
      setError('Failed to generate receipt. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <FileText size={32} />
            Add New Document
          </h1>
          <p className="text-blue-100 mt-2">Create a new document record and generate a receipt</p>
        </div>

        <div className="p-8">
          {/* Success Message */}
          {success && (
            <div className="mb-8 bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 text-green-800 mb-4">
                <CheckCircle size={24} />
                <h3 className="text-lg font-semibold">Document Created Successfully!</h3>
              </div>
              <p className="text-green-700 mb-4">
                Document ID: <span className="font-mono font-bold">#{createdDocumentId}</span>
              </p>
              <button
                onClick={downloadReceipt}
                disabled={isDownloading}
                className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg flex items-center gap-2 transition-colors font-medium"
              >
                <Download size={20} />
                {isDownloading ? 'Generating PDF...' : 'Download Receipt'}
              </button>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-3 text-red-800">
                <AlertCircle size={20} />
                <p>{error}</p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Document Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FileText size={20} />
                Document Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Document Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Enter document title"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Brief description of the document"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="departement"
                    value={formData.departement}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., HR, Finance, IT"
                  />
                </div>
              </div>
            </div>

            {/* Owner Information Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <User size={20} />
                Owner Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Owner Name
                  </label>
                  <input
                    type="text"
                    name="owner_name"
                    value={formData.owner_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Document owner's name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Information
                  </label>
                  <input
                    type="text"
                    name="owner_contact"
                    value={formData.owner_contact}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="Email or phone number"
                  />
                </div>
              </div>
            </div>

            {/* Storage Location Section */}
            <div>
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Archive size={20} />
                Storage Location
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Shelf Code
                  </label>
                  <input
                    type="text"
                    name="shelf_code"
                    value={formData.shelf_code}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., A1, B2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Box Number
                  </label>
                  <input
                    type="text"
                    name="box_number"
                    value={formData.box_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., 001, 042"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Folder Number
                  </label>
                  <input
                    type="text"
                    name="folder_number"
                    value={formData.folder_number}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    placeholder="e.g., F10, F25"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-6 border-t border-gray-200">
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium text-lg transition-colors flex items-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Creating Document...
                  </>
                ) : (
                  <>
                    <FileText size={20} />
                    Create Document
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddDocument;

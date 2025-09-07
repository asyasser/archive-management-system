import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  Search, 
  Plus, 
  FileText, 
  Download, 
  Edit, 
  Trash2, 
  Calendar, 
  Building, 
  User, 
  Archive,
  AlertCircle,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL;

const Dashboard = () => {
  const [documents, setDocuments] = useState([]);
  const [filteredDocuments, setFilteredDocuments] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDownloading, setIsDownloading] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [editDocument, setEditDocument] = useState(null);
  const [editFormData, setEditFormData] = useState({});
  const [isSaving, setIsSaving] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const documentsPerPage = 15;

  // Load documents on component mount
  useEffect(() => {
    fetchDocuments();
  }, []);

  // Filter and paginate documents when search term, department, or documents list changes
  useEffect(() => {
    filterAndPaginateDocuments();
  }, [documents, searchTerm, selectedDepartment]);

  const fetchDocuments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(`${API_URL}/documents`);
      setDocuments(response.data.documents || []);
      setError('');
      setCurrentPage(1); // Reset to the first page on a new fetch
    } catch (err) {
      setError('Failed to load documents. Please try again.');
      console.error('Error fetching documents:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterAndPaginateDocuments = () => {
    let filtered = documents;

    // Filter by search term (title, description, owner)
    if (searchTerm) {
      filtered = filtered.filter(doc => 
        doc.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        doc.owner_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by department
    if (selectedDepartment) {
      filtered = filtered.filter(doc => 
        doc.departement?.toLowerCase() === selectedDepartment.toLowerCase()
      );
    }

    setFilteredDocuments(filtered);
    setCurrentPage(1); // Reset to the first page when filters change
  };

  const downloadReceipt = async (documentId) => {
    setIsDownloading(documentId);
    try {
      const response = await axios.post(
        `${API_URL}/documents/${documentId}/generate-receipt`,
        {},
        { responseType: 'blob' }
      );

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `document_receipt_${documentId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to generate receipt. Please try again.');
    } finally {
      setIsDownloading(null);
    }
  };

  const deleteDocument = async (documentId) => {
    try {
      await axios.delete(`${API_URL}/documents/${documentId}`);
      await fetchDocuments(); // Refresh the list
      setDeleteConfirm(null);
    } catch (err) {
      setError('Failed to delete document. Please try again.');
    }
  };

  const openEditModal = (document) => {
    setEditDocument(document);
    setEditFormData({
      title: document.title || '',
      description: document.description || '',
      departement: document.departement || '',
      owner_name: document.owner_name || '',
      owner_contact: document.owner_contact || '',
      shelf_code: document.shelf_code || '',
      box_number: document.box_number || '',
      folder_number: document.folder_number || ''
    });
  };

  const closeEditModal = () => {
    setEditDocument(null);
    setEditFormData({});
    setIsSaving(false);
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const saveDocument = async () => {
    if (!editDocument) return;
    
    setIsSaving(true);
    try {
      await axios.put(`${API_URL}/documents/${editDocument.id}`, editFormData);
      await fetchDocuments(); // Refresh the list
      closeEditModal();
      setError('');
    } catch (err) {
      setError('Failed to update document. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get unique departments for filter dropdown
  const departments = [...new Set(documents.map(doc => doc.departement).filter(Boolean))];

  // Logic for pagination
  const indexOfLastDocument = currentPage * documentsPerPage;
  const indexOfFirstDocument = indexOfLastDocument - documentsPerPage;
  const currentDocuments = filteredDocuments.slice(indexOfFirstDocument, indexOfLastDocument);
  const totalPages = Math.ceil(filteredDocuments.length / documentsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-lg mb-8">
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-white flex items-center gap-3">
                <FileText size={32} />
                Document Dashboard
              </h1>
              <p className="text-blue-100 mt-2">
                Manage and search your archived documents
              </p>
            </div>
            <Link 
              to="/add" 
              className="bg-white text-blue-600 px-6 py-3 rounded-lg font-medium hover:bg-blue-50 transition-colors flex items-center gap-2"
            >
              <Plus size={20} />
              Add Document
            </Link>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="p-8 border-b border-gray-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Search Bar */}
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Search documents by title, description, or owner..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Department Filter */}
            <div>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">All Departments</option>
                {departments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Results Counter */}
          <div className="flex justify-between items-center mt-4">
            <p className="text-gray-600">
              {filteredDocuments.length} of {documents.length} documents
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
            <button
              onClick={fetchDocuments}
              className="text-blue-600 hover:text-blue-700 flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center gap-3 text-red-800">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading documents...</p>
        </div>
      ) : (
        <>
          {/* Documents Grid */}
          {currentDocuments.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {currentDocuments.map((doc) => (
                <div key={doc.id} className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow">
                  <div className="p-6">
                    {/* Document Header */}
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2">
                          {doc.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {doc.description || 'No description'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-gray-500">ID #{doc.id}</span>
                      </div>
                    </div>

                    {/* Document Details */}
                    <div className="space-y-2 mb-4">
                      {doc.departement && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Building size={14} />
                          <span>{doc.departement}</span>
                        </div>
                      )}
                      
                      {doc.owner_name && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User size={14} />
                          <span>{doc.owner_name}</span>
                        </div>
                      )}

                      {(doc.shelf_code || doc.box_number || doc.folder_number) && (
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <Archive size={14} />
                          <span>
                            {[doc.shelf_code, doc.box_number, doc.folder_number]
                              .filter(Boolean)
                              .join(' - ') || 'No location'}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Calendar size={14} />
                        <span>{formatDate(doc.date_registered)}</span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-4 border-t border-gray-100">
                      <button
                        onClick={() => downloadReceipt(doc.id)}
                        disabled={isDownloading === doc.id}
                        className="flex-1 bg-blue-50 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1 text-sm font-medium disabled:opacity-50"
                      >
                        {isDownloading === doc.id ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                        ) : (
                          <Download size={16} />
                        )}
                        Receipt
                      </button>

                      <button
                        onClick={() => openEditModal(doc)}
                        className="bg-gray-50 text-gray-600 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center"
                        title="Edit Document"
                      >
                        <Edit size={16} />
                      </button>

                      <button
                        onClick={() => setDeleteConfirm(doc.id)}
                        className="bg-red-50 text-red-600 px-3 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center"
                        title="Delete Document"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <FileText size={64} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No Documents Found</h3>
              <p className="text-gray-500 mb-6">
                {searchTerm || selectedDepartment 
                  ? "No documents match your search criteria." 
                  : "Start by adding your first document to the archive."}
              </p>
              <Link 
                to="/add"
                className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus size={20} />
                Add First Document
              </Link>
            </div>
          )}

          {/* Pagination Controls */}
          {filteredDocuments.length > documentsPerPage && (
            <div className="flex justify-center items-center mt-8 space-x-2">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              
              {/* Page numbers (simplified) */}
              <span className="text-gray-700 font-medium">
                Page {currentPage} of {totalPages}
              </span>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 border border-gray-300 rounded-md text-gray-600 hover:bg-gray-100 disabled:opacity-50 transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          )}
        </>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <AlertCircle size={24} />
              <h3 className="text-lg font-semibold">Delete Document</h3>
            </div>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete this document? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteDocument(deleteConfirm)}
                className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Document Modal */}
      {editDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-8 py-6 rounded-t-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-white flex items-center gap-3">
                    <Edit size={28} />
                    Edit Document
                  </h2>
                  <p className="text-blue-100 mt-1">
                    Document ID: #{editDocument.id}
                  </p>
                </div>
                <button
                  onClick={closeEditModal}
                  className="text-white hover:bg-blue-600 p-2 rounded-lg transition-colors"
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-8">
              <form onSubmit={(e) => { e.preventDefault(); saveDocument(); }} className="space-y-8">
                {/* Document Information Section */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <FileText size={20} />
                    Document Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Document Title *
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={editFormData.title}
                        onChange={handleEditInputChange}
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
                        value={editFormData.description}
                        onChange={handleEditInputChange}
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
                        value={editFormData.departement}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., HR, Finance, IT"
                      />
                    </div>
                  </div>
                </div>

                {/* Owner Information Section */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <User size={20} />
                    Owner Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Owner Name
                      </label>
                      <input
                        type="text"
                        name="owner_name"
                        value={editFormData.owner_name}
                        onChange={handleEditInputChange}
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
                        value={editFormData.owner_contact}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="Email or phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* Storage Location Section */}
                <div>
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Archive size={20} />
                    Storage Location
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shelf Code
                      </label>
                      <input
                        type="text"
                        name="shelf_code"
                        value={editFormData.shelf_code}
                        onChange={handleEditInputChange}
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
                        value={editFormData.box_number}
                        onChange={handleEditInputChange}
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
                        value={editFormData.folder_number}
                        onChange={handleEditInputChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., F10, F25"
                      />
                    </div>
                  </div>
                </div>

                {/* Document Metadata (Read-only) */}
                <div className="bg-gray-50 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                    <Calendar size={20} />
                    Document Metadata
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Document ID:</span>
                      <span className="ml-2 font-medium">#{editDocument.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Date Registered:</span>
                      <span className="ml-2 font-medium">{formatDate(editDocument.date_registered)}</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-4 pt-6 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={closeEditModal}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-8 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Edit size={20} />
                        Save Changes
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

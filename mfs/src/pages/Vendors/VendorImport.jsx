import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { ArrowLeft, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { importVendors } from '@/api/vendors';

const VendorImport = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      const uploadedFile = files[0];
      if (uploadedFile.type === 'text/csv' || uploadedFile.name.endsWith('.csv')) {
        setFile(uploadedFile);
      } else {
        toast.error('Please upload a CSV file');
      }
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type === 'text/csv' || selectedFile.name.endsWith('.csv')) {
        setFile(selectedFile);
      } else {
        toast.error('Please select a CSV file');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to import');
      return;
    }

    setLoading(true);
    try {
      // Parse CSV file
      const text = await file.text();
      const lines = text.trim().split('\n');
      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());

      if (headers.length === 0) {
        toast.error('CSV file is empty');
        return;
      }

      const vendors = [];
      const errors = [];

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.trim());
        if (values.length === 0 || values.every((v) => !v)) continue;

        try {
          const vendor = {
            name: values[headers.indexOf('name')] || '',
            category: values[headers.indexOf('category')] || 'Other',
            email: values[headers.indexOf('email')] || '',
            phone: values[headers.indexOf('phone')] || '',
            address: values[headers.indexOf('address')] || '',
            city: values[headers.indexOf('city')] || '',
            state: values[headers.indexOf('state')] || '',
            zipCode: values[headers.indexOf('zipcode')] || '',
            contactPerson: values[headers.indexOf('contact_person')] || '',
            contractStartDate: values[headers.indexOf('contract_start')] || '',
            contractEndDate: values[headers.indexOf('contract_end')] || '',
            rating: parseFloat(values[headers.indexOf('rating')]) || 0,
            monthlySpend: parseFloat(values[headers.indexOf('monthly_spend')]) || 0,
            status: values[headers.indexOf('status')] || 'active',
          };

          // Validate required fields
          if (!vendor.name) {
            errors.push(`Row ${i + 1}: Vendor name is required`);
            continue;
          }
          if (!vendor.email) {
            errors.push(`Row ${i + 1}: Email is required`);
            continue;
          }

          vendors.push(vendor);
        } catch (error) {
          errors.push(`Row ${i + 1}: ${error.message}`);
        }
      }

      if (vendors.length === 0) {
        setImportResults({
          successful: 0,
          failed: errors.length,
          errors,
        });
        toast.error('No valid vendors found to import.');
        return;
      }

      const response = await importVendors(vendors);
      const apiErrors = Array.isArray(response?.errors) ? response.errors : [];
      const successfulCount = response?.successful ?? vendors.length;
      const failedCount = (response?.failed ?? 0) + errors.length;
      const combinedErrors = [...errors, ...apiErrors];

      setImportResults({
        successful: successfulCount,
        failed: failedCount,
        errors: combinedErrors,
      });

      if (combinedErrors.length === 0) {
        toast.success(`Successfully imported ${successfulCount} vendors!`);
      } else {
        toast.warning(`Imported ${successfulCount} vendors with ${combinedErrors.length} errors`);
      }
    } catch (error) {
      toast.error(`Import failed: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    const csvContent = `name,category,email,phone,address,city,state,zipcode,contact_person,contract_start,contract_end,rating,monthly_spend,status
ABC HVAC Services,HVAC,contact@abchvac.com,(555) 123-4567,123 Tech Street,New York,NY,10001,John Smith,2023-01-15,2025-01-15,4.5,5000,active
XYZ Electrical,Electrical,info@xyzelectric.com,(555) 234-5678,456 Power Ave,Boston,MA,02101,Jane Doe,2023-06-01,2025-06-01,4.8,3500,active
Fresh Clean Co,Cleaning,hello@freshclean.com,(555) 345-6789,789 Clean Lane,Chicago,IL,60601,Bob Johnson,2023-03-10,2024-03-10,4.2,2000,active`;

    const element = document.createElement('a');
    element.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent));
    element.setAttribute('download', 'vendor_import_template.csv');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success('Template downloaded!');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate('/vendors')}
          className="p-2 hover:bg-indigo-100 dark:hover:bg-indigo-900 rounded-lg transition-colors"
          title="Back to vendors"
        >
          <ArrowLeft className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Import Vendors</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Upload a CSV file to import multiple vendors at once
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Upload Card */}
        <div className="lg:col-span-2">
          <Card className="border-0 shadow-md">
            <CardContent className="p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Upload Area */}
                <div
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
                    dragActive
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30'
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400'
                  }`}
                >
                  <Upload className="h-12 w-12 text-indigo-600 dark:text-indigo-400 mx-auto mb-4" />
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {file ? file.name : 'Drag and drop your CSV file here'}
                  </p>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">or</p>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <span className="inline-flex items-center gap-2 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium transition-colors">
                      Browse Files
                    </span>
                  </label>
                </div>

                {/* File Info */}
                {file && (
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800 rounded-lg flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-indigo-600 dark:text-indigo-400 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-indigo-900 dark:text-indigo-100">File selected</p>
                      <p className="text-xs text-indigo-700 dark:text-indigo-300">{file.name}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/vendors')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={loading || !file}
                    className="flex-1 bg-blue-700 hover:bg-blue-800 text-white disabled:opacity-50"
                  >
                    {loading ? 'Importing...' : 'Import Vendors'}
                  </Button>
                </div>
              </form>

              {/* Import Results */}
              {importResults && (
                <div className="mt-6 pt-6 border-t space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Import Results</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                        <span className="font-medium text-emerald-900 dark:text-emerald-100">Successful</span>
                      </div>
                      <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-300">
                        {importResults.successful}
                      </p>
                    </div>
                    <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertCircle className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                        <span className="font-medium text-rose-900 dark:text-rose-100">Failed</span>
                      </div>
                      <p className="text-2xl font-bold text-rose-700 dark:text-rose-300">
                        {importResults.failed}
                      </p>
                    </div>
                  </div>

                  {importResults.errors.length > 0 && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg max-h-48 overflow-y-auto">
                      <p className="font-medium text-amber-900 dark:text-amber-100 mb-3">Errors:</p>
                      <ul className="space-y-2">
                        {importResults.errors.map((error, idx) => (
                          <li
                            key={idx}
                            className="text-sm text-amber-800 dark:text-amber-200 flex items-start gap-2"
                          >
                            <span className="text-amber-600 dark:text-amber-400 font-bold mt-0.5">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Template Card */}
        <div>
          <Card className="border-0 shadow-md sticky top-6">
            <CardHeader className="border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold text-gray-900 dark:text-white">CSV Format</h3>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-2 text-sm">
                <p className="text-gray-700 dark:text-gray-300 font-medium">Required columns:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                  <li>name</li>
                  <li>email</li>
                </ul>

                <p className="text-gray-700 dark:text-gray-300 font-medium mt-4">Optional columns:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400 text-xs">
                  <li>category</li>
                  <li>phone</li>
                  <li>address</li>
                  <li>city, state, zipcode</li>
                  <li>contact_person</li>
                  <li>contract_start, contract_end</li>
                  <li>rating</li>
                  <li>monthly_spend</li>
                  <li>status</li>
                </ul>
              </div>

              <Button
                type="button"
                onClick={downloadTemplate}
                className="w-full bg-blue-700 hover:bg-blue-800 text-white flex items-center justify-center gap-2"
              >
                <Download className="h-4 w-4" />
                Download Template
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default VendorImport;


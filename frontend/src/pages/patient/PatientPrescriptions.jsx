import React, { useState } from 'react';
import { Pill, Calendar, Clock, Download, AlertCircle, CheckCircle, XCircle, TrendingUp } from 'lucide-react';
import { Card, Button, Badge } from '../../components/ui/SharedUI';
import toast from 'react-hot-toast';

const PatientPrescriptions = () => {
  const [activeTab, setActiveTab] = useState('tracker');

  const [medications, setMedications] = useState([]);

  const mockPrescriptions = [];

  const handleTakeMedication = (id) => {
    setMedications(medications.map(med => med.id === id ? { ...med, status: 'taken' } : med));
    toast.success('Dose marked as taken');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'taken': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'missed': return <XCircle className="w-5 h-5 text-red-500" />;
      default: return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const adherence = Math.round((medications.filter(m => m.status === 'taken').length / medications.length) * 100) || 0;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Pill className="w-6 h-6 mr-3 text-primary-600" /> Medication Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track your daily doses, view prescriptions, and monitor adherence.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 bg-gradient-to-r from-primary-50 to-white border-primary-100">
          <div className="flex items-center gap-4">
            <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full border-[6px] border-white shadow-sm bg-primary-100 text-primary-700">
              <span className="text-xl font-bold">{adherence}%</span>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-lg flex items-center">
                Weekly Adherence <TrendingUp className="w-4 h-4 ml-2 text-green-500" />
              </h3>
              <p className="text-sm text-gray-600 mt-1">You are doing great! Keep taking your medications on time to maintain your streak.</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-rose-50 border-rose-100 flex flex-col justify-center">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-rose-500 mt-0.5" />
            <div>
              <h3 className="font-bold text-gray-900">Refill Reminder</h3>
              <p className="text-xs text-gray-600 mt-1"><strong>Metformin 500mg</strong> has 0 refills remaining. Request a new prescription soon.</p>
              <Button size="sm" variant="outline" className="mt-3 bg-white border-rose-200 text-rose-600 hover:bg-rose-50">Request Refill</Button>
            </div>
          </div>
        </Card>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="flex border-b border-gray-100">
          <button className={`px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'tracker' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('tracker')}>
            Daily Tracker
          </button>
          <button className={`px-6 py-4 font-medium text-sm transition-colors ${activeTab === 'prescriptions' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('prescriptions')}>
            Official Prescriptions
          </button>
        </div>

        <div className="p-0">
          {activeTab === 'tracker' && (
            <div className="divide-y divide-gray-100">
              {medications.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No active medications to track for today.
                </div>
              ) : (
                medications.map(med => (
                  <div key={med.id} className={`p-6 flex items-center justify-between transition-colors hover:bg-gray-50 ${med.status === 'taken' ? 'opacity-70' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${med.status === 'taken' ? 'bg-green-100 text-green-600' : med.status === 'missed' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
                        {getStatusIcon(med.status)}
                      </div>
                      <div>
                        <h4 className={`text-lg font-bold ${med.status === 'taken' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{med.name} <span className="text-sm font-medium text-gray-500 no-underline ml-1">{med.dosage}</span></h4>
                        <p className="text-sm text-gray-500 flex items-center mt-1">
                          <Clock className="w-3 h-3 mr-1" /> {med.timing} • <span className="ml-1 text-xs">Prescribed by {med.doctor}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {med.status === 'pending' && (
                        <Button onClick={() => handleTakeMedication(med.id)} className="bg-primary-600 hover:bg-primary-700">Mark as Taken</Button>
                      )}
                      {med.status === 'missed' && (
                        <Badge label="Missed Dose" color="red" />
                      )}
                      {med.status === 'taken' && (
                        <span className="text-sm font-semibold text-green-600 flex items-center">Taken <CheckCircle className="w-4 h-4 ml-1" /></span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'prescriptions' && (
            <div className="p-6 space-y-6 bg-gray-50">
              {mockPrescriptions.length === 0 ? (
                <div className="py-12 text-center text-gray-500 bg-white rounded-xl shadow-sm border border-gray-200">
                  No official prescriptions found.
                </div>
              ) : (
                mockPrescriptions.map((prescription) => (
                  <div key={prescription.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-5 border-b border-gray-100 bg-white flex justify-between items-center flex-wrap gap-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">Rx from {prescription.doctor}</h3>
                        <p className="text-sm text-gray-500">{prescription.specialty} • Issued on {prescription.date}</p>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge label={prescription.status} color={prescription.status === 'Active' ? 'green' : 'gray'} />
                        <Button variant="outline" size="sm" className="flex items-center">
                          <Download className="w-4 h-4 mr-1.5" /> PDF
                        </Button>
                      </div>
                    </div>
                    <div className="p-0 overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicine</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Dosage & Schedule</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Duration</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Refills</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {prescription.medicines.map((med, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 flex items-center">
                                <Pill className="w-4 h-4 text-primary-400 mr-2" /> {med.name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="text-sm text-gray-900 font-medium">{med.dosage}</div>
                                <div className="text-xs text-gray-500">{med.timing}</div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {med.duration}
                              </td>
                              <td className="px-6 py-4 text-sm">
                                {med.refills > 0 ? (
                                  <span className="text-green-600 font-medium">{med.refills} Remaining</span>
                                ) : (
                                  <span className="text-red-500 font-medium">0 Remaining</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientPrescriptions;

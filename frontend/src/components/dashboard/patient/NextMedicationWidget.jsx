import React from 'react';
import { Pill, Clock, CheckCircle } from 'lucide-react';
import { Card, Button } from '../../ui/SharedUI';
import { colors } from '../../../theme/colors';

const NextMedicationWidget = ({ medications = [], loading }) => {
  if (loading) {
    return <Card><div className="animate-pulse h-24 bg-gray-100 rounded-xl"></div></Card>;
  }

  const activeMeds = medications || [];

  if (activeMeds.length === 0) {
    return (
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-lg flex items-center">
            <Pill className="w-5 h-5 mr-2 text-rose-500" /> Today's Medications
          </h3>
        </div>
        <p className="text-gray-500 text-sm text-center py-4">No active medications for today.</p>
      </Card>
    );
  }

  const nextMed = activeMeds.find(m => m.status === 'pending') || activeMeds[0];

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 text-lg flex items-center">
          <Pill className="w-5 h-5 mr-2 text-rose-500" /> Today's Medications
        </h3>
        <span className="text-xs font-semibold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">{activeMeds.filter(m => m.status === 'taken').length} / {activeMeds.length} Taken</span>
      </div>

      <div className="space-y-3">
        {activeMeds.slice(0,3).map(med => (
          <div key={med.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 bg-gray-50/50">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${med.status === 'taken' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                {med.status === 'taken' ? <CheckCircle className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
              </div>
              <div>
                <p className={`text-sm font-semibold ${med.status === 'taken' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>{med.name}</p>
                <p className="text-xs text-gray-500">{med.dosage} • {med.time}</p>
              </div>
            </div>
            {med.status === 'pending' && (
              <button className="text-xs font-medium text-white bg-rose-500 hover:bg-rose-600 px-3 py-1.5 rounded-md transition-colors">
                Take
              </button>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
};

export default NextMedicationWidget;

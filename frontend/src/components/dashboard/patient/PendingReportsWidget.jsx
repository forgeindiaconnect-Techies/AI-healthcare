import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, ChevronRight, AlertCircle } from 'lucide-react';
import { Card, Badge } from '../../ui/SharedUI';
import { colors } from '../../../theme/colors';

const PendingReportsWidget = ({ reports = [], loading }) => {
  const navigate = useNavigate();

  if (loading) {
    return <Card><div className="animate-pulse h-24 bg-gray-100 rounded-xl"></div></Card>;
  }

  if (reports.length === 0) {
    return (
      <Card>
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900 text-lg flex items-center">
            <FileText className="w-5 h-5 mr-2 text-teal-500" /> Medical Reports
          </h3>
        </div>
        <p className="text-gray-500 text-sm text-center py-4">No pending medical reports.</p>
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 text-lg flex items-center">
          <FileText className="w-5 h-5 mr-2 text-teal-500" /> Medical Reports
        </h3>
        <button onClick={() => navigate("/dashboard/reports")} className="text-teal-600 hover:text-teal-700 text-sm font-medium flex items-center">
          View All <ChevronRight className="w-4 h-4 ml-0.5" />
        </button>
      </div>

      <div className="space-y-3">
        {reports.map(report => (
          <div key={report.id} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors" onClick={() => navigate("/dashboard/reports")}>
            <div className="flex items-center gap-3">
              <div className="p-2 bg-teal-50 rounded-lg text-teal-600">
                <FileText className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 flex items-center">
                  {report.name} 
                  {report.critical && <AlertCircle className="w-3 h-3 text-red-500 ml-1" title="Critical/Abnormal Result" />}
                </p>
                <p className="text-xs text-gray-500">{new Date(report.date).toLocaleDateString()}</p>
              </div>
            </div>
            <Badge label={report.status} color={report.status === 'Reviewed' ? colors.success : colors.warning} light />
          </div>
        ))}
      </div>
    </Card>
  );
};

export default PendingReportsWidget;

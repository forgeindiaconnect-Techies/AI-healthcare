import React from 'react';
import { Activity, ArrowRight, HeartPulse, Droplets } from 'lucide-react';
import { Card, Badge } from '../../ui/SharedUI';
import { colors } from '../../../theme/colors';

const AIInsightsWidget = () => {
  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-white border-indigo-100">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-900 text-lg flex items-center">
          <Activity className="w-5 h-5 mr-2 text-indigo-500" /> AI Health Insights
        </h3>
        <Badge label="New" color={colors.primary} />
      </div>

      <div className="space-y-4">
        <p className="text-gray-500 text-sm text-center py-4">No AI health insights available yet.</p>
      </div>
    </Card>
  );
};

export default AIInsightsWidget;

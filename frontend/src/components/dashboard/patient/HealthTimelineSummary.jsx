import React from 'react';
import { GitCommit, Activity, Pill, User } from 'lucide-react';
import { Card } from '../../ui/SharedUI';

const HealthTimelineSummary = () => {
  const events = [];

  return (
    <Card>
      <h3 className="font-bold text-gray-900 text-lg flex items-center mb-5">
        <GitCommit className="w-5 h-5 mr-2 text-gray-400" /> Recent Activity
      </h3>

      <div className="space-y-4">
        {events.length > 0 ? events.map((event, idx) => {
          const Icon = event.icon;
          return (
            <div key={event.id} className="relative pl-6 pb-2">
              {idx !== events.length - 1 && (
                <div className="absolute left-3 top-6 bottom-0 w-px bg-gray-200"></div>
              )}
              <div className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${event.bg}`}>
                <Icon className={`w-3 h-3 ${event.color}`} />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-0.5">{event.date}</p>
                <p className="text-sm font-semibold text-gray-900">{event.title}</p>
                <p className="text-xs text-gray-600">{event.desc}</p>
              </div>
            </div>
          );
        }) : (
          <p className="text-gray-500 text-sm py-4">No recent activity recorded.</p>
        )}
      </div>
    </Card>
  );
};

export default HealthTimelineSummary;

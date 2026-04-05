import { useState } from 'react';
import { Calendar, Download, Loader2 } from 'lucide-react';
import api from '../utility/api';
import toast from 'react-hot-toast';

/**
 * Button to export event(s) to .ics calendar file.
 * - Pass `eventId` for a single event export
 * - Omit `eventId` for "export all my events"
 */
export default function CalendarExportButton({ eventId, label, compact = false }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const url = eventId
        ? `/calendar/event/${eventId}`
        : '/calendar/my-events';

      const res = await api.get(url, { responseType: 'blob' });

      // Create download link
      const blob = new Blob([res.data], { type: 'text/calendar' });
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = eventId ? `event-${eventId}.ics` : 'my-events.ics';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(downloadUrl);

      toast.success('Calendar file downloaded!');
    } catch (err) {
      const msg = err.response?.status === 404
        ? 'Event not found'
        : 'Failed to export calendar';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  if (compact) {
    return (
      <button
        onClick={handleExport}
        disabled={loading}
        title="Add to Calendar"
        className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50"
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
      </button>
    );
  }

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors disabled:opacity-50 text-sm font-medium"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Download className="w-4 h-4" />
      )}
      {label || (eventId ? 'Add to Calendar' : 'Export All Events')}
    </button>
  );
}

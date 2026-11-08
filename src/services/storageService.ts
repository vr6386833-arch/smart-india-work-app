import { WorkerJobRecord, Booking, WorkerProfile } from '../types';
import { safeStorage } from './safeStorage';

const WORKER_RECORDS_KEY = 'smart_india_worker_job_records_v3';

// Clean production worker job records (populates when real workers log jobs or complete bookings)
export const INITIAL_WORKER_JOB_RECORDS: WorkerJobRecord[] = [];

export class StorageService {
  // 1. Get all saved work records
  static getRecords(): WorkerJobRecord[] {
    try {
      const raw = safeStorage.getItem(WORKER_RECORDS_KEY);
      if (!raw) {
        // Initialize with default records
        safeStorage.setItem(WORKER_RECORDS_KEY, JSON.stringify(INITIAL_WORKER_JOB_RECORDS));
        return INITIAL_WORKER_JOB_RECORDS;
      }
      const parsed: WorkerJobRecord[] = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : INITIAL_WORKER_JOB_RECORDS;
    } catch (e) {
      console.error('Failed to parse saved worker records from safeStorage', e);
      return INITIAL_WORKER_JOB_RECORDS;
    }
  }

  // 2. Get records for a specific worker
  static getWorkerRecords(workerId: string): WorkerJobRecord[] {
    const all = this.getRecords();
    return all.filter((r) => r.workerId === workerId);
  }

  // 3. Save / Add a new work record
  static saveRecord(record: WorkerJobRecord): WorkerJobRecord[] {
    try {
      const all = this.getRecords();
      const existingIdx = all.findIndex((r) => r.id === record.id);
      let updated: WorkerJobRecord[];
      if (existingIdx !== -1) {
        updated = [...all];
        updated[existingIdx] = record;
      } else {
        updated = [record, ...all];
      }
      safeStorage.setItem(WORKER_RECORDS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to save worker record in safeStorage', e);
      return this.getRecords();
    }
  }

  // 4. Delete a record
  static deleteRecord(recordId: string): WorkerJobRecord[] {
    try {
      const all = this.getRecords();
      const updated = all.filter((r) => r.id !== recordId);
      safeStorage.setItem(WORKER_RECORDS_KEY, JSON.stringify(updated));
      return updated;
    } catch (e) {
      console.error('Failed to delete worker record', e);
      return this.getRecords();
    }
  }

  // 5. Convert a Booking to a WorkerJobRecord automatically upon completion
  static createRecordFromBooking(
    booking: Booking,
    worker: WorkerProfile,
    finalAmount: number,
    paymentMethod: 'upi' | 'cash',
    txnId?: string,
    notes?: string
  ): WorkerJobRecord {
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newRecord: WorkerJobRecord = {
      id: `rec_${booking.id}_${Date.now()}`,
      workerId: worker.id,
      workerName: worker.name,
      workerPhone: worker.phone,
      bookingId: booking.id,
      jobId: booking.jobId,
      customerName: booking.customerName,
      customerPhone: booking.customerPhone,
      customerAddress: booking.customerAddress,
      customerLocality: booking.customerLocality,
      serviceCategory: booking.serviceCategory,
      serviceSubCategory: booking.serviceSubCategory,
      title: `${booking.serviceCategory.toUpperCase()} Service for ${booking.customerName}`,
      description: `Completed ${booking.serviceSubCategory} at ${booking.customerLocality}. Arrival verified via 4-digit OTP.`,
      date: dateStr,
      time: timeStr,
      durationHours: 2.5,
      totalAmount: finalAmount,
      paidAmount: finalAmount,
      paymentMethod,
      paymentTxnId: txnId || `UPI/${now.getTime().toString().slice(-8)}`,
      paymentStatus: 'paid',
      arrivalOtp: booking.arrivalOtp,
      isOtpVerified: booking.isOtpVerified ?? true,
      commissionPaidToAppOwner: 10,
      customerRating: booking.customerRating || 5,
      customerReview: booking.customerReview || 'कार्य समय पर कुशलतापूर्वक संपन्न हुआ।',
      beforeWorkPhoto: booking.jobPhotos && booking.jobPhotos[0],
      afterWorkPhoto: (booking.completedWorkPhotos && booking.completedWorkPhotos[0]) || (worker.portfolio && worker.portfolio[0]?.imageUrl),
      notes: notes || 'स्मार्ट इंडिया वर्क ऐप बुकिंग द्वारा किया गया कार्य रिकॉर्ड।',
      isManualEntry: false,
      savedTimestamp: Date.now(),
    };

    this.saveRecord(newRecord);
    return newRecord;
  }

  // 6. Export all work records as JSON file
  static exportRecordsAsJSON(workerName: string, records: WorkerJobRecord[]): void {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(records, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    const sanitized = workerName.replace(/[^a-zA-Z0-9]/g, '_');
    downloadAnchor.setAttribute('download', `SmartIndia_${sanitized}_WorkLedger_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  // 7. Export all work records as CSV spreadsheet
  static exportRecordsAsCSV(workerName: string, records: WorkerJobRecord[]): void {
    const headers = [
      'Record ID',
      'Date',
      'Time',
      'Customer Name',
      'Customer Phone',
      'Locality',
      'Address',
      'Category',
      'Sub Category',
      'Title',
      'Total Amount (INR)',
      'Payment Method',
      'Payment Status',
      'UPI Txn ID',
      'Rating',
      'Notes'
    ];

    const rows = records.map((r) => [
      `"${r.id}"`,
      `"${r.date}"`,
      `"${r.time}"`,
      `"${r.customerName.replace(/"/g, '""')}"`,
      `"${r.customerPhone}"`,
      `"${r.customerLocality.replace(/"/g, '""')}"`,
      `"${r.customerAddress.replace(/"/g, '""')}"`,
      `"${r.serviceCategory}"`,
      `"${r.serviceSubCategory.replace(/"/g, '""')}"`,
      `"${r.title.replace(/"/g, '""')}"`,
      r.totalAmount,
      `"${r.paymentMethod.toUpperCase()}"`,
      `"${r.paymentStatus}"`,
      `"${r.paymentTxnId || ''}"`,
      r.customerRating || '',
      `"${(r.notes || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const sanitized = workerName.replace(/[^a-zA-Z0-9]/g, '_');
    link.setAttribute('download', `SmartIndia_${sanitized}_WorkRecords_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  }
}

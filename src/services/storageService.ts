import { WorkerJobRecord, Booking, WorkerProfile } from '../types';
import { safeStorage } from './safeStorage';

const WORKER_RECORDS_KEY = 'smart_india_worker_job_records_v1';

// Initial pre-seeded completed work records for realistic worker history
export const INITIAL_WORKER_JOB_RECORDS: WorkerJobRecord[] = [
  {
    id: 'rec_w1_101',
    workerId: 'w1',
    workerName: 'Rameshwar "Ramesh" Kumar',
    workerPhone: '+91 98765 43210',
    bookingId: 'BK_8019',
    customerName: 'Pooja Aggarwal',
    customerPhone: '+91 98110 55432',
    customerAddress: 'Flat 402, Block C, Mahagun Moderne',
    customerLocality: 'Sector 78, Noida',
    serviceCategory: 'mistry',
    serviceSubCategory: 'Plastering & Wall Repair',
    title: 'Balcony Wall Dampness Treatment & Plastering',
    description: 'Removed damaged flaky plaster, applied Dr. Fixit waterproofing chemical bonding coat, and 12mm smooth sand plastering.',
    date: '05 Sep 2026',
    time: '11:30 AM',
    durationHours: 6,
    totalAmount: 1200,
    paidAmount: 1200,
    paymentMethod: 'upi',
    paymentTxnId: 'UPI/20260905/77894012',
    paymentStatus: 'paid',
    arrivalOtp: '4829',
    isOtpVerified: true,
    commissionPaidToAppOwner: 10,
    customerRating: 5,
    customerReview: 'बहुत ही सफाई और बढ़िया काम किया रमेश जी ने। दीवार अब बिल्कुल नई जैसी हो गई। Highly recommended!',
    beforeWorkPhoto: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=600&q=80',
    afterWorkPhoto: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    notes: 'सीमेंट अल्ट्राटेक सुपर इस्तेमाल हुआ। ग्राहक पूरी तरह संतुष्ट थे।',
    isManualEntry: false,
    savedTimestamp: Date.now() - 4 * 86400000,
  },
  {
    id: 'rec_w1_102',
    workerId: 'w1',
    workerName: 'Rameshwar "Ramesh" Kumar',
    workerPhone: '+91 98765 43210',
    customerName: 'Anil Gupta (Contractor)',
    customerPhone: '+91 98711 22334',
    customerAddress: 'Plot 88, Near Metro Pillar 140',
    customerLocality: 'Sector 62, Noida',
    serviceCategory: 'mistry',
    serviceSubCategory: 'Brick Work',
    title: 'Boundary Wall 9-inch Brick Construction (120 Sq. Ft)',
    description: 'Constructed 9-inch red brick boundary wall with cement-sand mortar ratio 1:4 and concrete coping on top.',
    date: '02 Sep 2026',
    time: '09:00 AM',
    durationHours: 8,
    totalAmount: 2400,
    paidAmount: 2400,
    paymentMethod: 'cash',
    paymentStatus: 'paid',
    isOtpVerified: true,
    customerRating: 5,
    customerReview: 'रमेश जी का हाथ बहुत सीधा है, ईंटों की चुनाई एकदम साहुल में की। समय पर काम पूरा किया।',
    beforeWorkPhoto: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=600&q=80',
    afterWorkPhoto: 'https://images.unsplash.com/photo-1517646287270-a5a9ca602e5c?auto=format&fit=crop&w=600&q=80',
    notes: 'ऑफलाइन काम - कैश पेमेंट मौके पर प्राप्त हुआ।',
    isManualEntry: true,
    savedTimestamp: Date.now() - 7 * 86400000,
  },
  {
    id: 'rec_w1_103',
    workerId: 'w1',
    workerName: 'Rameshwar "Ramesh" Kumar',
    workerPhone: '+91 98765 43210',
    customerName: 'Sunita Sharma',
    customerPhone: '+91 98991 33445',
    customerAddress: 'House 14, Gali 3, Mamura Village',
    customerLocality: 'Sector 66, Noida',
    serviceCategory: 'mistry',
    serviceSubCategory: 'Repair & Renovation',
    title: 'Kitchen Chullah Slab & Washbasin Brick Pedestal',
    description: 'Repaired cracked kitchen counter brick base and built solid foundation support for granite counter.',
    date: '28 Aug 2026',
    time: '02:15 PM',
    durationHours: 4,
    totalAmount: 950,
    paidAmount: 950,
    paymentMethod: 'upi',
    paymentTxnId: 'UPI/20260828/99238120',
    paymentStatus: 'paid',
    arrivalOtp: '9182',
    isOtpVerified: true,
    customerRating: 4.8,
    customerReview: 'Quick and clean brick pedestal repair. Very polite worker.',
    afterWorkPhoto: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&w=600&q=80',
    notes: 'काम 4 घंटे में फाइनल हो गया।',
    isManualEntry: false,
    savedTimestamp: Date.now() - 12 * 86400000,
  },
];

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

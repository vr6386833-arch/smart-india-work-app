import React from 'react';
import { 
  X, 
  Bell, 
  CheckCircle2, 
  Clock, 
  MapPin, 
  Briefcase, 
  IndianRupee, 
  ChevronRight, 
  Sparkles,
  Phone,
  Trash2,
  Volume2,
  Lock,
  Unlock
} from 'lucide-react';
import { WorkerNotification, Language } from '../../types';
import { soundManager } from '../../services/soundEffects';

interface WorkerNotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: WorkerNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onSelectNotificationBooking: (bookingId: string) => void;
  onAcceptBooking?: (bookingId: string) => void;
  language: Language;
}

export const WorkerNotificationsModal: React.FC<WorkerNotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onClearAll,
  onSelectNotificationBooking,
  onAcceptBooking,
  language
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="relative p-2 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-slate-950 font-bold shadow-md">
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center border-2 border-slate-950 animate-pulse">
                  {unreadCount}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-white">
                  {language === 'hi' ? 'कारीगर कार्य सूचनाएँ' : 'Worker Notifications'}
                </h3>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    {unreadCount} {language === 'hi' ? 'नई' : 'New'}
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-400">
                {language === 'hi' ? 'ग्राहकों द्वारा बुक किए गए काम व अलर्ट्स' : 'Customer booking requests & live alerts'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => {
                soundManager.playIncomingJobAlert();
              }}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-xs"
              title={language === 'hi' ? 'अलर्ट साउंड टेस्ट करें' : 'Test notification sound'}
            >
              <Volume2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Skill-Match Routing Assurance Banner */}
        <div className="px-4 py-2 bg-gradient-to-r from-blue-950/80 via-slate-950 to-indigo-950/80 border-b border-blue-500/30 flex items-center gap-2 text-[10px] text-blue-200">
          <Briefcase className="w-3.5 h-3.5 text-blue-400 shrink-0" />
          <span className="leading-tight">
            {language === 'hi'
              ? '🎯 कौशल-आधारित अलर्ट: ग्राहक जो काम बुक करते हैं, केवल उसी ट्रेड के कारीगरों को यह सूचना मिलती है।'
              : '🎯 Trade-Targeted Dispatch: Notifications are routed strictly to workers matching the requested service trade.'}
          </span>
        </div>

        {/* Quick Action bar */}
        {notifications.length > 0 && (
          <div className="px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between text-[11px]">
            <button
              onClick={() => {
                soundManager.playTap();
                onMarkAllAsRead();
              }}
              className="text-emerald-400 hover:underline font-semibold flex items-center gap-1"
            >
              <CheckCircle2 className="w-3 h-3" />
              <span>{language === 'hi' ? 'सभी को पढ़ा हुआ मार्क करें' : 'Mark all read'}</span>
            </button>
            <button
              onClick={() => {
                soundManager.playTap();
                onClearAll();
              }}
              className="text-slate-400 hover:text-rose-400 font-semibold flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>{language === 'hi' ? 'सभी हटाएं' : 'Clear all'}</span>
            </button>
          </div>
        )}

        {/* Notifications List */}
        <div className="p-3 overflow-y-auto space-y-2.5 flex-1">
          {notifications.length > 0 ? (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => {
                  soundManager.playTap();
                  onMarkAsRead(notif.id);
                  if (notif.bookingId) {
                    onSelectNotificationBooking(notif.bookingId);
                    onClose();
                  }
                }}
                className={`p-3 rounded-2xl border transition-all cursor-pointer relative group ${
                  notif.isRead
                    ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-300'
                    : 'bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/50 shadow-lg shadow-emerald-950/30'
                }`}
              >
                {!notif.isRead && (
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                )}

                <div className="flex items-start gap-2.5">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                    notif.type === 'new_booking'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : notif.type === 'new_lead'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                      : 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  }`}>
                    {notif.type === 'new_booking' ? (
                      <Briefcase className="w-4 h-4" />
                    ) : notif.type === 'new_lead' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : (
                      <Bell className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between pr-4">
                      <div className="flex items-center gap-1.5 truncate">
                        <h4 className="text-xs font-bold text-white truncate">
                          {language === 'hi' ? notif.titleHi : notif.title}
                        </h4>
                        {notif.category && (
                          <span className="px-1.5 py-0.2 rounded-md bg-blue-500/20 text-blue-300 text-[9px] font-bold border border-blue-500/30 shrink-0">
                            🎯 {notif.category.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0 flex items-center gap-1 font-mono">
                        <Clock className="w-2.5 h-2.5" />
                        {notif.time}
                      </span>
                    </div>

                    <p className="text-[11px] text-slate-300 mt-1 leading-snug">
                      {language === 'hi' ? notif.messageHi : notif.message}
                    </p>

                    {/* Booking meta info */}
                    {(notif.customerLocality || notif.amount) && (
                      <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px]">
                        {notif.customerLocality && (
                          <span className="text-slate-400 flex items-center gap-1 truncate max-w-[180px]">
                            <MapPin className="w-3 h-3 text-orange-400 shrink-0" />
                            <span className="truncate">{notif.customerLocality}</span>
                          </span>
                        )}
                        {notif.amount && (
                          <span className="text-emerald-400 font-bold font-mono flex items-center">
                            <IndianRupee className="w-3 h-3" />
                            {notif.amount}
                          </span>
                        )}
                      </div>
                    )}

                    {notif.bookingId && (
                      <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between gap-2">
                        <span className="text-[9px] font-mono text-slate-500">
                          {notif.bookingId}
                        </span>

                        {onAcceptBooking && !notif.isRead ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              soundManager.playSuccessCoin();
                              onMarkAsRead(notif.id);
                              if (notif.bookingId) {
                                onAcceptBooking(notif.bookingId);
                                onSelectNotificationBooking(notif.bookingId);
                              }
                              onClose();
                            }}
                            className="py-1.5 px-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 text-slate-950 font-black text-[11px] flex items-center gap-1.5 shadow-md shadow-emerald-950/40 active:scale-95 transition-all"
                          >
                            <Unlock className="w-3 h-3 text-slate-950" />
                            <span>{language === 'hi' ? '✓ स्वीकारें व लोकेशन देखें' : 'Accept & Unlock Location'}</span>
                          </button>
                        ) : (
                          <span className="text-[10px] text-emerald-400 font-semibold group-hover:underline flex items-center gap-1">
                            <span>{language === 'hi' ? 'काम विवरण देखें' : 'View Job Details'}</span>
                            <ChevronRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 px-4 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 text-slate-500 mx-auto flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <p className="text-xs text-slate-400 font-medium">
                {language === 'hi' ? 'फिलहाल कोई नई सूचना नहीं है' : 'No notifications right now'}
              </p>
              <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                {language === 'hi' 
                  ? 'जैसे ही कोई ग्राहक काम बुक करेगा, आपको तुरंत यहाँ लाइव नोटिफिकेशन और अलर्ट मिलेगा।'
                  : 'As soon as a customer books work, you will receive an instant live alert and notification here.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

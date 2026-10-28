import React, { useState } from 'react';
import { 
  Code2, 
  Database, 
  Server, 
  Smartphone, 
  Layers, 
  Copy, 
  Check, 
  Download, 
  Terminal, 
  FolderTree, 
  ShieldCheck, 
  IndianRupee, 
  Sparkles,
  Play,
  FileCode,
  Cpu,
  Cloud
} from 'lucide-react';
import { soundManager } from '../../services/soundEffects';

export const BackendFlutterStudio: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'architecture' | 'mongodb' | 'express_api' | 'flutter_tree' | 'flutter_code' | 'api_tester' | 'aws_server'>('architecture');
  const [selectedFlutterFile, setSelectedFlutterFile] = useState<string>('otp_verification_dialog.dart');
  const [copiedCodeKey, setCopiedCodeKey] = useState<string | null>(null);

  // API Tester states
  const [apiEndpoint, setApiEndpoint] = useState<string>('/api/bookings/verify-arrival-otp');
  const [apiMethod, setApiMethod] = useState<'GET' | 'POST'>('POST');
  const [apiRequestBody, setApiRequestBody] = useState<string>(JSON.stringify({
    bookingId: "BK_9081",
    workerId: "w1",
    enteredOtp: "8492",
    microFee: 10
  }, null, 2));
  const [apiResponse, setApiResponse] = useState<string | null>(null);
  const [isApiLoading, setIsApiLoading] = useState<boolean>(false);

  const copyToClipboard = (text: string, key: string) => {
    soundManager.playTap();
    navigator.clipboard.writeText(text);
    setCopiedCodeKey(key);
    setTimeout(() => {
      setCopiedCodeKey(null);
    }, 2000);
  };

  const handleTestApi = () => {
    soundManager.playTap();
    setIsApiLoading(true);
    setTimeout(() => {
      soundManager.playSuccessCoin();
      if (apiEndpoint === '/api/bookings/verify-arrival-otp') {
        setApiResponse(JSON.stringify({
          status: "success",
          code: 200,
          message: "Arrival OTP verified successfully. ₹10.00 micro-fee deducted from wallet.",
          data: {
            bookingId: "BK_9081",
            status: "otp_verified",
            customerDetails: {
              fullName: "Priya Sharma",
              phone: "+91 98711 00223",
              unmaskedAddress: "Flat 704, Tower B, Express Green Apartments, Sector 44, Noida - 201301",
              location: { lat: 28.5630, lng: 77.3380 }
            },
            walletTransaction: {
              transactionId: "TX_LEAD_849201",
              amountDeducted: 10,
              remainingBalance: 110,
              timestamp: new Date().toISOString()
            }
          }
        }, null, 2));
      } else if (apiEndpoint === '/api/workers/nearby') {
        setApiResponse(JSON.stringify({
          status: "success",
          count: 2,
          workers: [
            {
              id: "w1",
              name: "Rameshwar Kumar",
              category: "mistry",
              distanceKm: 1.4,
              dailyRate: 950,
              rating: 4.88,
              isAadhaarVerified: true,
              isOnline: true
            },
            {
              id: "w2",
              name: "Sunil Verma",
              category: "electrician",
              distanceKm: 2.1,
              dailyRate: 1100,
              rating: 4.95,
              isAadhaarVerified: true,
              isOnline: true
            }
          ]
        }, null, 2));
      } else if (apiEndpoint === '/api/payments/generate-dynamic-upi-qr') {
        setApiResponse(JSON.stringify({
          status: "success",
          code: 200,
          message: "Dynamic Bharat UPI QR code generated with itemized invoice payload.",
          data: {
            bookingId: "BK_9081",
            workerVpa: "rameshwar.kumar@okicici",
            merchantName: "Rameshwar Kumar",
            currency: "INR",
            baseLaborAmount: 950.00,
            materialsAmount: 250.00,
            totalPayable: 1200.00,
            upiIntentUrl: "upi://pay?pa=rameshwar.kumar@okicici&pn=Rameshwar%20Kumar&am=1200.00&cu=INR&tn=SmartIndia%20Work%20BK_9081",
            supportedApps: ["PhonePe", "GooglePay", "Paytm", "BHIM", "CRED"],
            soundboxVoiceEnabled: true,
            settlementType: "P2P_DIRECT_BANK_0_PERCENT_COMMISSION"
          }
        }, null, 2));
      } else if (apiEndpoint === '/api/company/upi-qr-payment') {
        setApiResponse(JSON.stringify({
          status: "success",
          code: 200,
          message: "Company QR payment verified & credited to Smart India Corporate account.",
          data: {
            merchantName: "Smart India Technologies Pvt Ltd",
            merchantVpa: "smartindia.official@icici",
            corporateGstin: "07AAECS1492Q1ZV",
            invoiceNumber: "SI-INV-891042",
            payerPartnerPhone: "+919876543210",
            paymentPurpose: "WORKER_WALLET_LEAD_TOPUP",
            amountReceived: 500.00,
            utrReference: "UTR/423891048291",
            settledTimestamp: new Date().toISOString(),
            walletBalanceAfter: 570.00,
            voiceSoundboxBroadcast: "Payment of 500 Rupees received in Smart India Company Account"
          }
        }, null, 2));
      } else {
        setApiResponse(JSON.stringify({
          status: "success",
          message: "Wallet recharge initiated via UPI Gateway.",
          orderId: "UPI_ORD_77491",
          amount: 100,
          qrPayload: "upi://pay?pa=smartindiawork@icici&pn=SmartIndia&am=100&cu=INR"
        }, null, 2));
      }
      setIsApiLoading(false);
    }, 500);
  };

  // Dart code samples
  const flutterCodeFiles: Record<string, string> = {
    'main.dart': `// lib/main.dart
// Smart India Work App - Production Dual-Mode Entrypoint
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:google_fonts/google_fonts.dart';
import 'blocs/auth/auth_bloc.dart';
import 'blocs/wallet/wallet_bloc.dart';
import 'blocs/booking/booking_bloc.dart';
import 'presentation/screens/splash_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const SmartIndiaApp());
}

class SmartIndiaApp extends StatelessWidget {
  const SmartIndiaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiBlocProvider(
      providers: [
        BlocProvider<AuthBloc>(create: (ctx) => AuthBloc()..add(CheckAuthSession())),
        BlocProvider<WalletBloc>(create: (ctx) => WalletBloc()..add(FetchWalletBalance())),
        BlocProvider<BookingBloc>(create: (ctx) => BookingBloc()),
      ],
      child: MaterialApp(
        title: 'Smart India Work App',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          useMaterial3: true,
          brightness: Brightness.dark,
          scaffoldBackgroundColor: const Color(0xFF0F172A),
          textTheme: GoogleFonts.plusJakartaSansTextTheme(
            ThemeData(brightness: Brightness.dark).textTheme,
          ),
          colorScheme: const ColorScheme.dark(
            primary: Color(0xFF10B981), // Emerald
            secondary: Color(0xFFF59E0B), // Amber
            surface: Color(0xFF1E293B),
          ),
        ),
        home: const SplashScreen(),
      ),
    );
  }
}`,

    'otp_verification_dialog.dart': `// lib/presentation/screens/worker/otp_verification_dialog.dart
// Core OTP Verification & ₹10 Micro-Fee Lead Deduction
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:pinput/pinput.dart';
import '../../../blocs/booking/booking_bloc.dart';
import '../../../blocs/wallet/wallet_bloc.dart';

class OtpVerificationDialog extends StatefulWidget {
  final String bookingId;
  final String customerName;
  final int microFee;

  const OtpVerificationDialog({
    super.key,
    required this.bookingId,
    required this.customerName,
    this.microFee = 10,
  });

  @override
  State<OtpVerificationDialog> createState() => _OtpVerificationDialogState();
}

class _OtpVerificationDialogState extends State<OtpVerificationDialog> {
  final TextEditingController _otpController = TextEditingController();
  bool _isLoading = false;
  String? _errorMessage;

  void _verifyOtp(String enteredPin) {
    if (enteredPin.length < 4) return;
    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    // Dispatch verification to BookingBloc
    context.read<BookingBloc>().add(
      VerifyArrivalOtpEvent(
        bookingId: widget.bookingId,
        enteredOtp: enteredPin,
        microFee: widget.microFee,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<BookingBloc, BookingState>(
      listener: (context, state) {
        if (state is BookingOtpVerifiedState) {
          // Trigger wallet deduction update
          context.read<WalletBloc>().add(FetchWalletBalance());
          Navigator.of(context).pop(true);
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(
              backgroundColor: Color(0xFF10B981),
              content: Text('✓ OTP Verified! ₹10 lead fee deducted. Customer phone unlocked.'),
            ),
          );
        } else if (state is BookingErrorState) {
          setState(() {
            _isLoading = false;
            _errorMessage = state.message;
          });
        }
      },
      builder: (context, state) {
        return Dialog(
          backgroundColor: const Color(0xFF1E293B),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(28)),
          child: Padding(
            padding: const EdgeInsets.all(24.0),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                const CircleAvatar(
                  radius: 30,
                  backgroundColor: Color(0xFFF59E0B),
                  child: Icon(Icons.key, color: Colors.black, size: 30),
                ),
                const SizedBox(height: 16),
                const Text(
                  'Enter Customer 4-Digit OTP',
                  style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.white),
                ),
                const SizedBox(height: 6),
                Text(
                  'Ask \${widget.customerName} for the 4-digit code shown on their app upon arrival.',
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8)),
                ),
                const SizedBox(height: 20),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: const Color(0xFF0F172A),
                    borderRadius: BorderRadius.circular(16),
                    border: Border.all(color: const Color(0xFF334155)),
                  ),
                  child: Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Lead Connection Fee:', style: TextStyle(color: Color(0xFF94A3B8), fontSize: 12)),
                      Text('₹\${widget.microFee}.00', style: const TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontSize: 14)),
                    ],
                  ),
                ),
                const SizedBox(height: 20),
                Pinput(
                  length: 4,
                  controller: _otpController,
                  onCompleted: _verifyOtp,
                  defaultPinTheme: PinTheme(
                    width: 56,
                    height: 60,
                    textStyle: const TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Color(0xFFFCD34D)),
                    decoration: BoxDecoration(
                      color: const Color(0xFF0F172A),
                      borderRadius: BorderRadius.circular(16),
                      border: Border.all(color: const Color(0xFF475569)),
                    ),
                  ),
                ),
                if (_errorMessage != null) ...[
                  const SizedBox(height: 12),
                  Text(_errorMessage!, style: const TextStyle(color: Colors.redAccent, fontSize: 12)),
                ],
                const SizedBox(height: 24),
                SizedBox(
                  width: double.infinity,
                  height: 48,
                  child: ElevatedButton(
                    onPressed: _isLoading ? null : () => _verifyOtp(_otpController.text),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFF10B981),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                    ),
                    child: _isLoading 
                      ? const CircularProgressIndicator(color: Colors.white)
                      : Text('Verify OTP & Deduct ₹\${widget.microFee}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                )
              ],
            ),
          ),
        );
      },
    );
  }
}`,

    'worker_home_screen.dart': `// lib/presentation/screens/worker/worker_home_screen.dart
// Worker Radar, Active Online Toggle & Incoming Broadcast Feed
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import '../../../blocs/worker/worker_bloc.dart';
import '../../../blocs/wallet/wallet_bloc.dart';
import 'active_trip_screen.dart';

class WorkerHomeScreen extends StatelessWidget {
  const WorkerHomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        backgroundColor: const Color(0xFF0F172A),
        title: const Text('Smart India Partner', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
        actions: [
          BlocBuilder<WalletBloc, WalletState>(
            builder: (context, state) {
              final balance = state is WalletLoaded ? state.balance : 0;
              return Container(
                margin: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 4),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: const Color(0xFF10B981).withOpacity(0.4)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.account_balance_wallet, color: Color(0xFF10B981), size: 16),
                    const SizedBox(width: 6),
                    Text('₹\$balance', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                  ],
                ),
              );
            },
          ),
          BlocBuilder<WorkerBloc, WorkerState>(
            builder: (context, state) {
              final isOnline = state.isOnline;
              return Switch(
                value: isOnline,
                activeColor: const Color(0xFF10B981),
                onChanged: (val) {
                  context.read<WorkerBloc>().add(ToggleOnlineDutyEvent(val));
                },
              );
            },
          ),
        ],
      ),
      body: BlocBuilder<WorkerBloc, WorkerState>(
        builder: (context, state) {
          if (!state.isOnline) {
            return const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.power_settings_new, size: 60, color: Colors.grey),
                  SizedBox(height: 12),
                  Text('You are currently Offline', style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold)),
                  Text('Turn on duty switch above to receive leads', style: TextStyle(color: Colors.grey)),
                ],
              ),
            );
          }

          return ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: state.availableLeads.length,
            itemBuilder: (context, index) {
              final lead = state.availableLeads[index];
              return Card(
                color: const Color(0xFF1E293B),
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                margin: const EdgeInsets.only(bottom: 16),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        mainAxisAlignment: MainAxisAlignment.spaceBetween,
                        children: [
                          Chip(
                            label: Text(lead.urgency.toUpperCase(), style: const TextStyle(fontSize: 10, fontWeight: FontWeight.bold)),
                            backgroundColor: const Color(0xFFF59E0B).withOpacity(0.2),
                            side: const BorderSide(color: Color(0xFFF59E0B)),
                          ),
                          Text('₹\${lead.budget}', style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Color(0xFF10B981))),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(lead.title, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                      const SizedBox(height: 4),
                      Text(lead.description, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                      const SizedBox(height: 12),
                      Row(
                        children: [
                          const Icon(Icons.location_on, size: 14, color: Colors.orange),
                          const SizedBox(width: 4),
                          Text(lead.locality, style: const TextStyle(fontSize: 12, color: Colors.white70)),
                        ],
                      ),
                      const SizedBox(height: 16),
                      SizedBox(
                        width: double.infinity,
                        height: 44,
                        child: ElevatedButton.icon(
                          onPressed: () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(builder: (_) => ActiveTripScreen(lead: lead)),
                            );
                          },
                          icon: const Icon(Icons.navigation, size: 16),
                          label: const Text('Accept & Start GPS Navigation'),
                          style: ElevatedButton.styleFrom(
                            backgroundColor: const Color(0xFF10B981),
                            foregroundColor: Colors.white,
                            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                          ),
                        ),
                      )
                    ],
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}`,

    'live_tracking_screen.dart': `// lib/presentation/screens/customer/live_tracking_screen.dart
// Real-time GPS Worker Tracking Map with Arrival 4-Digit OTP Box
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import '../../../models/booking_model.dart';

class LiveTrackingScreen extends StatefulWidget {
  final BookingModel booking;
  const LiveTrackingScreen({super.key, required this.booking});

  @override
  State<LiveTrackingScreen> createState() => _LiveTrackingScreenState();
}

class _LiveTrackingScreenState extends State<LiveTrackingScreen> {
  late GoogleMapController _mapController;
  final LatLng _customerLoc = const LatLng(28.5630, 77.3380);
  final LatLng _workerLoc = const LatLng(28.5710, 77.3450);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Live Worker Tracking'),
        backgroundColor: const Color(0xFF0F172A),
      ),
      body: Stack(
        children: [
          // Google Map
          GoogleMap(
            initialCameraPosition: CameraPosition(target: _customerLoc, zoom: 14.5),
            onMapCreated: (ctrl) => _mapController = ctrl,
            markers: {
              Marker(
                markerId: const MarkerId('customer'),
                position: _customerLoc,
                infoWindow: const InfoWindow(title: 'Your Doorstep'),
                icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
              ),
              Marker(
                markerId: const MarkerId('worker'),
                position: _workerLoc,
                infoWindow: InfoWindow(title: '\${widget.booking.workerName} (En Route)'),
                icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueGreen),
              ),
            },
          ),

          // Top Floating OTP Banner
          Positioned(
            top: 16,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF0F172A).withOpacity(0.95),
                borderRadius: BorderRadius.circular(20),
                border: Border.all(color: const Color(0xFFF59E0B)),
                boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 10)],
              ),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text(
                        'DOORSTEP ARRIVAL OTP',
                        style: TextStyle(fontSize: 10, fontWeight: FontWeight.bold, color: Color(0xFFF59E0B)),
                      ),
                      const SizedBox(height: 2),
                      const Text(
                        'Share with worker when they arrive:',
                        style: TextStyle(fontSize: 11, color: Colors.white70),
                      ),
                    ],
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: Colors.black,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: const Color(0xFFF59E0B)),
                    ),
                    child: Text(
                      widget.booking.arrivalOtp,
                      style: const TextStyle(
                        fontSize: 20,
                        fontWeight: FontWeight.w900,
                        letterSpacing: 4,
                        color: Color(0xFFFCD34D),
                        fontFamily: 'monospace',
                      ),
                    ),
                  )
                ],
              ),
            ),
          ),

          // Bottom Worker Info BottomSheet
          Positioned(
            bottom: 0,
            left: 0,
            right: 0,
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: const BoxDecoration(
                color: Color(0xFF1E293B),
                borderRadius: BorderRadius.vertical(top: Radius.circular(28)),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Row(
                    children: [
                      CircleAvatar(
                        radius: 26,
                        backgroundImage: NetworkImage(widget.booking.workerAvatar),
                      ),
                      const SizedBox(width: 14),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(widget.booking.workerName, style: const TextStyle(fontSize: 15, fontWeight: FontWeight.bold, color: Colors.white)),
                            Text(widget.booking.serviceCategory, style: const TextStyle(fontSize: 12, color: Color(0xFF94A3B8))),
                            const Row(
                              children: [
                                Icon(Icons.star, size: 14, color: Colors.amber),
                                SizedBox(width: 4),
                                Text('4.88 Rating (Aadhaar Verified)', style: TextStyle(fontSize: 11, color: Colors.amber)),
                              ],
                            )
                          ],
                        ),
                      ),
                      IconButton.filledTonal(
                        onPressed: () {},
                        icon: const Icon(Icons.phone, color: Color(0xFF10B981)),
                        style: IconButton.styleFrom(backgroundColor: const Color(0xFF10B981).withOpacity(0.2)),
                      ),
                    ],
                  )
                ],
              ),
            ),
          )
        ],
      ),
    );
  }
}`,

    'dynamic_upi_qr_dialog.dart': `// lib/presentation/screens/worker/dynamic_upi_qr_dialog.dart
// Production-Ready Dynamic Bharat UPI QR Code Generator with Soundbox Voice Alert
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_tts/flutter_tts.dart';

class DynamicUpiQrDialog extends StatefulWidget {
  final String workerName;
  final String workerUpiVpa; // e.g. 9876543210@ybl or rameshwar@icici
  final String bookingId;
  final double baseLaborAmount;

  const DynamicUpiQrDialog({
    super.key,
    required this.workerName,
    required this.workerUpiVpa,
    required this.bookingId,
    required this.baseLaborAmount,
  });

  @override
  State<DynamicUpiQrDialog> createState() => _DynamicUpiQrDialogState();
}

class _DynamicUpiQrDialogState extends State<DynamicUpiQrDialog> {
  final FlutterTts _flutterTts = FlutterTts();
  final TextEditingController _materialsController = TextEditingController(text: '0');
  double _materialCost = 0.0;
  bool _isPaymentSettled = false;
  String _settledTxnId = '';

  double get _totalAmount => widget.baseLaborAmount + _materialCost;

  String get _upiIntentString {
    final vpa = Uri.encodeComponent(widget.workerUpiVpa);
    final name = Uri.encodeComponent(widget.workerName);
    final amount = _totalAmount.toStringAsFixed(2);
    final note = Uri.encodeComponent('SmartIndia Work \${widget.bookingId}');
    return 'upi://pay?pa=\$vpa&pn=\$name&am=\$amount&cu=INR&tn=\$note';
  }

  @override
  void initState() {
    super.initState();
    _initTts();
  }

  void _initTts() async {
    await _flutterTts.setLanguage("en-IN");
    await _flutterTts.setPitch(1.0);
    await _flutterTts.setSpeechRate(0.5);
  }

  void _playSimulatedSoundboxAlert() async {
    final amountStr = _totalAmount.toStringAsFixed(0);
    await _flutterTts.speak("Payment received of \$$amountStr Rupees on UPI. Smart India Partner verified.");
  }

  void _launchUpiDirectIntent() async {
    final uri = Uri.parse(_upiIntentString);
    if (await canLaunchUrl(uri)) {
      await launchUrl(uri, mode: LaunchMode.externalApplication);
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('No UPI app (GPay/PhonePe/Paytm) found. Show QR instead.')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF0F172A),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(28),
        side: const BorderSide(color: Color(0xFF10B981), width: 1.5),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF10B981).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.qr_code_2, color: Color(0xFF10B981), size: 24),
                    ),
                    const SizedBox(width: 10),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Dynamic UPI Bharat QR', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 15)),
                        Text('0% Platform Commission', style: TextStyle(color: Color(0xFF10B981), fontSize: 11)),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(_isPaymentSettled),
                  icon: const Icon(Icons.close, color: Colors.white70),
                )
              ],
            ),
            const SizedBox(height: 16),

            // Material Addon Input
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: const Color(0xFF1E293B),
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Base Service Charge:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      Text('₹\${widget.baseLaborAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Row(
                    children: [
                      const Expanded(
                        child: Text('Extra Materials / Hardware:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      ),
                      SizedBox(
                        width: 90,
                        height: 36,
                        child: TextField(
                          controller: _materialsController,
                          keyboardType: TextInputType.number,
                          textAlign: TextAlign.right,
                          style: const TextStyle(color: Color(0xFFF59E0B), fontWeight: FontWeight.bold, fontSize: 13),
                          decoration: InputDecoration(
                            prefixText: '₹ ',
                            prefixStyle: const TextStyle(color: Color(0xFFF59E0B)),
                            contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                            filled: true,
                            fillColor: const Color(0xFF0F172A),
                            border: OutlineInputBorder(borderRadius: BorderRadius.circular(8)),
                          ),
                          onChanged: (val) {
                            setState(() {
                              _materialCost = double.tryParse(val) ?? 0.0;
                            });
                          },
                        ),
                      )
                    ],
                  ),
                  const Divider(color: Color(0xFF334155), height: 18),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total Amount Payable:', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 13)),
                      Text('₹\${_totalAmount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF10B981), fontSize: 16)),
                    ],
                  )
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Dynamic Bharat QR Code Container
            Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: BorderRadius.circular(20),
                boxShadow: const [BoxShadow(color: Colors.black38, blurRadius: 12)],
              ),
              child: Column(
                children: [
                  QrImageView(
                    data: _upiIntentString,
                    version: QrVersions.auto,
                    size: 180.0,
                    backgroundColor: Colors.white,
                    eyeStyle: const QrEyeStyle(eyeShape: QrEyeShape.square, color: Colors.black),
                    dataModuleStyle: const QrDataModuleStyle(dataModuleShape: QrDataModuleShape.square, color: Colors.black),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Scan with any UPI App • Settle to \${widget.workerUpiVpa}',
                    style: const TextStyle(color: Colors.black88, fontSize: 10, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),

            // Supported UPI Apps badges
            const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Text('Google Pay • PhonePe • Paytm • BHIM • CRED', style: TextStyle(fontSize: 10, color: Color(0xFF94A3B8))),
              ],
            ),
            const SizedBox(height: 14),

            // Action Buttons
            if (!_isPaymentSettled) ...[
              ElevatedButton.icon(
                onPressed: () {
                  setState(() {
                    _isPaymentSettled = true;
                    _settledTxnId = 'UPI_NPCI_\${DateTime.now().millisecondsSinceEpoch.toString().substring(6)}';
                  });
                  _playSimulatedSoundboxAlert();
                },
                icon: const Icon(Icons.volume_up, color: Colors.black),
                label: Text('Simulate UPI Payment Success (₹\${_totalAmount.toStringAsFixed(0)})', style: const TextStyle(color: Colors.black, fontWeight: FontWeight.bold, fontSize: 12)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  minimumSize: const Size.fromHeight(44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
              const SizedBox(height: 8),
              OutlinedButton.icon(
                onPressed: _launchUpiDirectIntent,
                icon: const Icon(Icons.open_in_new, size: 16, color: Colors.white70),
                label: const Text('Open in Installed UPI App', style: TextStyle(color: Colors.white70, fontSize: 11)),
                style: OutlinedButton.styleFrom(
                  minimumSize: const Size.fromHeight(38),
                  side: const BorderSide(color: Color(0xFF334155)),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
              ),
            ] else ...[
              Container(
                padding: const EdgeInsets.all(12),
                decoration: BoxDecoration(
                  color: const Color(0xFF10B981).withOpacity(0.15),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: const Color(0xFF10B981)),
                ),
                child: Column(
                  children: [
                    const Row(
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        Icon(Icons.check_circle, color: Color(0xFF10B981), size: 18),
                        SizedBox(width: 6),
                        Text('Direct Bank Settlement Received!', style: TextStyle(color: Color(0xFF10B981), fontWeight: FontWeight.bold, fontSize: 12)),
                      ],
                    ),
                    const SizedBox(height: 4),
                    Text('Txn Ref: \$_settledTxnId', style: const TextStyle(color: Colors.white70, fontSize: 10, fontFamily: 'monospace')),
                  ],
                ),
              ),
              const SizedBox(height: 10),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  minimumSize: const Size.fromHeight(42),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                ),
                child: const Text('Finish & Close Job', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              )
            ]
          ],
        ),
      ),
    );
  }
}`,

    'company_qr_payment_dialog.dart': `// lib/presentation/screens/worker/company_qr_payment_dialog.dart
// Production-Ready Official Smart India Company Bharat QR & Bank Settlement Dialog
import 'package:flutter/material.dart';
import 'package:qr_flutter/qr_flutter.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:flutter_tts/flutter_tts.dart';

class CompanyQrPaymentDialog extends StatefulWidget {
  final String workerPhone;
  final Function(double amount, String purpose) onPaymentSuccess;

  const CompanyQrPaymentDialog({
    super.key,
    required this.workerPhone,
    required this.onPaymentSuccess,
  });

  @override
  State<CompanyQrPaymentDialog> createState() => _CompanyQrPaymentDialogState();
}

class _CompanyQrPaymentDialogState extends State<CompanyQrPaymentDialog> {
  final FlutterTts _flutterTts = FlutterTts();
  static const String companyVpa = 'smartindia.official@icici';
  static const String companyName = 'Smart India Technologies Pvt Ltd';
  static const String companyGst = '07AAECS1492Q1ZV';

  String _purpose = 'WALLET_RECHARGE'; // WALLET_RECHARGE | KYC_BADGE | PRO_VIP
  double _amount = 200.0;
  final TextEditingController _utrController = TextEditingController();
  bool _isSettled = false;
  String _invoiceNo = '';

  String get _upiIntentString {
    final vpa = Uri.encodeComponent(companyVpa);
    final name = Uri.encodeComponent(companyName);
    final amt = _amount.toStringAsFixed(2);
    final note = Uri.encodeComponent('SmartIndia \$_purpose \${widget.workerPhone}');
    return 'upi://pay?pa=\$vpa&pn=\$name&am=\$amt&cu=INR&tn=\$note';
  }

  @override
  void initState() {
    super.initState();
    _initTts();
  }

  void _initTts() async {
    await _flutterTts.setLanguage("en-IN");
    await _flutterTts.setSpeechRate(0.5);
  }

  void _speakCompanyAlert() async {
    final amtStr = _amount.toStringAsFixed(0);
    await _flutterTts.speak("Payment of \$amtStr Rupees received in Smart India Company Corporate Account.");
  }

  void _confirmPayment() {
    setState(() {
      _isSettled = true;
      _invoiceNo = 'SI-INV-\${DateTime.now().millisecondsSinceEpoch.toString().substring(7)}';
    });
    _speakCompanyAlert();
    widget.onPaymentSuccess(_amount, _purpose);
  }

  @override
  Widget build(BuildContext context) {
    return Dialog(
      backgroundColor: const Color(0xFF0F172A),
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(28),
        side: const BorderSide(color: Color(0xFF6366F1), width: 1.5),
      ),
      child: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Header
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Row(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(8),
                      decoration: BoxDecoration(
                        color: const Color(0xFF6366F1).withOpacity(0.2),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.business, color: Color(0xFF818CF8), size: 22),
                    ),
                    const SizedBox(width: 10),
                    const Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text('Smart India Corporate Pay', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white, fontSize: 14)),
                        Text('Official Merchant Bharat QR', style: TextStyle(color: Color(0xFF818CF8), fontSize: 11)),
                      ],
                    ),
                  ],
                ),
                IconButton(
                  onPressed: () => Navigator.of(context).pop(_isSettled),
                  icon: const Icon(Icons.close, color: Colors.white70),
                )
              ],
            ),
            const SizedBox(height: 16),

            if (!_isSettled) ...[
              // Purpose Selector Chips
              Wrap(
                spacing: 8,
                children: [
                  ChoiceChip(
                    label: const Text('Wallet ₹200', style: TextStyle(fontSize: 11)),
                    selected: _purpose == 'WALLET_RECHARGE',
                    onSelected: (val) => setState(() { _purpose = 'WALLET_RECHARGE'; _amount = 200; }),
                    selectedColor: const Color(0xFF6366F1),
                  ),
                  ChoiceChip(
                    label: const Text('KYC Badge ₹299', style: TextStyle(fontSize: 11)),
                    selected: _purpose == 'KYC_BADGE',
                    onSelected: (val) => setState(() { _purpose = 'KYC_BADGE'; _amount = 299; }),
                    selectedColor: const Color(0xFF3B82F6),
                  ),
                  ChoiceChip(
                    label: const Text('Pro VIP ₹499', style: TextStyle(fontSize: 11)),
                    selected: _purpose == 'PRO_VIP',
                    onSelected: (val) => setState(() { _purpose = 'PRO_VIP'; _amount = 499; }),
                    selectedColor: const Color(0xFFF59E0B),
                  ),
                ],
              ),
              const SizedBox(height: 14),

              // Dynamic Bharat QR Code
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: const [BoxShadow(color: Colors.black45, blurRadius: 10)],
                ),
                child: Column(
                  children: [
                    QrImageView(
                      data: _upiIntentString,
                      version: QrVersions.auto,
                      size: 170.0,
                    ),
                    const SizedBox(height: 4),
                    const Text('Official VPA: smartindia.official@icici', style: TextStyle(color: Colors.black88, fontSize: 10, fontWeight: FontWeight.bold)),
                  ],
                ),
              ),
              const SizedBox(height: 14),

              Text('Payable Amount: ₹\${_amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.w900, color: Color(0xFF818CF8), fontSize: 18)),
              const SizedBox(height: 14),

              ElevatedButton.icon(
                onPressed: _confirmPayment,
                icon: const Icon(Icons.check_circle, color: Colors.white),
                label: Text('Verify & Credit Wallet (₹\${_amount.toStringAsFixed(0)})', style: const TextStyle(fontWeight: FontWeight.bold)),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF6366F1),
                  minimumSize: const Size.fromHeight(44),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                ),
              ),
            ] else ...[
              // Tax Invoice Receipt
              Container(
                padding: const EdgeInsets.all(14),
                decoration: BoxDecoration(
                  color: const Color(0xFF1E293B),
                  borderRadius: BorderRadius.circular(18),
                  border: Border.all(color: const Color(0xFF10B981)),
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text('GST Tax Invoice', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.white)),
                        Text(_invoiceNo, style: const TextStyle(color: Color(0xFF10B981), fontSize: 11, fontFamily: 'monospace')),
                      ],
                    ),
                    const Divider(color: Color(0xFF334155)),
                    Text('Beneficiary: \$companyName', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                    Text('GSTIN: \$companyGst', style: const TextStyle(color: Colors.white70, fontSize: 11)),
                    Text('Amount Credited: ₹\${_amount.toStringAsFixed(2)}', style: const TextStyle(fontWeight: FontWeight.bold, color: Color(0xFF10B981), fontSize: 13)),
                  ],
                ),
              ),
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () => Navigator.of(context).pop(true),
                style: ElevatedButton.styleFrom(
                  backgroundColor: const Color(0xFF10B981),
                  minimumSize: const Size.fromHeight(42),
                ),
                child: const Text('Close & Continue', style: TextStyle(color: Colors.black, fontWeight: FontWeight.bold)),
              )
            ]
          ],
        ),
      ),
    );
  }
}`
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-950 text-slate-100 overflow-y-auto p-4 md:p-6 space-y-6">
      {/* Studio Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-5 rounded-3xl border border-slate-800 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/30">
            <Cpu className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-white tracking-tight">
                Full-Stack Architecture & Flutter Codebase Studio
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 text-xs font-bold">
                Production-Ready
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Dual Mobile App (Flutter BLoC), Node.js & Express API Gateway, MongoDB Schemas, and ₹10 Micro-Fee Engine.
            </p>
          </div>
        </div>

        {/* Studio Sub-Navigation */}
        <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800 overflow-x-auto">
          {[
            { id: 'architecture', label: 'System Architecture', icon: Layers },
            { id: 'aws_server', label: 'AWS Cloud Server', icon: Cloud },
            { id: 'mongodb', label: 'MongoDB Schemas', icon: Database },
            { id: 'express_api', label: 'Node.js REST APIs', icon: Server },
            { id: 'flutter_tree', label: 'Flutter Structure', icon: FolderTree },
            { id: 'flutter_code', label: 'Flutter Dart Code', icon: FileCode },
            { id: 'api_tester', label: 'Live API Console', icon: Terminal },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundManager.playTap();
                  setActiveTab(tab.id as any);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: System Architecture Blueprint */}
      {activeTab === 'architecture' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Smartphone className="w-4 h-4" />
                <span>1. Dual Flutter Mobile App</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Single Flutter codebase with role-based routing (`WorkerBloc` / `CustomerBloc`), Google Maps live polyline rendering, and Aadhaar/PAN image compression pipeline.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
                <IndianRupee className="w-4 h-4" />
                <span>2. ₹10 Micro-Fee Engine</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Atomic MongoDB session transaction: When worker enters customer's 4-digit arrival OTP, ₹10 is deducted from wallet, creating a ledger entry and decrypting customer phone number.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Server className="w-4 h-4" />
                <span>3. Realtime Socket & GPS</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                AWS EC2 / App Runner WebSocket cluster emits live worker coordinates every 3 seconds. Amazon SNS (Simple Notification Service) dispatches instant push alerts and DND-compliant SMS OTPs.
              </p>
            </div>
          </div>

          {/* ASCII & Flow Diagram */}
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 font-mono text-xs text-slate-300 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-400 font-bold flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                SMART INDIA WORK APP: END-TO-END FLOW ARCHITECTURE
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-purple-300">Clean Architecture + Node.js Mongoose</span>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl overflow-x-auto text-[11px] leading-relaxed text-emerald-300">
{`
[CUSTOMER APP]                                       [WORKER APP]
      │                                                   │
  1. Post Job Req. (Photo + Budget)                       │
      │ ─── (POST /api/jobs) ───► [API GATEWAY]           │
                                       │                  │
                                 [Socket.io / FCM] ──────►│ 2. Radar Ping Alert (Sound)
                                                          │ 3. Accept Lead & Start Trip
                                                          │       │
                                                    [Live GPS Stream]
                                                          │
  4. Live Map (Worker En Route) ◄─────────────────────────┘
  5. Customer App Displays: "Arrival OTP: 8492"
      │
  6. Worker Arrives at Doorstep ────────► Customer Shares "8492"
                                              │
                                          7. Worker Inputs "8492"
                                              │
                                  [POST /api/bookings/verify-otp]
                                              │
                                  ┌───────────┴───────────┐
                                  ▼                       ▼
                         [Deduct ₹10 Wallet]    [Unlock Customer Phone]
                                  │                       │
  8. Job In Progress ◄────────────┴───────────────────────┘
      │
  9. Work Completed ───► Cash / Direct UPI Settled ───► 10. Rate & Review (5★)
`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab: AWS Cloud Server & Production Stack */}
      {activeTab === 'aws_server' && (
        <div className="space-y-6">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-900 to-orange-950/30 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 text-xs font-black uppercase tracking-wider border border-amber-500/30">
                  AWS Cloud Architecture
                </span>
                <span className="text-xs text-slate-400">Asia Pacific (Mumbai, India) • ap-south-1</span>
              </div>
              <h3 className="text-base font-black text-white mt-1">
                Amazon Web Services (AWS) Production Backend Stack
              </h3>
              <p className="text-xs text-slate-300 mt-0.5">
                Replaces Google Cloud with high-performance AWS EC2 / App Runner Node.js cluster, AWS S3 KYC buckets, DynamoDB atomic ledgers, and AWS SNS SMS OTP routing.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-mono font-bold text-emerald-400">AWS Latency: 14ms</span>
            </div>
          </div>

          {/* AWS Services Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] text-amber-400 font-black uppercase tracking-wider">Compute</span>
              <h4 className="text-xs font-bold text-white">AWS App Runner / EC2</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Node.js Express REST API & Socket.io server running on Graviton3 ARM with automatic scaling (1-50 instances).
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] text-blue-400 font-black uppercase tracking-wider">Database</span>
              <h4 className="text-xs font-bold text-white">AWS DocumentDB / DynamoDB</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Fully managed MongoDB-compatible database for geospatial queries (2dsphere) and ₹10 micro-fee atomic deductions.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] text-emerald-400 font-black uppercase tracking-wider">Media Storage</span>
              <h4 className="text-xs font-bold text-white">AWS S3 + CloudFront</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Encrypted bucket (`smart-india-work-assets-mumbai`) with pre-signed upload URLs for Aadhaar, PAN, and job photos.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <span className="text-[10px] text-purple-400 font-black uppercase tracking-wider">SMS & Alerts</span>
              <h4 className="text-xs font-bold text-white">AWS SNS + SQS</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Transactional SMS OTP engine compliant with TRAI/DND regulations across Airtel, Jio, and Vi networks.
              </p>
            </div>
          </div>

          {/* AWS Architecture Diagram */}
          <div className="bg-slate-900 rounded-3xl p-5 border border-slate-800 font-mono text-xs text-slate-300 space-y-3">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-slate-300 font-bold flex items-center gap-2">
                <Cloud className="w-4 h-4 text-amber-400" />
                AWS ap-south-1 (MUMBAI) CLOUD TOPOLOGY
              </span>
              <span className="text-[10px] bg-slate-800 px-2 py-1 rounded text-amber-300">AWS Virtual Private Cloud (VPC)</span>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl overflow-x-auto text-[11px] leading-relaxed text-amber-300">
{`
[USER MOBILE APPS (FLUTTER)] 
       │
       ▼
 [AWS Route 53 (DNS: api.smartindiawork.in)]
       │
       ▼
 [AWS CloudFront Edge (SSL TLS 1.3 / WAF Shield)]
       │
       ▼
 [AWS Application Load Balancer (ALB)]
       │
 ┌─────┴───────────────────────────────────────────────────────┐
 │ AWS VPC (ap-south-1 Mumbai)                                 │
 │                                                             │
 │   ┌───────────────────────────────────────────────────┐     │
 │   │ AWS EC2 / App Runner (Node.js + Socket.io Server) │     │
 │   │   • Express REST Controller                       │     │
 │   │   • Arrival OTP Verification Handler (₹10 Fee)    │     │
 │   │   • Live GPS Tracking Coordinates Streamer        │     │
 │   └─────────────────────────┬─────────────────────────┘     │
 │                             │                               │
 │        ┌────────────────────┼────────────────────┐          │
 │        ▼                    ▼                    ▼          │
 │   [AWS DocumentDB]    [AWS S3 Bucket]     [AWS SNS SMS]     │
 │   (MongoDB Engine)    (KYC & Photos)      (Transactional)   │
 └─────────────────────────────────────────────────────────────┘
`}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 2: MongoDB Schemas */}
      {activeTab === 'mongodb' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">MongoDB Mongoose Schemas (6 Core Collections)</h3>
              <p className="text-xs text-slate-400">Includes 2dsphere geospatial indexing, atomic wallet transactions, and KYC validations.</p>
            </div>
            <button
              onClick={() => copyToClipboard(mongoSchemasCode, 'mongo')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              {copiedCodeKey === 'mongo' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCodeKey === 'mongo' ? 'Copied' : 'Copy All Schemas'}</span>
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800">
            <pre className="p-4 bg-slate-950 rounded-2xl overflow-x-auto text-[11px] leading-relaxed font-mono text-cyan-300">
              {mongoSchemasCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 3: Node.js Express REST API */}
      {activeTab === 'express_api' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Node.js / Express Route Handlers & Micro-Fee Ledger</h3>
              <p className="text-xs text-slate-400">Production Express controllers with JWT authentication, OTP verification, and atomic MongoDB sessions.</p>
            </div>
            <button
              onClick={() => copyToClipboard(expressApiCode, 'express')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              {copiedCodeKey === 'express' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCodeKey === 'express' ? 'Copied' : 'Copy API Code'}</span>
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800">
            <pre className="p-4 bg-slate-950 rounded-2xl overflow-x-auto text-[11px] leading-relaxed font-mono text-emerald-300">
              {expressApiCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 4: Flutter Folder Tree */}
      {activeTab === 'flutter_tree' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-white">Flutter Clean Architecture Folder Structure</h3>
              <p className="text-xs text-slate-400">Strict separation of Data, Domain, Presentation, and BLoC state management layers.</p>
            </div>
            <button
              onClick={() => copyToClipboard(flutterTreeCode, 'tree')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 transition-colors"
            >
              {copiedCodeKey === 'tree' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copiedCodeKey === 'tree' ? 'Copied' : 'Copy Tree'}</span>
            </button>
          </div>

          <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800">
            <pre className="p-4 bg-slate-950 rounded-2xl overflow-x-auto text-[11px] leading-relaxed font-mono text-amber-300">
              {flutterTreeCode}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 5: Flutter Dart Code */}
      {activeTab === 'flutter_code' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-white">Flutter Production Dart Code</h3>
              <p className="text-xs text-slate-400">Select any file to inspect full production-ready Flutter widget code.</p>
            </div>

            {/* File Selector Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto bg-slate-900 p-1 rounded-xl border border-slate-800">
              {Object.keys(flutterCodeFiles).map((fileName) => (
                <button
                  key={fileName}
                  onClick={() => {
                    soundManager.playTap();
                    setSelectedFlutterFile(fileName);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium transition-all ${
                    selectedFlutterFile === fileName
                      ? 'bg-purple-600 text-white'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {fileName}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 relative">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <span className="font-mono text-xs text-purple-300 font-bold">{selectedFlutterFile}</span>
              <button
                onClick={() => copyToClipboard(flutterCodeFiles[selectedFlutterFile], selectedFlutterFile)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 text-xs hover:text-white"
              >
                {copiedCodeKey === selectedFlutterFile ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCodeKey === selectedFlutterFile ? 'Copied' : 'Copy File'}</span>
              </button>
            </div>

            <pre className="p-4 bg-slate-950 rounded-2xl overflow-x-auto text-[11px] leading-relaxed font-mono text-slate-200">
              {flutterCodeFiles[selectedFlutterFile]}
            </pre>
          </div>
        </div>
      )}

      {/* Tab 6: Live API Console */}
      {activeTab === 'api_tester' && (
        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-bold text-white">Interactive REST API Tester</h3>
            <p className="text-xs text-slate-400">Test backend endpoints with live simulated responses for OTP verification, worker dispatch, and wallet deductions.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Request Panel */}
            <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 space-y-3 text-xs">
              <div className="flex items-center gap-2">
                <select
                  value={apiMethod}
                  onChange={(e) => setApiMethod(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 rounded-xl px-2.5 py-2 text-emerald-400 font-bold font-mono"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                </select>

                <select
                  value={apiEndpoint}
                  onChange={(e) => {
                    const ep = e.target.value;
                    setApiEndpoint(ep);
                    if (ep === '/api/workers/nearby') {
                      setApiMethod('GET');
                    } else if (ep === '/api/payments/generate-dynamic-upi-qr') {
                      setApiMethod('POST');
                      setApiRequestBody(JSON.stringify({
                        bookingId: "BK_9081",
                        workerId: "w1",
                        baseLaborAmount: 950,
                        materialsAmount: 250,
                        workerUpiVpa: "rameshwar.kumar@okicici"
                      }, null, 2));
                    } else if (ep === '/api/company/upi-qr-payment') {
                      setApiMethod('POST');
                      setApiRequestBody(JSON.stringify({
                        merchantVpa: "smartindia.official@icici",
                        corporateEntity: "Smart India Technologies Pvt Ltd",
                        workerPhone: "+919876543210",
                        purpose: "WORKER_WALLET_LEAD_TOPUP",
                        amount: 500,
                        utrReference: "423891048291"
                      }, null, 2));
                    } else {
                      setApiMethod('POST');
                    }
                  }}
                  className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-white font-mono text-xs"
                >
                  <option value="/api/company/upi-qr-payment">/api/company/upi-qr-payment (Company QR Pay)</option>
                  <option value="/api/payments/generate-dynamic-upi-qr">/api/payments/generate-dynamic-upi-qr</option>
                  <option value="/api/bookings/verify-arrival-otp">/api/bookings/verify-arrival-otp</option>
                  <option value="/api/workers/nearby">/api/workers/nearby?lat=28.62&lng=77.36&category=mistry</option>
                  <option value="/api/wallet/recharge">/api/wallet/recharge</option>
                </select>
              </div>

              {apiMethod === 'POST' && (
                <div>
                  <label className="block text-slate-400 font-mono mb-1">Request Body (JSON)</label>
                  <textarea
                    rows={8}
                    value={apiRequestBody}
                    onChange={(e) => setApiRequestBody(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3 font-mono text-amber-300 text-xs focus:outline-none focus:border-purple-500 resize-none"
                  />
                </div>
              )}

              <button
                onClick={handleTestApi}
                disabled={isApiLoading}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>{isApiLoading ? 'Executing API Request...' : 'Send API Request'}</span>
              </button>
            </div>

            {/* Response Panel */}
            <div className="bg-slate-900 rounded-3xl p-4 border border-slate-800 flex flex-col text-xs">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
                <span className="font-mono text-slate-400 font-bold">API Response Output</span>
                {apiResponse && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 text-[10px] font-bold">
                    HTTP 200 OK
                  </span>
                )}
              </div>

              <div className="flex-1 bg-slate-950 rounded-2xl p-3 overflow-y-auto max-h-[320px]">
                {apiResponse ? (
                  <pre className="font-mono text-[11px] text-emerald-300 whitespace-pre-wrap">
                    {apiResponse}
                  </pre>
                ) : (
                  <div className="h-full flex items-center justify-center text-slate-600 font-mono text-xs">
                    Click "Send API Request" to view live server JSON payload
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Static schema & architecture code assets
const mongoSchemasCode = `// models/schemas.js
const mongoose = require('mongoose');

// 1. User & Authentication Schema (Common for Customer & Worker)
const UserSchema = new mongoose.Schema({
  phone: { type: String, required: true, unique: true, index: true },
  role: { type: String, enum: ['customer', 'worker', 'admin'], required: true },
  fullName: { type: String, required: true },
  avatarUrl: { type: String },
  language: { type: String, enum: ['en', 'hi', 'bn', 'mr', 'te', 'ta'], default: 'hi' },
  isPhoneVerified: { type: Boolean, default: false },
  fcmToken: { type: String },
  createdAt: { type: Date, default: Date.now },
});

// 2. Worker Partner Profile Schema
const WorkerProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  category: { 
    type: String, 
    enum: [
      'mistry', 'labor', 'sariya_binding', 'shuttering', 'welding', 'plumber', 
      'electrician', 'pop', 'tiles_marble', 'painter', 'borewell', 'carpenter',
      'tv_repair', 'ac_repair', 'ro_purifier', 'fan_repair', 'fridge_repair', 
      'washing_machine', 'geyser_repair', 'chimney_repair', 'dth_installation', 
      'catering', 'event_decoration', 'dj_sound', 'photographer', 'event_vehicles'
    ],
    required: true,
    index: true
  },
  subSkills: [{ type: String }],
  experienceYears: { type: Number, default: 1 },
  hourlyRate: { type: Number, default: 150 },
  dailyRate: { type: Number, default: 850 },
  walletBalance: { type: Number, default: 100, min: 0 }, // ₹100 welcome bonus for verified leads
  isOnline: { type: Boolean, default: true, index: true },
  currentLocation: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [77.3649, 28.6280] } // [longitude, latitude]
  },
  kyc: {
    aadharNumber: { type: String },
    aadharCardFrontUrl: { type: String },
    aadharCardBackUrl: { type: String },
    panNumber: { type: String },
    isAadhaarVerified: { type: Boolean, default: false },
    isPanVerified: { type: Boolean, default: false },
    verifiedAt: { type: Date }
  },
  portfolio: [{
    title: { type: String, required: true },
    tag: { type: String },
    imageUrl: { type: String, required: true },
    description: { type: String },
    createdAt: { type: Date, default: Date.now }
  }],
  rating: { type: Number, default: 5.0, min: 1, max: 5 },
  reviewsCount: { type: Number, default: 0 },
  completedJobsCount: { type: Number, default: 0 }
});
WorkerProfileSchema.index({ currentLocation: '2dsphere' });

// 3. Job Broadcast Requirement Schema
const JobPostSchema = new mongoose.Schema({
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: { type: String, required: true, index: true },
  subCategory: { type: String },
  title: { type: String, required: true },
  description: { type: String, required: true },
  budget: { type: Number, required: true },
  urgency: { type: String, enum: ['urgent', 'today', 'flexible'], default: 'urgent' },
  photos: [{ type: String }],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true },
    address: { type: String, required: true },
    locality: { type: String, required: true }
  },
  status: { 
    type: String, 
    enum: ['open', 'assigned', 'in_progress', 'completed', 'cancelled'], 
    default: 'open',
    index: true 
  },
  assignedWorkerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile' },
  createdAt: { type: Date, default: Date.now }
});
JobPostSchema.index({ location: '2dsphere' });

// 4. Booking & Doorstep OTP Verification Schema
const BookingSchema = new mongoose.Schema({
  jobId: { type: mongoose.Schema.Types.ObjectId, ref: 'JobPost' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true },
  arrivalOtp: { type: String, required: true, length: 4 }, // Generated 4-digit code e.g. 8492
  isOtpVerified: { type: Boolean, default: false },
  microFeeDeducted: { type: Number, default: 10 }, // ₹10 micro lead fee
  status: {
    type: String,
    enum: ['requested', 'accepted', 'worker_en_route', 'arrived_at_door', 'otp_verified', 'in_progress', 'completed', 'cancelled'],
    default: 'accepted',
    index: true
  },
  agreedAmount: { type: Number, required: true },
  otpVerifiedAt: { type: Date },
  completedAt: { type: Date },
  rating: { type: Number, min: 1, max: 5 },
  reviewText: { type: String }
});

// 5. Worker Wallet & Micro-Fee Ledger Schema
const WalletTransactionSchema = new mongoose.Schema({
  workerId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkerProfile', required: true, index: true },
  amount: { type: Number, required: true },
  type: { type: String, enum: ['credit', 'debit'], required: true },
  reason: { type: String, enum: ['recharge', 'lead_fee', 'incentive', 'refund'], required: true },
  description: { type: String, required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  referenceId: { type: String, required: true, unique: true },
  balanceAfter: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = {
  User: mongoose.model('User', UserSchema),
  WorkerProfile: mongoose.model('WorkerProfile', WorkerProfileSchema),
  JobPost: mongoose.model('JobPost', JobPostSchema),
  Booking: mongoose.model('Booking', BookingSchema),
  WalletTransaction: mongoose.model('WalletTransaction', WalletTransactionSchema),
};`;

const expressApiCode = `// routes/bookingRoutes.js & walletController.js
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { Booking, WorkerProfile, WalletTransaction, User } = require('../models/schemas');
const { authMiddleware } = require('../middlewares/auth');

// @route   POST /api/bookings/verify-arrival-otp
// @desc    Worker enters customer's 4-digit OTP at doorstep -> Deducts ₹10 from wallet -> Unlocks contact
// @access  Private (Worker)
router.post('/verify-arrival-otp', authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { bookingId, enteredOtp, microFee = 10 } = req.body;
    const workerUserId = req.user.id;

    // 1. Fetch worker profile
    const worker = await WorkerProfile.findOne({ userId: workerUserId }).session(session);
    if (!worker) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Worker profile not found.' });
    }

    // 2. Check Wallet Balance
    if (worker.walletBalance < microFee) {
      await session.abortTransaction();
      return res.status(400).json({ 
        error: \`Insufficient wallet balance (₹\${worker.walletBalance}). Please recharge ₹\${microFee} to verify lead.\` 
      });
    }

    // 3. Find Booking and validate OTP
    const booking = await Booking.findById(bookingId).populate('customerId').session(session);
    if (!booking) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Booking record not found.' });
    }

    if (booking.arrivalOtp !== enteredOtp) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Incorrect OTP. Ask customer for 4-digit code.' });
    }

    if (booking.isOtpVerified) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'OTP has already been verified for this booking.' });
    }

    // 4. Deduct ₹10 micro-fee atomically from Worker Wallet
    worker.walletBalance -= microFee;
    await worker.save({ session });

    // 5. Create Wallet Passbook Ledger Entry
    const walletTx = new WalletTransaction({
      workerId: worker._id,
      amount: microFee,
      type: 'debit',
      reason: 'lead_fee',
      description: \`Verified Lead Connection (OTP #\${enteredOtp} - \${booking.customerId.fullName})\`,
      bookingId: booking._id,
      referenceId: \`LEAD_FEE/\${booking._id}/\${Date.now()}\`,
      balanceAfter: worker.walletBalance
    });
    await walletTx.save({ session });

    // 6. Update Booking status to 'otp_verified'
    booking.isOtpVerified = true;
    booking.microFeeDeducted = microFee;
    booking.status = 'in_progress';
    booking.otpVerifiedAt = new Date();
    await booking.save({ session });

    await session.commitTransaction();
    session.endSession();

    // 7. Return unmasked customer contact & doorstep address
    return res.status(200).json({
      success: true,
      message: 'OTP verified successfully. ₹10 lead micro-fee deducted.',
      data: {
        bookingId: booking._id,
        status: 'in_progress',
        customer: {
          name: booking.customerId.fullName,
          phone: booking.customerId.phone, // Unmasked full phone number
          avatar: booking.customerId.avatarUrl,
        },
        walletBalance: worker.walletBalance
      }
    });

  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    return res.status(500).json({ error: 'Internal Server Error', details: err.message });
  }
});

// @route   GET /api/workers/nearby
// @desc    Find online workers within radius using MongoDB $nearSphere
router.get('/nearby', async (req, res) => {
  try {
    const { lng, lat, category, maxDistanceKm = 10 } = req.query;
    const query = {
      isOnline: true,
      currentLocation: {
        $nearSphere: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: maxDistanceKm * 1000 // meters
        }
      }
    };
    if (category && category !== 'all') {
      query.category = category;
    }
    const workers = await WorkerProfile.find(query).populate('userId', 'fullName phone avatarUrl');
    res.json({ success: true, count: workers.length, data: workers });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;`;

const flutterTreeCode = `smart_india_work_app/
├── android/
├── ios/
├── assets/
│   ├── icons/
│   │   ├── mistry.png
│   │   ├── electrician.png
│   │   ├── plumber.png
│   │   └── ac_repair.png
│   └── sounds/
│       ├── radar_lead_ping.mp3
│       └── coin_deduction.mp3
├── lib/
│   ├── main.dart
│   ├── core/
│   │   ├── constants/
│   │   │   ├── app_colors.dart
│   │   │   ├── api_endpoints.dart
│   │   │   └── category_constants.dart
│   │   ├── network/
│   │   │   ├── api_client.dart
│   │   │   └── socket_service.dart
│   │   ├── utils/
│   │   │   ├── location_helper.dart
│   │   │   └── sound_helper.dart
│   │   └── localization/
│   │       ├── app_en.arb
│   │       └── app_hi.arb
│   ├── data/
│   │   ├── models/
│   │   │   ├── user_model.dart
│   │   │   ├── worker_profile_model.dart
│   │   │   ├── job_post_model.dart
│   │   │   ├── booking_model.dart
│   │   │   └── wallet_tx_model.dart
│   │   └── repositories/
│   │       ├── auth_repository.dart
│   │       ├── worker_repository.dart
│   │       ├── job_repository.dart
│   │       └── wallet_repository.dart
│   ├── blocs/
│   │   ├── auth/
│   │   │   ├── auth_bloc.dart
│   │   │   ├── auth_event.dart
│   │   │   └── auth_state.dart
│   │   ├── worker/
│   │   │   ├── worker_bloc.dart
│   │   │   └── worker_state.dart
│   │   ├── booking/
│   │   │   ├── booking_bloc.dart
│   │   │   └── booking_event.dart
│   │   └── wallet/
│   │       ├── wallet_bloc.dart
│   │       └── wallet_state.dart
│   ├── presentation/
│   │   ├── screens/
│   │   │   ├── splash_screen.dart
│   │   │   ├── role_selection_screen.dart
│   │   │   ├── customer/
│   │   │   │   ├── customer_home_screen.dart
│   │   │   │   ├── worker_directory_screen.dart
│   │   │   │   ├── post_job_screen.dart
│   │   │   │   ├── live_tracking_screen.dart
│   │   │   │   ├── in_app_chat_call_screen.dart
│   │   │   │   └── rating_review_dialog.dart
│   │   │   └── worker/
│   │   │       ├── worker_home_screen.dart
│   │   │       ├── active_trip_screen.dart
│   │   │       ├── otp_verification_dialog.dart   <-- [₹10 Micro-fee & Unmasking]
│   │   │       ├── wallet_passbook_screen.dart
│   │   │       ├── kyc_verification_screen.dart
│   │   │       └── portfolio_manager_screen.dart
│   │   └── widgets/
│   │       ├── category_card.dart
│   │       ├── verified_badge.dart
│   │       ├── live_radar_widget.dart
│   │       └── custom_pin_input.dart
└── pubspec.yaml`;

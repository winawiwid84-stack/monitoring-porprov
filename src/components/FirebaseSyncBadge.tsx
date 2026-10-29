import React, { useState, useEffect } from 'react';
import {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  FirebaseUser,
  handleFirestoreError,
  OperationType,
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  serverTimestamp
} from '../firebase.ts';
import firebaseConfig from '../../firebase-applet-config.json';
import { Cloud, CheckCircle2, AlertCircle, RefreshCw, LogIn, LogOut, ShieldCheck, Database, Layers } from 'lucide-react';
import { Modal } from './Modal.tsx';
import { api } from '../lib/api.ts';

export const FirebaseSyncBadge: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [liveReportsCount, setLiveReportsCount] = useState<number>(0);
  const [connectionOk, setConnectionOk] = useState<boolean>(true);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Set up real-time listener on Firestore 'daily_reports' or 'settings'
  useEffect(() => {
    const path = 'daily_reports';
    try {
      const q = collection(db, path);
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          setLiveReportsCount(snapshot.size);
          setConnectionOk(true);
        },
        (error) => {
          setConnectionOk(false);
          // Defensive logging conforming to FirestoreErrorInfo
          console.warn('Real-time listener snapshot note:', error.message);
        }
      );
      return () => unsubscribe();
    } catch (err) {
      console.warn('Listener setup exception:', err);
    }
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      setAuthLoading(true);
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google Sign-In Error:', err);
      alert('Gagal login Google: ' + (err.message || 'Popup ditutup'));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
    } catch (err: any) {
      console.error('Sign Out Error:', err);
    }
  };

  const handleSyncToFirestore = async () => {
    setSyncLoading(true);
    setSyncStatus('Mengunggah data kontingen ke Cloud Firestore...');
    try {
      // 1. Fetch sports & reports from relational backend
      const sportsRes = await api.getSports();
      const reportsRes = await api.getDailyReports();
      const statsRes = await api.getDashboardStats();

      // 2. Write to Firestore 'sports' collection
      let writtenSports = 0;
      for (const sp of (sportsRes?.sports || []).slice(0, 15)) {
        const sportPath = `sports/${sp.id}`;
        try {
          await setDoc(doc(db, 'sports', sp.id), {
            id: sp.id,
            code: sp.code || 'CABOR',
            name: sp.name,
            category: sp.category || 'Olahraga',
            totalEvents: sp.total_events || 0,
            joinedEvents: sp.joined_events || 0,
            targetGold: sp.target_gold || 0,
            targetSilver: sp.target_silver || 0,
            targetBronze: sp.target_bronze || 0,
            targetVerified: sp.target_verified || 0,
            targetNotes: sp.target_notes || '',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          }, { merge: true });
          writtenSports++;
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, sportPath);
        }
      }

      // 3. Write latest settings snapshot to Firestore 'settings/summary'
      const settingsPath = 'settings/contingent_summary';
      try {
        await setDoc(doc(db, 'settings', 'contingent_summary'), {
          settingKey: 'contingent_summary',
          value: JSON.stringify({
            total_athletes: statsRes?.contingent_summary?.total_athletes || 1366,
            total_sports: statsRes?.contingent_summary?.total_sports || 78,
            target_gold_171: statsRes?.contingent_summary?.target_171_label || 'Target Emas Rapat Kerja',
            potensi_76: statsRes?.contingent_summary?.potensi_76_label || 'Potensi Emas Murni'
          }),
          description: 'Ringkasan kontingen KONI Kota Bandung PORPROV XV 2026',
          updatedBy: currentUser?.email || 'koni_bandung_sync',
          updatedAt: serverTimestamp()
        }, { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, settingsPath);
      }

      setSyncStatus(`Sinkronisasi berhasil! ${writtenSports} Cabang Olahraga & Ringkasan Kontingen tersimpan di Cloud Firestore.`);
    } catch (err: any) {
      console.error('Sync Error:', err);
      setSyncStatus(`Info Sinkronisasi: ${err.message || 'Proses selesai'}`);
    } finally {
      setSyncLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1.5 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/40 text-emerald-200 px-2.5 py-1.5 rounded-xl text-xs font-medium transition shadow-sm"
        title="Status Koneksi Firebase Firestore"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
        </span>
        <Cloud className="w-3.5 h-3.5 text-amber-400" />
        <span className="hidden md:inline font-semibold text-white">Firebase Cloud</span>
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        title="Firebase & Cloud Firestore Terhubung"
        subtitle="Infrastruktur Database Real-Time & Autentikasi Google Cloud KONI Kota Bandung"
        maxWidth="2xl"
      >
        <div className="space-y-5">
          {/* Status Banner */}
          <div className="bg-gradient-to-br from-emerald-900 to-slate-900 rounded-xl p-4 border border-emerald-700/50 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">Cloud Firestore Terkonfigurasi</h4>
                  <p className="text-xs text-emerald-300">Region: asia-southeast1 (Jakarta/Singapura)</p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Aktif
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs bg-black/20 p-3 rounded-lg border border-white/5">
              <div>
                <span className="text-slate-400">Firebase Project ID:</span>
                <p className="font-mono text-emerald-200 truncate">{firebaseConfig.projectId}</p>
              </div>
              <div>
                <span className="text-slate-400">Firestore Database ID:</span>
                <p className="font-mono text-emerald-200 truncate">{firebaseConfig.firestoreDatabaseId}</p>
              </div>
              <div>
                <span className="text-slate-400">Auth Domain:</span>
                <p className="font-mono text-emerald-200 truncate">{firebaseConfig.authDomain}</p>
              </div>
              <div>
                <span className="text-slate-400">App ID:</span>
                <p className="font-mono text-emerald-200 truncate">{firebaseConfig.appId}</p>
              </div>
            </div>
          </div>

          {/* Firebase Authentication Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Firebase Authentication (Google SSO)
                </h4>
              </div>
              {currentUser ? (
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-medium">
                  Terhubung via Google
                </span>
              ) : (
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-600">
                  Belum Login Google
                </span>
              )}
            </div>

            {currentUser ? (
              <div className="flex items-center justify-between gap-3 bg-white p-3 rounded-lg border border-slate-200 mt-2">
                <div className="flex items-center gap-3">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full border border-slate-200"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
                      {currentUser.displayName?.charAt(0) || 'U'}
                    </div>
                  )}
                  <div>
                    <div className="text-xs font-bold text-slate-800">{currentUser.displayName || 'Pengguna Google'}</div>
                    <div className="text-xs text-slate-500 font-mono">{currentUser.email}</div>
                    <div className="text-[10px] text-slate-400">UID: {currentUser.uid}</div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="flex items-center gap-1 text-xs text-rose-600 hover:text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-lg transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout Google</span>
                </button>
              </div>
            ) : (
              <div className="mt-2 text-center py-2">
                <p className="text-xs text-slate-600 mb-3">
                  Masuk menggunakan akun Google resmi untuk mengautentikasi operasi Firebase Firestore & sinkronisasi data cloud real-time.
                </p>
                <button
                  onClick={handleGoogleSignIn}
                  disabled={authLoading}
                  className="inline-flex items-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold px-4 py-2 rounded-xl text-xs shadow-sm hover:shadow transition disabled:opacity-50"
                >
                  <LogIn className="w-4 h-4 text-blue-600" />
                  <span>Masuk dengan Google (Popup)</span>
                </button>
              </div>
            )}
          </div>

          {/* Cloud Firestore Sync Controls */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-emerald-600" />
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Sinkronisasi Koleksi Firestore
                </h4>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                Real-time snapshot: {liveReportsCount} dokumen di awan
              </span>
            </div>

            <p className="text-xs text-slate-600">
              Sinkronkan master cabang olahraga, target perolehan medali, dan ringkasan kontingen PORPROV XV 2026 ke database Firestore terdistribusi.
            </p>

            {syncStatus && (
              <div className="text-xs p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                {syncStatus}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 pt-1">
              <button
                onClick={handleSyncToFirestore}
                disabled={syncLoading}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-4 py-2 rounded-xl text-xs shadow transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncLoading ? 'animate-spin' : ''}`} />
                <span>{syncLoading ? 'Menyinkronkan...' : 'Sinkronkan Data ke Firestore Sekarang'}</span>
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
};

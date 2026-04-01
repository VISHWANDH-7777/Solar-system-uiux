import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Orbit, 
  AlertTriangle, 
  ChevronRight,
  Search,
  Trash2,
  X
} from 'lucide-react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  deleteDoc,
  doc,
  getDocs
} from 'firebase/firestore';
import { User } from 'firebase/auth';
import { db } from '../firebase';
import { Document } from '../types';

export const DocumentVault = ({ onSelect, user, handleFirestoreError, OperationType }: { 
  onSelect: (id: string) => void, 
  user: User,
  handleFirestoreError: (error: any, op: any, path: string) => void,
  OperationType: any
}) => {
  const [docs, setDocs] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'documents'), 
      where('userId', '==', user.uid),
      orderBy('created_at', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const documents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Document[];
      setDocs(documents);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'documents');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user.uid]);

  const handleDelete = async (docId: string) => {
    setDeletingId(docId);
    try {
      // Delete clauses first
      const clausesRef = collection(db, 'documents', docId, 'clauses');
      const clausesSnap = await getDocs(clausesRef);
      const deletePromises = clausesSnap.docs.map(clauseDoc => deleteDoc(clauseDoc.ref));
      await Promise.all(deletePromises);

      // Delete main document
      await deleteDoc(doc(db, 'documents', docId));
      setConfirmDeleteId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `documents/${docId}`);
    } finally {
      setDeletingId(null);
    }
  };

  const filteredDocs = docs.filter(doc => 
    doc.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    doc.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) return <div className="p-10 text-primary flex items-center gap-3"><Orbit className="animate-spin" /> Scanning Vault...</div>;

  return (
    <div className="p-10 space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-black text-slate-100">Document Vault</h1>
        
        <div className="relative w-full md:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/50 border border-primary/20 rounded-xl py-2 pl-10 pr-4 text-slate-100 focus:outline-none focus:border-primary/50 transition-all"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-primary"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {filteredDocs.length === 0 ? (
        <div className="glass p-12 rounded-3xl text-center border-dashed border-primary/20">
          <FileText size={48} className="text-primary/20 mx-auto mb-4" />
          <p className="text-slate-400">
            {searchQuery ? `No documents matching "${searchQuery}"` : 'Your vault is empty. Process a document to see it here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredDocs.map(doc => (
            <div 
              key={doc.id} 
              onClick={() => onSelect(doc.id)}
              className="glass p-6 rounded-2xl cursor-pointer hover:border-primary/40 transition-all group relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="size-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-background-dark transition-colors">
                  <FileText size={24} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold text-primary/60 uppercase tracking-widest">{doc.category}</span>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setConfirmDeleteId(doc.id);
                    }}
                    disabled={deletingId === doc.id}
                    className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                  >
                    {deletingId === doc.id ? <Orbit className="animate-spin" size={16} /> : <Trash2 size={16} />}
                  </button>
                </div>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{doc.title}</h3>
              <p className="text-xs text-slate-400 line-clamp-2 mb-4">{doc.purpose}</p>
              <div className="flex justify-between items-center pt-4 border-t border-primary/10">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={14} className="text-primary" />
                  <span className="text-xs font-bold text-slate-100">{doc.overall_risk_score} Risk</span>
                </div>
                <ChevronRight size={16} className="text-primary/40" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Confirmation Modal */}
      {confirmDeleteId && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-background-dark/80 backdrop-blur-sm">
          <div className="glass p-8 rounded-[32px] border border-red-500/20 max-w-sm w-full text-center space-y-6 animate-in zoom-in duration-300">
            <div className="size-16 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 mx-auto">
              <Trash2 size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100 mb-2">Delete Document?</h3>
              <p className="text-sm text-slate-400">This will permanently remove the document and all associated analysis data. This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 py-3 rounded-xl bg-slate-800 text-slate-100 font-bold hover:bg-slate-700 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleDelete(confirmDeleteId)}
                disabled={deletingId === confirmDeleteId}
                className="flex-1 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all flex items-center justify-center gap-2"
              >
                {deletingId === confirmDeleteId ? <Orbit className="animate-spin" size={18} /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

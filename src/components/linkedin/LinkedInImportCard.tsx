import { useState, useRef } from 'react';
import { UploadCloud, FileText, ClipboardList, Loader2, ShieldAlert, AlertCircle } from 'lucide-react';
import { useAuth } from '@/lib/auth';

export function LinkedInImportCard({ onUploadStart }: { onUploadStart: (importId: string) => void }) {
  const [tab, setTab] = useState<'upload' | 'paste'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { token } = useAuth();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    setError(null);
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file exported from LinkedIn.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB.');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        
        const res = await fetch('/api/linkedin/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ fileBase64: base64, fileName: file.name, source: 'pdf' })
        });
        
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        onUploadStart(data.importId);
      };
      reader.readAsDataURL(file);
    } catch (e: any) {
      setError(e.message || 'An error occurred during upload.');
      setUploading(false);
    }
  };

  const handlePasteSubmit = async () => {
    if (!pasteText.trim()) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch('/api/linkedin/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ fileBase64: pasteText, fileName: 'pasted_profile.txt', source: 'paste' })
      });
      
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      onUploadStart(data.importId);
    } catch (e: any) {
      setError(e.message || 'An error occurred during upload.');
      setUploading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 animate-in fade-in duration-500">
      {/* Left Column: Instructions */}
      <div className="space-y-8">
        <div>
          <h3 className="text-xl font-bold text-white mb-2">Import your Portfolios</h3>
          <p className="text-[#94A3B8]">
            Upload your exported LinkedIn PDF, or paste the text from your GitHub / personal portfolio. We use this to extract your verifiable projects for the EWRS cross-referencing.
          </p>
        </div>

        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-[#1E3A5F] before:to-transparent">
          {[
            { step: '01', text: 'Open your LinkedIn profile on a desktop browser.' },
            { step: '02', text: "Click the 'More' button under your headline." },
            { step: '03', text: "Choose 'Save to PDF'." },
            { step: '04', text: 'Upload that PDF here.' }
          ].map((item, i) => (
            <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
              <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-[#07111F] bg-[#1E3A5F] text-white font-bold shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 shadow shadow-[#2563EB]/20 z-10">
                {item.step}
              </div>
              <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-[#1E3A5F] bg-[rgba(255,255,255,0.02)] shadow-sm">
                <p className="text-sm text-[#94A3B8]">{item.text}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 rounded-xl bg-[#2563EB]/10 border border-[#2563EB]/20 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-[#60A5FA] shrink-0 mt-0.5" />
          <p className="text-sm text-[#60A5FA]">
            <strong>Privacy First:</strong> This is your own data, exported by you. We never log in as you or scrape your profile.
          </p>
        </div>
      </div>

      {/* Right Column: Upload/Paste */}
      <div>
        <div className="bg-[rgba(255,255,255,0.03)] border border-[#1E3A5F] rounded-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-8 space-y-6">
            {error && (
              <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-xl p-8 text-center transition-all ${
                isDragging ? 'border-[#60A5FA] bg-[#2563EB]/10' : 'border-[#1E3A5F] hover:border-[#2563EB]/50 hover:bg-[rgba(255,255,255,0.02)]'
              }`}
            >
              <input
                type="file"
                accept=".pdf"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileChange}
              />
              <FileText className="w-8 h-8 text-[#60A5FA] mx-auto mb-3 opacity-80" />
              <h4 className="text-base font-medium text-white mb-1">Drop your LinkedIn or GitHub PDF here</h4>
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="mt-4 px-6 py-2 bg-[#1E3A5F] hover:bg-[#2563EB] text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 mx-auto inline-flex items-center gap-2"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</> : 'Browse Files'}
              </button>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-[#1E3A5F]"></div>
              <span className="flex-shrink-0 mx-4 text-[#94A3B8] text-xs font-semibold uppercase tracking-wider">OR PASTE TEXT</span>
              <div className="flex-grow border-t border-[#1E3A5F]"></div>
            </div>

            <div className="flex flex-col">
              <textarea
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder="Paste your LinkedIn, GitHub, or Portfolio text here..."
                className="w-full h-32 bg-[rgba(255,255,255,0.02)] border border-[#1E3A5F] rounded-xl p-4 text-sm text-white placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#2563EB] resize-none mb-4"
              />
              <button
                onClick={handlePasteSubmit}
                disabled={uploading || !pasteText.trim()}
                className="w-full py-3 bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {uploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</> : 'Analyze pasted profile →'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useAuth } from '@/lib/auth';
import { Loader2, Mail, Phone, MapPin, Linkedin, Link as LinkIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

const supabase = createClient();

export function ProfileTab() {
  const { user, token } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [parsing, setParsing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    async function load() {
      if (!user) return;
      try {
        const { data: currentProfile } = await supabase.from('career_profiles').select('extracted_profile, resume_url').eq('user_id', user.id).single();
        
        const { data: files } = await supabase.storage.from('resumes').list(user.id, {
          sortBy: { column: 'created_at', order: 'desc' }
        });

        const validFiles = files?.filter(f => f.name !== '.emptyFolderPlaceholder' && f.id) || [];

        if (validFiles.length === 0) {
          setProfileData(currentProfile?.extracted_profile || null);
          setLoading(false);
          return;
        }

        const latestResume = validFiles[0];
        const latestResumePath = `${user.id}/${latestResume.name}`;

        if (!currentProfile?.extracted_profile || currentProfile.resume_url !== latestResumePath) {
          setParsing(true);
          const response = await fetch('/api/resume/parse', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ path: latestResumePath, filename: latestResume.name })
          });
          
          if (response.ok) {
            const result = await response.json();
            setProfileData(result.profile);
          } else {
            const errData = await response.json().catch(() => ({}));
            console.error("Parse failed:", errData);
            setError(`Resume uploaded successfully, but profile extraction failed: ${errData.message || 'Server error'}`);
            setProfileData(currentProfile?.extracted_profile || null);
          }
        } else {
          setProfileData(currentProfile.extracted_profile);
        }
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
        setParsing(false);
      }
    }
    load();
  }, [user, token, refreshKey]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError("File must be less than 5MB");
      return;
    }
    
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (!['pdf', 'docx', 'doc'].includes(ext || '')) {
      setError("Please upload a PDF, DOC, or DOCX resume.");
      return;
    }

    setUploading(true);
    setError(null);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(`${user?.id}/${fileName}`, file);

      if (uploadError) throw uploadError;

      // trigger reload which will parse it automatically
      setRefreshKey(prev => prev + 1);
    } catch (err: any) {
      setError(err.message || 'Failed to upload resume.');
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  if (loading || parsing) {
    return (
      <div className="py-20 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        {parsing && <p className="text-gray-500 font-medium">Extracting profile from your latest resume...</p>}
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="text-center py-24 bg-white rounded-2xl border shadow-sm max-w-2xl mx-auto">
        <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <FileText className="w-8 h-8 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">No resume uploaded yet.</h2>
        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Upload your resume to automatically build your Risk-Ume profile.
        </p>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          className="hidden"
          onChange={handleUpload}
          disabled={uploading || parsing || loading}
        />
        <button 
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading || parsing || loading}
          className="inline-flex items-center justify-center px-8 py-3.5 border border-transparent text-sm font-bold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "Uploading..." : "Upload Resume"}
        </button>
      </div>
    );
  }

  const { personal, summary, skills, experience, education, projects, certifications, achievements, languages } = profileData;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-700">
      
      {/* Header / Personal Info */}
      <div className="bg-white p-8 rounded-3xl border shadow-sm flex flex-col md:flex-row gap-8 items-start">
        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 text-3xl font-bold uppercase shrink-0">
          {personal?.fullName?.[0] || '?'}
        </div>
        <div className="space-y-4 flex-1">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{personal?.fullName || 'Anonymous'}</h1>
            {personal?.headline && <p className="text-lg text-gray-500 mt-1">{personal.headline}</p>}
          </div>
          
          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
            {personal?.location && <div className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {personal.location}</div>}
            {personal?.email && <div className="flex items-center gap-1.5"><Mail className="w-4 h-4" /> {personal.email}</div>}
            {personal?.phone && <div className="flex items-center gap-1.5"><Phone className="w-4 h-4" /> {personal.phone}</div>}
            {personal?.linkedin && <div className="flex items-center gap-1.5"><Linkedin className="w-4 h-4" /> {personal.linkedin}</div>}
            {personal?.portfolio && <div className="flex items-center gap-1.5"><LinkIcon className="w-4 h-4" /> {personal.portfolio}</div>}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          
          {/* Summary */}
          {summary && (
            <section className="bg-white p-8 rounded-3xl border shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-4">About</h2>
              <p className="text-gray-600 leading-relaxed">{summary}</p>
            </section>
          )}

          {/* Experience */}
          {experience?.length > 0 && (
            <section className="bg-white p-8 rounded-3xl border shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Experience</h2>
              <div className="space-y-8">
                {experience.map((exp: any, i: number) => (
                  <div key={i} className="relative pl-6 border-l-2 border-gray-100">
                    <div className="absolute w-3 h-3 bg-blue-600 rounded-full -left-[7px] top-1.5 ring-4 ring-white" />
                    <h3 className="font-bold text-gray-900 text-lg">{exp.role}</h3>
                    <div className="text-blue-600 font-medium mb-1">{exp.company} {exp.location && <span className="text-gray-400 font-normal ml-2">• {exp.location}</span>}</div>
                    <div className="text-xs text-gray-500 font-bold uppercase tracking-wider mb-3">
                      {exp.startDate} - {exp.current ? 'Present' : exp.endDate}
                    </div>
                    {exp.description && <p className="text-gray-600 mb-3">{exp.description}</p>}
                    {exp.achievements?.length > 0 && (
                      <ul className="list-disc list-outside ml-4 space-y-1 text-gray-600">
                        {exp.achievements.map((ach: string, j: number) => (
                          <li key={j}>{ach}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Education */}
          {education?.length > 0 && (
            <section className="bg-white p-8 rounded-3xl border shadow-sm">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Education</h2>
              <div className="space-y-6">
                {education.map((edu: any, i: number) => (
                  <div key={i}>
                    <h3 className="font-bold text-gray-900">{edu.degree} {edu.field && `in ${edu.field}`}</h3>
                    <div className="text-gray-600">{edu.institution} {edu.location && `• ${edu.location}`}</div>
                    <div className="text-xs text-gray-400 mt-1">{edu.startDate} - {edu.endDate}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
        
        <div className="space-y-8">
          
          {/* Skills */}
          {skills && (
            <section className="bg-white p-6 rounded-3xl border shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Skills</h2>
              {Array.isArray(skills) ? (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill: string, i: number) => (
                    <Badge key={i} variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700">{skill}</Badge>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(skills).map(([category, items]: [string, any]) => {
                    if (!items || items.length === 0) return null;
                    const label = category.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
                    return (
                      <div key={category}>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">{label}</h3>
                        <div className="flex flex-wrap gap-2">
                          {items.map((skill: string, i: number) => (
                            <Badge key={i} variant="secondary" className="bg-gray-100 hover:bg-gray-200 text-gray-700">{skill}</Badge>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Projects */}
          {projects?.length > 0 && (
            <section className="bg-white p-6 rounded-3xl border shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Projects</h2>
              <div className="space-y-4">
                {projects.map((proj: any, i: number) => (
                  <div key={i} className="border-b last:border-0 pb-4 last:pb-0 border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">{proj.name}</h3>
                    {proj.description && <p className="text-gray-500 text-sm mt-1">{proj.description}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Certifications */}
          {certifications?.length > 0 && (
            <section className="bg-white p-6 rounded-3xl border shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Certifications</h2>
              <div className="space-y-4">
                {certifications.map((cert: any, i: number) => (
                  <div key={i} className="border-b last:border-0 pb-3 last:pb-0 border-gray-100">
                    <h3 className="font-bold text-gray-900 text-sm">{cert.name}</h3>
                    <div className="text-gray-500 text-xs mt-1">
                      {cert.issuer} {cert.date && `• ${cert.date}`}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Achievements */}
          {achievements?.length > 0 && (
            <section className="bg-white p-6 rounded-3xl border shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Achievements</h2>
              <ul className="list-disc list-outside ml-4 space-y-2 text-sm text-gray-600">
                {achievements.map((ach: string, i: number) => (
                  <li key={i}>{ach}</li>
                ))}
              </ul>
            </section>
          )}

          {/* Languages */}
          {languages?.length > 0 && (
            <section className="bg-white p-6 rounded-3xl border shadow-sm">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Languages</h2>
              <div className="space-y-2">
                {languages.map((lang: any, i: number) => (
                  <div key={i} className="flex justify-between items-center text-sm">
                    <span className="font-medium text-gray-900">{lang.name}</span>
                    <span className="text-gray-500">{lang.proficiency}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>

    </div>
  );
}

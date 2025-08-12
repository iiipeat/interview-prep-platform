'use client';

import React, { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from '../../lib/icons';
import { Button } from '../ui/Button';
import { GlassCard } from '../ui/GlassCard';

interface ResumeData {
  fileName: string;
  fileSize: number;
  uploadedAt: Date;
  extractedData?: {
    skills: string[];
    experience: string[];
    education: string[];
    role?: string;
    yearsOfExperience?: number;
  };
}

export const ResumeUpload: React.FC<{
  onResumeProcessed?: (data: ResumeData) => void;
}> = ({ onResumeProcessed }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileUpload = async (file: File) => {
    // Validate file type
    const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a PDF or Word document');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setError(null);
    setIsUploading(true);
    setUploadProgress(0);

    // Simulate upload progress
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + 10;
      });
    }, 200);

    // Simulate processing delay
    setTimeout(() => {
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Mock extracted data
      const mockData: ResumeData = {
        fileName: file.name,
        fileSize: file.size,
        uploadedAt: new Date(),
        extractedData: {
          skills: [
            'JavaScript', 'React', 'Node.js', 'TypeScript', 'Python',
            'SQL', 'Git', 'Agile', 'Problem Solving', 'Communication'
          ],
          experience: [
            'Software Engineer at TechCorp (2020-2023)',
            'Junior Developer at StartupXYZ (2018-2020)',
            'Internship at BigTech Inc (2017-2018)'
          ],
          education: [
            'Bachelor of Computer Science - University of Technology (2014-2018)',
            'Full Stack Web Development Bootcamp (2018)'
          ],
          role: 'Software Engineer',
          yearsOfExperience: 5
        }
      };

      setResumeData(mockData);
      setIsUploading(false);
      onResumeProcessed?.(mockData);
    }, 2000);
  };

  const removeResume = () => {
    setResumeData(null);
    setError(null);
    setUploadProgress(0);
  };

  if (resumeData) {
    return (
      <GlassCard className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold">Resume Uploaded Successfully</h3>
              <p className="text-sm text-gray-600">{resumeData.fileName}</p>
            </div>
          </div>
          <Button
            onClick={removeResume}
            variant="ghost"
            size="sm"
            className="p-1"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {resumeData.extractedData && (
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <h4 className="font-medium mb-2">Detected Information</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Role:</span>
                  <span className="ml-2 font-medium">{resumeData.extractedData.role}</span>
                </div>
                <div>
                  <span className="text-gray-600">Experience:</span>
                  <span className="ml-2 font-medium">{resumeData.extractedData.yearsOfExperience} years</span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">Extracted Skills</h4>
              <div className="flex flex-wrap gap-2">
                {resumeData.extractedData.skills.slice(0, 8).map((skill, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
                {resumeData.extractedData.skills.length > 8 && (
                  <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm">
                    +{resumeData.extractedData.skills.length - 8} more
                  </span>
                )}
              </div>
            </div>

            <div className="pt-2">
              <p className="text-sm text-green-600 font-medium">
                ✓ Questions will be personalized based on your resume
              </p>
            </div>
          </div>
        )}
      </GlassCard>
    );
  }

  return (
    <GlassCard className="p-6">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-all ${
          isDragging
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${isUploading ? 'pointer-events-none opacity-60' : ''}`}
      >
        {isUploading ? (
          <div className="space-y-4">
            <Loader2 className="w-12 h-12 mx-auto text-blue-500 animate-spin" />
            <div>
              <p className="font-medium mb-2">Processing your resume...</p>
              <div className="w-full max-w-xs mx-auto">
                <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2">{uploadProgress}%</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <h3 className="font-semibold text-lg mb-2">
              Upload Your Resume
            </h3>
            <p className="text-gray-600 mb-4">
              Get personalized interview questions based on your experience
            </p>
            <div className="space-y-2">
              <label htmlFor="resume-upload">
                <Button variant="primary" className="cursor-pointer">
                  <FileText className="w-4 h-4 mr-2" />
                  Choose File
                </Button>
                <input
                  id="resume-upload"
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </label>
              <p className="text-sm text-gray-500">
                or drag and drop your file here
              </p>
              <p className="text-xs text-gray-400">
                PDF or Word (Max 5MB)
              </p>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Why upload your resume?</h4>
        <ul className="space-y-1 text-sm text-blue-700">
          <li>• Get questions tailored to your experience level</li>
          <li>• Practice role-specific scenarios</li>
          <li>• Focus on your industry and skills</li>
          <li>• Improve answers about your background</li>
        </ul>
      </div>
    </GlassCard>
  );
};

export default ResumeUpload;
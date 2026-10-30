import { useRef, useState } from 'react';
import { Upload, FileText, Trash2, Loader2, AlertTriangle, Type } from 'lucide-react';
import { extractText, validateFile, countWords, isUsableText, ExtractionError } from '../lib/document';
const KIND_LABEL = {
    resume: {
        title: 'Resume',
        placeholder: 'Paste your resume text here, or upload a PDF, DOCX, or TXT file above...',
        allowJobFields: false,
    },
    jd: {
        title: 'Job Description',
        placeholder: 'Paste the job description here, or upload a file above...',
        allowJobFields: true,
    },
};
export function DocumentPanel({ kind, document: doc, onChange, onError }) {
    const { title, placeholder, allowJobFields } = KIND_LABEL[kind];
    const fileInputRef = useRef(null);
    const [extracting, setExtracting] = useState(false);
    const [dragActive, setDragActive] = useState(false);
    const handleFile = async (file) => {
        const validation = validateFile(file);
        if (!validation.ok) {
            onError(validation.error);
            return;
        }
        setExtracting(true);
        try {
            const result = await extractText(file);
            onChange({
                ...doc,
                fileName: file.name,
                rawText: result.text,
                editedText: result.text,
                source: 'upload',
                extractionNote: result.note,
            });
        }
        catch (err) {
            const message = err instanceof ExtractionError
                ? err.message
                : 'We could not extract text from that file. Please try pasting the text directly.';
            onError(message);
        }
        finally {
            setExtracting(false);
        }
    };
    const onInputChange = (e) => {
        const file = e.target.files?.[0];
        if (file)
            void handleFile(file);
        e.target.value = '';
    };
    const onDrop = (e) => {
        e.preventDefault();
        setDragActive(false);
        const file = e.dataTransfer.files?.[0];
        if (file)
            void handleFile(file);
    };
    const onTextChange = (e) => {
        const text = e.target.value;
        onChange({
            ...doc,
            editedText: text,
            rawText: doc.source === 'paste' ? text : doc.rawText,
            source: doc.source === 'upload' ? 'upload' : 'paste',
        });
    };
    const clearFile = () => {
        onChange({
            kind,
            fileName: null,
            rawText: '',
            editedText: '',
            jobTitle: doc.jobTitle,
            companyName: doc.companyName,
            source: 'paste',
            extractionNote: undefined,
        });
    };
    const words = countWords(doc.editedText);
    const usable = isUsableText(doc.editedText);
    return (<div className="card p-5 sm:p-6 flex flex-col gap-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-navy-900 flex items-center gap-2">
          <FileText className="h-5 w-5 text-teal-500"/>
          {title}
        </h3>
        {doc.fileName && (<button type="button" onClick={clearFile} className="btn-ghost text-xs px-2 py-1" aria-label={`Clear ${title} file`}>
            <Trash2 className="h-3.5 w-3.5"/> Clear
          </button>)}
      </div>

      {/* Upload dropzone */}
      {!doc.fileName && (<div onDragOver={(e) => {
                e.preventDefault();
                setDragActive(true);
            }} onDragLeave={() => setDragActive(false)} onDrop={onDrop} className={`rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${dragActive ? 'border-teal-400 bg-teal-50' : 'border-navy-200 bg-navy-50/40 hover:border-navy-300'}`}>
          <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt" onChange={onInputChange} className="sr-only" id={`file-${kind}`} aria-label={`Upload ${title} file`}/>
          {extracting ? (<div className="flex flex-col items-center gap-2">
              <Loader2 className="h-7 w-7 animate-spin text-teal-500"/>
              <p className="text-sm text-navy-600">Extracting text...</p>
            </div>) : (<label htmlFor={`file-${kind}`} className="flex flex-col items-center gap-2 cursor-pointer">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-navy-100 text-navy-600">
                <Upload className="h-6 w-6"/>
              </span>
              <span className="text-sm font-medium text-navy-700">
                Drop a file here or <span className="text-teal-600 underline">browse</span>
              </span>
              <span className="text-xs text-navy-400">PDF, DOCX, or TXT — up to 10 MB</span>
            </label>)}
        </div>)}

      {/* File info */}
      {doc.fileName && (<div className="flex items-start gap-3 rounded-lg bg-navy-50 border border-navy-100 px-3 py-2.5">
          <FileText className="mt-0.5 h-4 w-4 flex-shrink-0 text-navy-600"/>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-navy-800 truncate">{doc.fileName}</p>
            <p className="text-xs text-navy-500">{words} words</p>
          </div>
          {doc.source === 'upload' && (<span className="badge bg-navy-100 text-navy-600">
              <Upload className="h-3 w-3"/> Uploaded
            </span>)}
        </div>)}

      {/* Scanned PDF note */}
      {doc.extractionNote && (<div className="flex items-start gap-2 rounded-lg bg-amber-50 border border-amber-200 px-3 py-2.5 text-sm text-amber-800">
          <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0"/>
          <p>{doc.extractionNote}</p>
        </div>)}

      {/* Job fields (JD only) */}
      {allowJobFields && (<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="label" htmlFor={`jobTitle-${kind}`}>
              Job title <span className="text-navy-400 font-normal">(optional)</span>
            </label>
            <input id={`jobTitle-${kind}`} type="text" className="input" placeholder="e.g. Senior Frontend Engineer" value={doc.jobTitle || ''} onChange={(e) => onChange({ ...doc, jobTitle: e.target.value })}/>
          </div>
          <div>
            <label className="label" htmlFor={`company-${kind}`}>
              Company <span className="text-navy-400 font-normal">(optional)</span>
            </label>
            <input id={`company-${kind}`} type="text" className="input" placeholder="e.g. Acme Cloud" value={doc.companyName || ''} onChange={(e) => onChange({ ...doc, companyName: e.target.value })}/>
          </div>
        </div>)}

      {/* Text editor */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="label mb-0 flex items-center gap-1.5" htmlFor={`text-${kind}`}>
            <Type className="h-4 w-4 text-navy-500"/>
            {doc.fileName ? 'Review and correct extracted text' : 'Or paste text directly'}
          </label>
          <span className={`text-xs font-medium ${usable ? 'text-teal-600' : 'text-navy-400'}`}>
            {words} words{usable ? '' : ` (min 20 to analyze)`}
          </span>
        </div>
        <textarea maxLength={100000} id={`text-${kind}`} className="input font-mono text-xs leading-relaxed h-48 resize-y scrollbar-thin" placeholder={placeholder} value={doc.editedText} onChange={onTextChange} spellCheck={false} aria-label={`${title} text editor`}/>
      </div>
    </div>);
}

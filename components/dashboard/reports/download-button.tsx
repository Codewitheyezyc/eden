"use client";

import { Download } from "lucide-react";

interface DownloadButtonProps {
  title: string;
  content: string;
  authorName: string;
  authorRole: string;
  date: string;
}

export function DownloadButton({ title, content, authorName, authorRole, date }: DownloadButtonProps) {
  const handleDownload = () => {
    // Generate an HTML document that Word can read
    const htmlContent = `
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head>
  <meta charset='utf-8'>
  <title>${title}</title>
  <style>
    body { font-family: 'Calibri', 'Arial', sans-serif; line-height: 1.6; }
    h1 { color: #000; }
    .meta { color: #666; font-size: 14px; margin-bottom: 20px; }
    hr { border-top: 1px solid #ccc; margin: 20px 0; }
    img { max-width: 100%; height: auto; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div class="meta">
    <p><strong>Written by:</strong> ${authorName} (${authorRole} Report)</p>
    <p><strong>Date:</strong> ${date}</p>
  </div>
  <hr>
  <div>
    ${content}
  </div>
</body>
</html>
    `;

    // Create blob and download as .doc file
    const blob = new Blob(['\ufeff', htmlContent], {
      type: 'application/msword'
    });
    
    // Create download link and trigger click
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const safeTitle = title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    link.download = `${safeTitle}.doc`;
    
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <button
      onClick={handleDownload}
      className="inline-flex items-center justify-center bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 px-4 py-2 rounded-xl text-sm font-medium transition-colors border border-emerald-200 dark:border-emerald-500/20"
    >
      <Download size={16} className="mr-2" />
      Download (.doc)
    </button>
  );
}

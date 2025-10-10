import React, { useState } from "react";
import { Button } from "@/components/ui/button";

interface AttachmentProps {
  fileUrl: string | null;
  fileName: string;
}

const TicketAttachment: React.FC<AttachmentProps> = ({ fileUrl, fileName }) => {
  const [fileExists, setFileExists] = useState(true);
  const [showPreview, setShowPreview] = useState(false);

  const handleClick = (e: React.MouseEvent) => {
    if (!fileExists || !fileUrl) {
      e.preventDefault();
      alert("File not available.");
    } else if (fileUrl.match(/\.(jpg|jpeg|png|gif)$/i)) {
      e.preventDefault();
      setShowPreview(true);
    }
  };

  const handleError = () => {
    setFileExists(false);
  };

  return (
    <div>
      {fileUrl ? (
        <>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleClick}
          >
            <Button
              disabled={!fileExists}
              variant={fileExists ? "default" : "destructive"}
            >
              {fileName}
            </Button>
          </a>

          {/* Hidden image to check file existence */}
          <img
            src={fileUrl}
            className="hidden"
            onError={handleError}
            alt=""
          />

          {/* Image preview modal */}
          {showPreview && (
            <div
              className="fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4"
              onClick={() => setShowPreview(false)}
            >
              <img
                src={fileUrl}
                alt={fileName}
                className="max-h-[90%] max-w-[90%] rounded shadow-lg"
              />
            </div>
          )}
        </>
      ) : (
        <Button variant="destructive" disabled>
          {fileName} (Unavailable)
        </Button>
      )}
    </div>
  );
};

export default TicketAttachment;

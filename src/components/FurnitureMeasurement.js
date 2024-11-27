import React, { useState, useRef, useEffect } from 'react';
import { Download, Check, Upload } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const FurnitureMeasurement = () => {
  const [lines, setLines] = useState([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [image, setImage] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  // Scale factor (1 pixel = 1cm for demonstration)
  const scaleFactor = 1;

  useEffect(() => {
    if (canvasRef.current) {
      drawCanvas();
    }
  }, [lines, image]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          const canvas = canvasRef.current;
          const maxWidth = 800;
          const maxHeight = 600;
          let width = img.width;
          let height = img.height;
          
          // Calculate aspect ratio to maintain proportions
          if (width > maxWidth) {
            const ratio = maxWidth / width;
            width = maxWidth;
            height = height * ratio;
          }
          if (height > maxHeight) {
            const ratio = maxHeight / height;
            height = maxHeight;
            width = width * ratio;
          }
          
          canvas.width = width;
          canvas.height = height;
          drawCanvas();
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  };

  const drawCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw the uploaded image
    if (image) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    // Draw all lines
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    lines.forEach((line, index) => {
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();

      // Draw line number with background
      const midX = (line.start.x + line.end.x) / 2;
      const midY = (line.start.y + line.end.y) / 2;
      
      // White background for better visibility
      ctx.fillStyle = 'white';
      ctx.fillRect(midX - 12, midY - 12, 24, 24);
      
      // Black border around background
      ctx.strokeStyle = 'black';
      ctx.strokeRect(midX - 12, midY - 12, 24, 24);
      
      // Line number
      ctx.fillStyle = 'black';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(index + 1, midX, midY);
    });
  };

  const handleMouseDown = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPoint({ x, y });
    setIsDrawing(true);
  };

  const handleMouseMove = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    drawCanvas();
    
    // Draw current line
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(startPoint.x, startPoint.y);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const handleMouseUp = (e) => {
    if (!isDrawing) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newLine = {
      start: startPoint,
      end: { x, y },
      length: Math.sqrt(
        Math.pow(x - startPoint.x, 2) + 
        Math.pow(y - startPoint.y, 2)
      ) * scaleFactor
    };

    setLines([...lines, newLine]);
    setIsDrawing(false);
    setStartPoint(null);
  };

  const handleComplete = () => {
    setShowResults(true);
  };

  const downloadMeasurements = () => {
    const measurements = lines.map((line, index) => 
      `Line ${index + 1}: ${line.length.toFixed(2)} cm`
    ).join('\n');
    
    const blob = new Blob([measurements], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'furniture_measurements.txt';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  const downloadOutline = () => {
    const canvas = canvasRef.current;
    const link = document.createElement('a');
    link.download = 'furniture_lines_outline.png';
    
    // Create a new canvas for white background with same dimensions
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = canvas.width;
    exportCanvas.height = canvas.height;
    const ctx = exportCanvas.getContext('2d');
    
    // Fill white background
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw only the lines
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    lines.forEach(line => {
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();

      // Draw line number with background
      const midX = (line.start.x + line.end.x) / 2;
      const midY = (line.start.y + line.end.y) / 2;
      
      // White background for better visibility
      ctx.fillStyle = 'white';
      ctx.fillRect(midX - 12, midY - 12, 24, 24);
      
      // Black border around background
      ctx.strokeStyle = 'black';
      ctx.strokeRect(midX - 12, midY - 12, 24, 24);
      
      // Line number
      ctx.fillStyle = 'black';
      ctx.font = '14px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(lines.indexOf(line) + 1, midX, midY);
    });
    
    link.href = exportCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardContent className="p-6">
        <div className="mb-4 flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload Image
          </Button>
          <Button
            onClick={handleComplete}
            variant="secondary"
            className="flex items-center gap-2"
          >
            <Check className="w-4 h-4" /> Complete
          </Button>
        </div>

        <div className="border rounded-lg overflow-hidden mb-4 bg-gray-50">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => setIsDrawing(false)}
            className="cursor-crosshair"
            width="800"
            height="600"
          />
        </div>

        {showResults && (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-4 py-2 border">Line Number</th>
                    <th className="px-4 py-2 border">Dimension (cm)</th>
                  </tr>
                </thead>
                <tbody>
                  {lines.map((line, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 border text-center">{index + 1}</td>
                      <td className="px-4 py-2 border text-center">
                        {line.length.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2">
              <Button
                onClick={downloadMeasurements}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Measurements
              </Button>
              <Button
                onClick={downloadOutline}
                className="flex items-center gap-2"
              >
                <Download className="w-4 h-4" /> Download Outline
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FurnitureMeasurement;

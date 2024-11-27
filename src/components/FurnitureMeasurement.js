import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, Ruler, Move, Copy, Pencil, Bezier } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const FurnitureMeasurement = () => {
  const [lines, setLines] = useState([]);
  const [curves, setCurves] = useState([]);
  const [selectedTool, setSelectedTool] = useState('line');
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState(null);
  const [image, setImage] = useState(null);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const [controlPoints, setControlPoints] = useState([]);
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);
  const [currentLine, setCurrentLine] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);

  useEffect(() => {
    if (canvasRef.current) {
      drawCanvas();
    }
  }, [lines, curves, image, selectedTool, currentLine, selectedLine]);

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.size > 20 * 1024 * 1024) {
        setError('File size should be less than 20MB');
        return;
      }
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Please upload a valid image (JPEG, PNG, WEBP)');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          setImage(img);
          const canvas = canvasRef.current;
          const maxWidth = window.innerWidth * 0.8;
          const maxHeight = window.innerHeight * 0.6;
          
          // Responsive image scaling
          let width = img.width;
          let height = img.height;
          
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
          setError(null);
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

    // Draw background image
    if (image) {
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    }

    // Draw lines
    ctx.strokeStyle = 'red';
    ctx.lineWidth = 2;
    lines.forEach((line, index) => {
      ctx.beginPath();
      ctx.moveTo(line.start.x, line.start.y);
      ctx.lineTo(line.end.x, line.end.y);
      ctx.stroke();

      // Highlight selected line
      if (selectedLine === index) {
        ctx.strokeStyle = 'yellow';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(line.start.x, line.start.y);
        ctx.lineTo(line.end.x, line.end.y);
        ctx.stroke();
        ctx.strokeStyle = 'red';
        ctx.lineWidth = 2;
      }
    });

    // Draw curves
    ctx.strokeStyle = 'blue';
    curves.forEach((curve) => {
      ctx.beginPath();
      ctx.moveTo(curve[0].x, curve[0].y);
      
      if (curve.length === 3) {
        // Quadratic curve
        ctx.quadraticCurveTo(
          curve[1].x, curve[1].y, 
          curve[2].x, curve[2].y
        );
      } else if (curve.length === 4) {
        // Bezier curve
        ctx.bezierCurveTo(
          curve[1].x, curve[1].y,
          curve[2].x, curve[2].y,
          curve[3].x, curve[3].y
        );
      }
      
      ctx.stroke();
    });

    // Draw current drawing element
    if (currentLine) {
      ctx.beginPath();
      ctx.moveTo(currentLine.start.x, currentLine.start.y);
      ctx.lineTo(currentLine.end.x, currentLine.end.y);
      ctx.stroke();
    }
  };

  const handleMouseDown = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (selectedTool) {
      case 'line':
        setStartPoint({ x, y });
        setIsDrawing(true);
        break;
      case 'curve':
        if (controlPoints.length < 3) {
          setControlPoints([...controlPoints, { x, y }]);
        }
        break;
      case 'select':
        const selectedLineIndex = lines.findIndex(line => isPointNearLine({ x, y }, line));
        if (selectedLineIndex !== -1) {
          setSelectedLine(selectedLineIndex);
        }
        break;
    }
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (isDrawing && selectedTool === 'line') {
      setCurrentLine({
        start: startPoint,
        end: { x, y }
      });
    }
  };

  const handleMouseUp = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    switch (selectedTool) {
      case 'line':
        if (isDrawing) {
          const newLine = {
            start: startPoint,
            end: { x, y },
            length: calculateDistance(startPoint, { x, y })
          };
          setLines([...lines, newLine]);
          setIsDrawing(false);
          setCurrentLine(null);
        }
        break;
      case 'curve':
        if (controlPoints.length === 3) {
          setCurves([...curves, controlPoints]);
          setControlPoints([]);
        }
        break;
    }
  };

  const calculateDistance = (point1, point2) => {
    return Math.sqrt(
      Math.pow(point2.x - point1.x, 2) + 
      Math.pow(point2.y - point1.y, 2)
    );
  };

  const isPointNearLine = (point, line, tolerance = 5) => {
    const distance = distancePointToLine(point, line.start, line.end);
    return distance < tolerance;
  };

  const distancePointToLine = (point, lineStart, lineEnd) => {
    const A = point.x - lineStart.x;
    const B = point.y - lineStart.y;
    const C = lineEnd.x - lineStart.x;
    const D = lineEnd.y - lineStart.y;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;
    if (param < 0) {
      xx = lineStart.x;
      yy = lineStart.y;
    } else if (param > 1) {
      xx = lineEnd.x;
      yy = lineEnd.y;
    } else {
      xx = lineStart.x + param * C;
      yy = lineStart.y + param * D;
    }

    return Math.sqrt(
      Math.pow(point.x - xx, 2) + 
      Math.pow(point.y - yy, 2)
    );
  };

  const duplicateLine = () => {
    if (selectedLine !== null) {
      const lineToDuplicate = lines[selectedLine];
      setLines([...lines, lineToDuplicate]);
    }
  };

  const downloadOutline = () => {
    const canvas = canvasRef.current;
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');

    // Set canvas size and white background
    tempCanvas.width = canvas.width;
    tempCanvas.height = canvas.height;
    tempCtx.fillStyle = 'white';
    tempCtx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

    // Draw lines and curves
    tempCtx.strokeStyle = 'black';
    tempCtx.lineWidth = 2;

    // Draw lines
    lines.forEach(line => {
      tempCtx.beginPath();
      tempCtx.moveTo(line.start.x, line.start.y);
      tempCtx.lineTo(line.end.x, line.end.y);
      tempCtx.stroke();
    });

    // Draw curves
    curves.forEach((curve) => {
      tempCtx.beginPath();
      tempCtx.moveTo(curve[0].x, curve[0].y);
      
      if (curve.length === 3) {
        // Quadratic curve
        tempCtx.quadraticCurveTo(
          curve[1].x, curve[1].y, 
          curve[2].x, curve[2].y
        );
      } else if (curve.length === 4) {
        // Bezier curve
        tempCtx.bezierCurveTo(
          curve[1].x, curve[1].y,
          curve[2].x, curve[2].y,
          curve[3].x, curve[3].y
        );
      }
      
      tempCtx.stroke();
    });

    // Create download link
    const link = document.createElement('a');
    link.download = 'furniture_outline.png';
    link.href = tempCanvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderToolbar = () => {
    const tools = [
      { name: 'line', icon: <Pencil /> }, // Added Pencil icon
      { name: 'curve', icon: <Bezier /> }, // Added Bezier icon
      { name: 'select', icon: <Move /> }, // Added Move icon
    ];

    return (
      <div className="flex gap-2 mb-4 bg-gray-100 p-2 rounded-lg">
        {tools.map((tool) => (
          <Button
            key={tool.name}
            variant={selectedTool === tool.name ? 'default' : 'outline'}
            onClick={() => setSelectedTool(tool.name)}
            className="flex items-center gap-2"
          >
            {tool.icon}
            {tool.name.charAt(0).toUpperCase() + tool.name.slice(1)}
          </Button>
        ))}
        {selectedLine !== null && (
          <Button 
            onClick={duplicateLine}
            className="flex items-center gap-2"
          >
            <Copy className="w-5 h-5" /> Duplicate
          </Button>
        )}
      </div>
    );
  };

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Ruler className="w-6 h-6" /> Advanced Furniture Measurement Tool
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-4">
        <div className="flex gap-2 items-center">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
          />
          <Button 
            onClick={() => fileInputRef.current.click()}
            className="flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Upload Image
          </Button>
        </div>

        {renderToolbar()}

        <div className="border rounded-lg overflow-hidden bg-gray-50 flex justify-center">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={() => {
              setIsDrawing(false);
              setCurrentLine(null);
            }}
            className="cursor-crosshair max-w-full"
            width="800"
            height="600"
          />
        </div>

        {(lines.length > 0 || curves.length > 0) && (
          <div className="space-y-4">
            <div className="flex gap-2">
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
